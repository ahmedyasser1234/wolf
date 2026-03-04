
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { conversations, messages, users, vendors } from '../database/schema';
import { eq, and, or, desc, asc, inArray, sql } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
    constructor(
        private databaseService: DatabaseService,
        private notificationsService: NotificationsService
    ) { }

    async getConversations(userId: number, role: string) {
        // Find conversations where user is participant
        // If customer, users.id = conversations.customerId
        // If vendor, users.id must be mapped to vendorId? Or we check vendor table ownership.


        let userCondition;
        let vendorId;

        if (role === 'admin') {
            // Admin logic:
            // 1. Can act as "Customer" (talking to vendors) -> conversations.customerId = userId
            // 2. Can act as "Fustan Support" (talking to customers) -> conversations.vendorId = supportVendor.id

            const [supportVendor] = await this.databaseService.db
                .select()
                .from(vendors)
                .where(eq(vendors.userId, userId))
                .limit(1);

            const supportId = supportVendor?.id;

            if (supportId) {
                userCondition = or(
                    eq(conversations.customerId, userId),
                    eq(conversations.vendorId, supportId)
                );
            } else {
                userCondition = eq(conversations.customerId, userId);
            }

        } else if (role === 'vendor') {
            const [vendor] = await this.databaseService.db
                .select()
                .from(vendors)
                .where(eq(vendors.userId, userId))
                .limit(1);

            if (vendor) {
                vendorId = vendor.id;
                userCondition = eq(conversations.vendorId, vendor.id);
            } else {
                return [];
            }
        } else {
            userCondition = eq(conversations.customerId, userId);
        }

        const chats = await this.databaseService.db
            .select({
                conversation: conversations,
                lastMessage: messages,
                counterpart: {
                    id: users.id,
                    name: users.name,
                    avatar: users.avatar,
                    email: users.email
                },
                store: {
                    id: vendors.id,
                    userId: vendors.userId, // Needed for presence check
                    nameAr: vendors.storeNameAr,
                    nameEn: vendors.storeNameEn,
                    logo: vendors.logo,
                    email: vendors.email
                }
            })
            .from(conversations)
            .leftJoin(messages, eq(conversations.lastMessageId, messages.id))
            .leftJoin(users, eq(conversations.customerId, users.id))
            .leftJoin(vendors, eq(conversations.vendorId, vendors.id))
            .where(userCondition)
            .orderBy(desc(conversations.updatedAt));

        // Format for frontend
        return chats.map(chat => {
            // Determine if I am acting as the "Customer" in this specific conversation
            // This applies to:
            // 1. Regular Customers
            // 2. Admins talking to Vendors (Admin ID == customerId)
            const isActingAsCustomer = chat.conversation.customerId === userId;

            return {
                id: chat.conversation.id,
                counterpartName: isActingAsCustomer
                    ? chat.store?.nameAr ?? chat.store?.nameEn // If I am customer, I see Store Name
                    : chat.counterpart?.name, // If I am Vendor (or Support), I see Customer Name
                counterpartEmail: isActingAsCustomer
                    ? chat.store?.email
                    : chat.counterpart?.email,
                counterpartImage: isActingAsCustomer
                    ? chat.store?.logo // If I am customer, I see Store Logo
                    : chat.counterpart?.avatar, // If I am Vendor (or Support), I see Customer Avatar
                lastMessage: chat.lastMessage?.content,
                lastMessageTime: chat.conversation.updatedAt,
                unread: false, // TODO: calc unread count
                // CRITICAL FIX: For presence, we need the UserID of the counterpart.
                // If I am the Customer (or Admin acting as Customer), counterpart is Vendor (store.userId).
                // If I am the Vendor (or Admin acting as Support), counterpart is Customer (customerId).

                // Logic:
                // If my ID matches customerId -> Counterpart is Vendor -> use store.userId
                // If my ID matches vendor.userId (or I'm support) -> Counterpart is Customer -> use customerId

                recipientId: (chat.conversation.customerId === userId)
                    ? chat.store?.userId
                    : chat.conversation.customerId,
                // Also return vendorId for routing/API calls that need specific vendor ID
                vendorId: chat.conversation.vendorId,
            };
        });
    }

    async getMessages(conversationId: number, userId: number) {
        // Validate access? (Skipping strictly for MVP speed, but should check if user part of chat)

        return await this.databaseService.db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(asc(messages.createdAt));
    }

    async sendMessage(senderId: number, senderRole: string, conversationId: number | null, content: string, recipientId?: number, vendorId?: number) {
        // Logs removed for performance

        // Creating new conversation if null
        let convId = conversationId;

        if (!convId) {
            // New chat
            if (senderRole === 'admin') {
                if (vendorId) {
                    // Admin chatting with vendor
                    const [existing] = await this.databaseService.db
                        .select()
                        .from(conversations)
                        .where(and(
                            eq(conversations.customerId, senderId),
                            eq(conversations.vendorId, vendorId)
                        ));
                    if (existing) {
                        convId = existing.id;
                    } else {
                        const [newConv] = await this.databaseService.db.insert(conversations).values({
                            customerId: senderId,
                            vendorId: vendorId,
                            updatedAt: new Date(),
                            createdAt: new Date(),
                        }).returning();
                        convId = newConv.id;
                    }
                } else if (recipientId) {
                    console.log("ChatService: Admin -> Customer path");
                    // Admin chatting with customer
                    // Find or create "Fustan Support" vendor
                    let [supportVendor] = await this.databaseService.db
                        .select()
                        .from(vendors)
                        .where(eq(vendors.userId, senderId))
                        .limit(1);

                    if (!supportVendor) {
                        console.log("ChatService: Creating Fustan Support vendor...");
                        [supportVendor] = await this.databaseService.db.insert(vendors).values({
                            userId: senderId, // Bind to the admin sending the message
                            storeNameAr: 'دعم فستان',
                            storeNameEn: 'Fustan Support',
                            storeSlug: 'fustan-support',
                            email: 'support@fustan.com',
                            phone: '0000000000',
                            descriptionAr: 'System Support',
                            descriptionEn: 'System Support',
                            logo: 'https://placehold.co/400x400/e91e63/ffffff?text=FS',
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }).returning();
                    }

                    console.log(`ChatService: Using Support Vendor ${supportVendor.id}`);

                    if (supportVendor) {
                        const [existing] = await this.databaseService.db
                            .select()
                            .from(conversations)
                            .where(and(
                                eq(conversations.customerId, recipientId),
                                eq(conversations.vendorId, supportVendor.id)
                            ));
                        if (existing) {
                            convId = existing.id;
                        } else {
                            const [newConv] = await this.databaseService.db.insert(conversations).values({
                                customerId: recipientId,
                                vendorId: supportVendor.id,
                                updatedAt: new Date(),
                                createdAt: new Date(),
                            }).returning();
                            convId = newConv.id;
                        }
                    } else {
                        throw new NotFoundException('Failed to initialize Support Vendor');
                    }
                }
            } else if (senderRole === 'vendor' && recipientId) {
                // Vendor chatting with customer
                const [vendor] = await this.databaseService.db
                    .select()
                    .from(vendors)
                    .where(eq(vendors.userId, senderId))
                    .limit(1);

                if (!vendor) throw new NotFoundException('Vendor profile not found');

                const [existing] = await this.databaseService.db
                    .select()
                    .from(conversations)
                    .where(and(
                        eq(conversations.customerId, recipientId),
                        eq(conversations.vendorId, vendor.id)
                    ));

                if (existing) {
                    convId = existing.id;
                } else {
                    const [newConv] = await this.databaseService.db
                        .insert(conversations)
                        .values({
                            customerId: recipientId,
                            vendorId: vendor.id,
                            updatedAt: new Date(),
                            createdAt: new Date(),
                        })
                        .returning();
                    convId = newConv.id;
                }
            } else if (senderRole === 'customer' && vendorId) {
                const [existing] = await this.databaseService.db
                    .select()
                    .from(conversations)
                    .where(and(
                        eq(conversations.customerId, senderId),
                        eq(conversations.vendorId, vendorId)
                    ));

                if (existing) {
                    convId = existing.id;
                } else {
                    const [newConv] = await this.databaseService.db
                        .insert(conversations)
                        .values({
                            customerId: senderId,
                            vendorId: vendorId,
                            updatedAt: new Date(),
                            createdAt: new Date(),
                        })
                        .returning();
                    convId = newConv.id;
                }
            } else {
                throw new NotFoundException('Conversation setup failed');
            }
        }

        // Insert Message
        const [message] = await this.databaseService.db
            .insert(messages)
            .values({
                conversationId: convId!,
                senderId: senderId,
                senderRole: senderRole,
                content: content,
                createdAt: new Date(),
                isRead: false,
                status: 'sent'
            })
            .returning();

        // Update conversation last message
        await this.databaseService.db
            .update(conversations)
            .set({
                lastMessageId: message.id,
                updatedAt: new Date()
            })
            .where(eq(conversations.id, convId!));

        // Determine recipientId (UserID) for notifications
        let finalRecipientId = recipientId;
        if (!finalRecipientId) {
            const [conv] = await this.databaseService.db
                .select({
                    customerId: conversations.customerId,
                    vendorId: conversations.vendorId,
                })
                .from(conversations)
                .where(eq(conversations.id, convId!))
                .limit(1);

            if (conv) {
                // Universal Logic: Determine who the sender is in the conversation
                if (conv.customerId === senderId) {
                    // Sender is acting as Customer -> Recipient is Vendor Owner
                    const [v] = await this.databaseService.db
                        .select({ userId: vendors.userId })
                        .from(vendors)
                        .where(eq(vendors.id, conv.vendorId))
                        .limit(1);

                    if (v) {
                        finalRecipientId = v.userId;
                    }
                } else {
                    // Sender is Vendor Owner (or Admin acting as Vendor/Support) -> Recipient is Customer
                    finalRecipientId = conv.customerId;
                }
            }
        }

        // Send notification to recipient if offline/not focusing chat
        if (finalRecipientId) {
            console.log(`ChatService: Notifying recipient ${finalRecipientId} about message ${message.id} (Type: new_message)`);
            await this.notificationsService.notify(
                finalRecipientId,
                'new_message',
                'رسالة جديدة',
                content.length > 50 ? content.substring(0, 47) + '...' : content,
                convId!
            );
        } else {
            console.warn(`ChatService: No recipientId found for message ${message.id} in conversation ${convId}`);
        }

        return { message, conversationId: convId, recipientId: finalRecipientId };
    }

    async getUnreadCount(userId: number, role: string) {
        // Find my vendor profile if any
        const [vendor] = await this.databaseService.db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.userId, userId))
            .limit(1);

        const myVendorId = vendor?.id;

        const whereClause = and(
            eq(messages.isRead, false),
            sql`${messages.senderId} != ${userId}`, // Not sent by me
            or(
                eq(conversations.customerId, userId), // I am the customer in this chat
                myVendorId ? eq(conversations.vendorId, myVendorId) : sql`false` // I am the vendor in this chat
            )
        );

        const [result] = await this.databaseService.db
            .select({
                count: sql<number>`count(*)`
            })
            .from(messages)
            .innerJoin(conversations, eq(messages.conversationId, conversations.id))
            .where(whereClause);

        return Number(result?.count || 0);
    }

    async updateMessageStatus(messageId: number, status: string) {
        return await this.databaseService.db
            .update(messages)
            .set({ status })
            .where(eq(messages.id, messageId));
    }

    async markAsRead(conversationId: number, userId: number, role: string) {
        return await this.databaseService.db
            .update(messages)
            .set({
                isRead: true,
                status: 'read'
            })
            .where(and(
                eq(messages.conversationId, conversationId),
                sql`${messages.senderId} != ${userId}`, // Not sent by me
                or(
                    eq(messages.status, 'sent'),
                    eq(messages.status, 'delivered')
                )
            ));
    }
}
