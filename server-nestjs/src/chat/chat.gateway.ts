
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { parse } from 'cookie';
import { COOKIE_NAME } from '../common/constants'; // Added import

@WebSocketGateway({
    namespace: '/chat',
    cors: {
        origin: '*',
        credentials: true
    },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Track online users: userId -> Set of socket IDs
    private static onlineUsers = new Map<number, Set<string>>();

    constructor(
        private authService: AuthService,
        private chatService: ChatService
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Get token from cookie (if browser) or auth header
            const cookieHeader = client.handshake.headers.cookie;
            let token = '';

            if (cookieHeader) {
                const cookies = parse(cookieHeader);
                if (cookies[COOKIE_NAME]) { // Use COOKIE_NAME constant
                    token = cookies[COOKIE_NAME];
                }
            }

            // Fallback to Bearer token if no cookie
            if (!token && client.handshake.headers.authorization) {
                token = client.handshake.headers.authorization.split(' ')[1];
            }

            // Fallback to handshake auth (for cross-origin without cookies)
            if (!token && client.handshake.auth?.token) {
                token = client.handshake.auth.token;
            }

            if (!token) {
                console.log(`Chat: Disconnecting client ${client.id} (No token). Handshake:`, {
                    hasCookie: !!cookieHeader,
                    hasAuth: !!client.handshake.auth?.token
                });
                client.disconnect();
                return;
            }

            const payload = await this.authService.verifySession(token);
            if (!payload) {
                console.log(`Chat: Disconnecting client ${client.id} (Invalid token)`);
                client.disconnect();
                return;
            }

            const user = await this.authService.findUserByOpenId(payload.openId);
            if (!user) {
                client.disconnect();
                return;
            }

            client.data.user = user;

            // Join user-specific room for notifications
            client.join(`user_${user.id}`);

            // Presence Tracking
            if (!ChatGateway.onlineUsers.has(user.id)) {
                ChatGateway.onlineUsers.set(user.id, new Set());
                // Broadcast online status to everyone
                this.server.emit('userStatus', { userId: user.id, status: 'online' });
            }
            const onlineSet = ChatGateway.onlineUsers.get(user.id);
            if (onlineSet) {
                onlineSet.add(client.id);
            }

            console.log(`Chat: User ${user.name} (${user.id}) connected. Total online: ${ChatGateway.onlineUsers.size}`);

        } catch (error) {
            console.error('Chat Connection Error:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (user && ChatGateway.onlineUsers.has(user.id)) {
            const userSockets = ChatGateway.onlineUsers.get(user.id);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    ChatGateway.onlineUsers.delete(user.id);
                    // Broadcast offline status
                    this.server.emit('userStatus', { userId: user.id, status: 'offline' });
                    console.log(`Chat: User ${user.name} (${user.id}) disconnected (last socket).`);
                }
            }
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: number; content: string; recipientId: number; vendorId?: number }) {
        let sender = client.data.user;

        if (!sender) {
            // Re-authenticate if user data is missing
            // Get token from cookie (if browser) or auth header
            const cookieHeader = client.handshake.headers.cookie;
            let token = '';

            if (cookieHeader) {
                const cookies = parse(cookieHeader);
                if (cookies[COOKIE_NAME]) {
                    token = cookies[COOKIE_NAME];
                }
            }

            if (!token && client.handshake.headers.authorization) {
                token = client.handshake.headers.authorization.split(' ')[1];
            }

            if (token) {
                const payload = await this.authService.verifySession(token);
                if (payload) {
                    sender = await this.authService.findUserByOpenId(payload.openId);
                    if (sender) {
                        client.data.user = sender;
                    }
                }
            }
        }

        if (!sender) throw new UnauthorizedException();

        // If conversationId is provided, we use it. If not (new chat), we need vendorId.
        const result = await this.chatService.sendMessage(
            sender.id,
            sender.role,
            payload.conversationId,
            payload.content,
            payload.recipientId,
            payload.vendorId
        );

        // Notify recipient if online - use the recipientId returned from service
        const notificationRecipientId = result.recipientId || payload.recipientId;

        if (notificationRecipientId) {
            const recipientRoom = `user_${notificationRecipientId}`;
            console.log(`Chat: Notifying recipient ${notificationRecipientId} on namespace /chat (Room: ${recipientRoom})`);
            this.server.to(recipientRoom).emit('receiveMessage', result.message);
        }

        // Also notify sender's other tabs/sockets
        this.server.to(`user_${sender.id}`).except(client.id).emit('receiveMessage', result.message);

        console.log(`Chat: Message from ${sender.name} sent successfully to conversation ${result.conversationId}. Room was user_${notificationRecipientId}`);

        // Return whole result to sender
        return result;
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: number; recipientId: number }) {
        const user = client.data.user;
        if (!user) return;

        // payload.recipientId here SHOULD be the person who SENT the messages (the one waiting for blue ticks).
        // e.g. If Admin reads Vendor's message, payload.recipientId = VendorId.


        await this.chatService.markAsRead(payload.conversationId, user.id, user.role);

        // Notify the original sender that their messages were read
        if (payload.recipientId) {
            const senderRoom = `user_${payload.recipientId}`;
            this.server.to(senderRoom).emit('messagesRead', {
                conversationId: payload.conversationId,
                readerId: user.id
            });
        }
    }

    @SubscribeMessage('messageDelivered')
    async handleMessageDelivered(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: number; recipientId: number; conversationId: number }) {
        const user = client.data.user;
        if (!user) return;

        await this.chatService.updateMessageStatus(payload.messageId, 'delivered');

        // Notify the sender that their message was delivered
        if (payload.recipientId) {
            const senderRoom = `user_${payload.recipientId}`;
            this.server.to(senderRoom).emit('messageStatusUpdate', {
                messageId: payload.messageId,
                status: 'delivered',
                conversationId: payload.conversationId
            });
        }
    }

    @SubscribeMessage('typing')
    handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: number; recipientId: number; isTyping: boolean }) {
        const user = client.data.user;
        if (!user) return;

        if (payload.recipientId) {
            const recipientRoom = `user_${payload.recipientId}`;
            this.server.to(recipientRoom).emit('userTyping', {
                conversationId: payload.conversationId,
                userId: user.id,
                isTyping: payload.isTyping
            });
        }
    }

    @SubscribeMessage('checkUserStatus')
    handleCheckUserStatus(@MessageBody() userId: number) {
        const uid = Number(userId);

        const userSockets = ChatGateway.onlineUsers.get(uid);
        if (userSockets) {
            // Lazy cleanup of potentially stale socket IDs
            for (const socketId of Array.from(userSockets)) {
                // Check if socket exists in this namespace
                // @ts-ignore - types might be loose, but treating strict map access
                if (!this.server.sockets.has(socketId)) {
                    userSockets.delete(socketId);
                }
            }

            if (userSockets.size > 0) {
                return {
                    userId: uid,
                    status: 'online'
                };
            }
        }

        return {
            userId: uid,
            status: 'offline'
        };
    }

    @SubscribeMessage('joinConversation')
    handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: number) {
        // Optional: Join a specific conversation room if we want room-based broadcasting instead of user-based
        client.join(`conversation_${conversationId}`);
        return { event: 'joinedConversation', id: conversationId };
    }
    broadcastMessage(message: any, recipientId?: number) {
        if (recipientId) {
            const recipientRoom = `user_${recipientId}`;
            this.server.to(recipientRoom).emit('receiveMessage', message);
        }
        // Also notify sender (in case they have multiple tabs/screens open)
        // message.senderId should be available in message object
        if (message.senderId) {
            const senderRoom = `user_${message.senderId}`;
            this.server.to(senderRoom).emit('receiveMessage', message);
        }
    }
}
