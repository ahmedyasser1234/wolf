import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { emailTemplates } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class EmailTemplatesService implements OnModuleInit {
    constructor(private databaseService: DatabaseService) { }

    async onModuleInit() {
        await this.seedDefaultTemplates();
    }

    async findAll() {
        return await this.databaseService.db.select().from(emailTemplates);
    }

    async findByType(type: string) {
        const [template] = await this.databaseService.db
            .select()
            .from(emailTemplates)
            .where(eq(emailTemplates.type, type))
            .limit(1);
        return template;
    }

    async updateTemplate(type: string, data: any) {
        return await this.databaseService.db
            .update(emailTemplates)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(emailTemplates.type, type))
            .returning();
    }

    replacePlaceholders(template: string, replacements: Record<string, string | number>) {
        let result = template;
        for (const [key, value] of Object.entries(replacements)) {
            const placeholder = `{{${key}}}`;
            result = result.split(placeholder).join(String(value));
        }
        return result;
    }

    async seedTemplates() {
        await this.seedDefaultTemplates();
        return { success: true };
    }

    public async seedDefaultTemplates() {
        const defaults = [
            {
                type: 'otp_registration',
                nameAr: 'كود التحقق - تسجيل جديد',
                nameEn: 'OTP - Registration',
                subjectAr: 'كود التحقق الخاص بك - WolfTechno 🐺',
                subjectEn: 'Your Verification Code - WolfTechno 🐺',
                bodyAr: 'مرحباً بك في WolfTechno! 🐺💙\n\nكود التحقق الخاص بك هو: {{otpCode}}\nهذا الكود صالح لمدة 15 دقيقة فقط.',
                bodyEn: 'Welcome to WolfTechno! 🐺💙\n\nYour verification code is: {{otpCode}}\nThis code is valid for 15 minutes only.',
                variables: ['otpCode'],
            },
            {
                type: 'otp_password_reset',
                nameAr: 'كود التحقق - استعادة كلمة المرور',
                nameEn: 'OTP - Password Reset',
                subjectAr: 'استعادة كلمة المرور - WolfTechno 🐺',
                subjectEn: 'Reset Your Password - WolfTechno 🐺',
                bodyAr: 'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.\n\nكود التحقق هو: {{otpCode}}\nإذا لم تطلب أنت هذا، يرجى تجاهل البريد.',
                bodyEn: 'You have requested to reset your password.\n\nYour verification code is: {{otpCode}}\nIf you did not request this, please ignore this email.',
                variables: ['otpCode'],
            },
            {
                type: 'order_confirmation',
                nameAr: 'تأكيد استلام الطلب',
                nameEn: 'Order Confirmation',
                subjectAr: 'تم استلام طلبك بنجاح - WolfTechno 🐺',
                subjectEn: 'Your order has been received successfully - WolfTechno 🐺',
                bodyAr: 'شكراً لك على الشراء من WolfTechno 🐺💙\n\nتم استلام طلبك بنجاح، وجاري الآن تجهيز الطلب بعناية ليصل إليك في أسرع وقت ممكن.\n\nرقم الطلب: {{orderNumber}}\n\nسيتم التواصل معك قريباً لتأكيد تفاصيل الشحن والتوصيل.\nنتمنى لك تجربة تسوق رائعة معنا. 🚀',
                bodyEn: 'Thank you for shopping at WolfTechno 🐺💙\n\nYour order has been received successfully and is being prepared with care.\n\nOrder Number: {{orderNumber}}\n\nWe will contact you soon to confirm shipping details.\nWe wish you a great shopping experience. 🚀',
                variables: ['orderNumber'],
            },
            {
                type: 'order_status_accepted',
                nameAr: 'تحديث الطلب - مقبول',
                nameEn: 'Order Status - Accepted',
                subjectAr: 'تم قبول طلبك بنجاح - WolfTechno 🐺',
                subjectEn: 'Your order has been accepted - WolfTechno 🐺',
                bodyAr: 'مرحباً بك!\n\nتم قبول طلبك رقم #{{orderNumber}} بنجاح، وجارٍ تجهيزه بعناية ليصل إليك في أقرب وقت. 📦✨\n\nشكراً لثقتك بنا! 💙',
                bodyEn: 'Hello!\n\nYour order #{{orderNumber}} has been accepted successfully and is being prepared to reach you soon. 📦✨\n\nThank you for your trust! 💙',
                variables: ['orderNumber'],
            },
            {
                type: 'order_status_shipped',
                nameAr: 'تحديث الطلب - تم الشحن',
                nameEn: 'Order Status - Shipped',
                subjectAr: 'تم شحن طلبك! 🚚 - WolfTechno 🐺',
                subjectEn: 'Your order has been shipped! 🚚 - WolfTechno 🐺',
                bodyAr: 'خبر سعيد! 🎉\n\nتم شحن طلبك رقم #{{orderNumber}} وهو الآن في الطريق إليك. 🚀\n\nنتمنى أن تنال منتجاتنا إعجابك! 🐺💙',
                bodyEn: 'Great news! 🎉\n\nYour order #{{orderNumber}} has been shipped and is on its way to you. 🚀\n\nWe hope you enjoy our products! 🐺💙',
                variables: ['orderNumber'],
            },
            {
                type: 'order_status_rejected',
                nameAr: 'تحديث الطلب - مرفوض',
                nameEn: 'Order Status - Rejected',
                subjectAr: 'تحديث بخصوص طلبك - WolfTechno 🐺',
                subjectEn: 'Update regarding your order - WolfTechno 🐺',
                bodyAr: 'نعتذر منك، تم رفض طلبك رقم #{{orderNumber}}.\nالسبب: {{reason}}\n\nإذا كان لديك أي استفسار، يرجى التواصل مع الدعم الفني. 🐺',
                bodyEn: 'We apologize, your order #{{orderNumber}} has been rejected.\nReason: {{reason}}\n\nIf you have any questions, please contact technical support. 🐺',
                variables: ['orderNumber', 'reason'],
            },
            {
                type: 'gift_card_notification',
                nameAr: 'إشعار كارت هدية',
                nameEn: 'Gift Card Notification',
                subjectAr: 'وصلتك هدية! 🎁 - WolfTechno 🐺',
                subjectEn: 'You got a gift! 🎁 - WolfTechno 🐺',
                bodyAr: 'مرحباً بك! ✨\n\nلديك مفاجأة رائعة! لقد أرسل لك {{senderName}} كارت هدية بقيمة {{amount}} درهم. 🎊\n\nيمكنك استخدام هذا الكود عند الدفع للحصول على خصم مباشر على مشترياتك:\nكود الهدية: {{code}}\n\nنتمنى لك تجربة تسوق ممتعة! 🐺💙',
                bodyEn: 'Hello! ✨\n\nYou have a wonderful surprise! {{senderName}} has sent you a gift card worth {{amount}} AED. 🎊\n\nYou can use this code at checkout to get a direct discount on your purchases:\nGift Code: {{code}}\n\nWe wish you an enjoyable shopping experience! 🐺💙',
                variables: ['senderName', 'amount', 'code'],
            },
            {
                type: 'new_offer_notification',
                nameAr: 'إشعار عرض جديد',
                nameEn: 'New Offer Notification',
                subjectAr: 'عرض جديد حصري لك! 🔥 - WolfTechno 🐺',
                subjectEn: 'Exclusive New Offer for You! 🔥 - WolfTechno 🐺',
                bodyAr: 'مرحباً بك! ✨\n\nلدينا عرض جديد رائع من أجلك: "{{offerName}}"\nاستمتع بخصم يصل إلى {{discount}}%! 🎊\n{{code}} \n\nلا تفوت الفرصة وتسوق الآن! 🚀🛒\n\nWolfTechno 🐺',
                bodyEn: 'Hello! ✨\n\nWe have a great new offer for you: "{{offerName}}"\nEnjoy a discount of up to {{discount}}%! 🎊\n{{code}} \n\nDon\'t miss the chance and shop now! 🚀🛒\n\nWolfTechno 🐺',
                variables: ['offerName', 'discount', 'code'],
            }
        ];

        for (const template of defaults) {
            const existing = await this.findByType(template.type);
            if (!existing) {
                await this.databaseService.db.insert(emailTemplates).values({
                    ...template,
                    updatedAt: new Date(),
                });
            }
        }
    }
}
