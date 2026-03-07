
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && user && pass) {
            this.logger.log(`📧 Initializing mail transport for ${host}:${port} (Secure: ${Number(port) === 465})`);

            this.transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465, // true for 465, false for other ports
                pool: true, // Use connection pooling
                maxConnections: 5,
                maxMessages: 100,
                auth: {
                    user,
                    pass,
                },
                tls: {
                    // Do not fail on invalid certs (common for custom SMTP/VPS)
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2'
                },
                // If using port 587, often STARTTLS is required
                requireTLS: Number(port) === 587,
                connectionTimeout: 30000, // 30 seconds
                greetingTimeout: 30000,
                socketTimeout: 30000,
                debug: true, // Show protocol logs in console
                logger: true, // Use nodemailer's internal logger
            });

            // Verify connection configuration on startup
            this.transporter.verify((error, success) => {
                if (error) {
                    this.logger.error(`❌ Mail transport verification failed (${host}:${port}):`, error.message);
                    if ((error as any).code === 'ETIMEDOUT') {
                        this.logger.error('💡 Hint: Check if your server or firewall is blocking outbound connections on this port.');
                    }
                } else {
                    this.logger.log('📧 Mail transport verified and ready');
                }
            });
        } else {
            this.logger.warn('⚠️ SMTP configuration missing. MailService will log emails to console instead of sending.');
        }
    }

    async sendOTP(to: string, code: string, type: 'registration' | 'password_reset') {
        const subject = type === 'registration'
            ? 'كود التحقق الخاص بك - WolfTechno 🐺'
            : 'استعادة كلمة المرور - WolfTechno 🐺';

        const message = type === 'registration'
            ? `مرحباً بك في WolfTechno! 🐺💙\n\nكود التحقق الخاص بك هو: ${code}\nهذا الكود صالح لمدة 15 دقيقة فقط.`
            : `لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.\n\nكود التحقق هو: ${code}\nإذا لم تطلب أنت هذا، يرجى تجاهل البريد.`;

        await this.sendMail(to, subject, message);
    }

    async sendOrderConfirmation(to: string, orderNumber: string) {
        const from = this.configService.get<string>('MAIL_FROM') || '"WolfTechno" <noreply@wolftechno.com>';
        const subject = 'تم استلام طلبك بنجاح - WolfTechno 🐺';
        const text = `
شكراً لك على الشراء من WolfTechno 🐺💙

تم استلام طلبك بنجاح، وجاري الآن تجهيز الطلب بعناية ليصل إليك في أسرع وقت ممكن.

رقم الطلب: ${orderNumber}

سيتم التواصل معك قريباً لتأكيد تفاصيل الشحن والتوصيل.
إذا كان لديك أي استفسار أو تحتاج إلى مساعدة، يسعد فريق WolfTechno دائماً خدمتك.

نتمنى لك تجربة تسوق رائعة معنا، ونشكرك على ثقتك بنا. 🚀
`;

        await this.sendMail(to, subject, text);
    }

    async sendMail(to: string, subject: string, text: string) {
        const from = this.configService.get<string>('MAIL_FROM') || '"WolfTechno" <noreply@wolftechno.com>';

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from,
                    to,
                    subject,
                    text,
                });
                this.logger.log(`✅ Email sent to ${to} | Subject: ${subject}`);
            } catch (error) {
                this.logger.error(`❌ Failed to send email to ${to}:`, error);
            }
        } else {
            this.logger.log(`📝 [Mail Log Preview] To: ${to} | Subject: ${subject}`);
            this.logger.log(`📝 [Mail Log Preview] Content: ${text}`);
        }
    }

    async sendOrderStatusEmail(to: string, orderNumber: string, statusKey: 'accepted' | 'shipped' | 'rejected', reason?: string) {
        let subject = '';
        let message = '';

        switch (statusKey) {
            case 'accepted':
                subject = 'تم قبول طلبك بنجاح - WolfTechno 🐺';
                message = `مرحباً بك!\n\nتم قبول طلبك رقم #${orderNumber} بنجاح، وجارٍ تجهيزه بعناية ليصل إليك في أقرب وقت. 📦✨\n\nشكراً لثقتك بنا! 💙`;
                break;
            case 'shipped':
                subject = 'تم شحن طلبك! 🚚 - WolfTechno 🐺';
                message = `خبر سعيد! 🎉\n\nتم شحن طلبك رقم #${orderNumber} وهو الآن في الطريق إليك. 🚀\n\nنتمنى أن تنال منتجاتنا إعجابك! 🐺💙`;
                break;
            case 'rejected':
                subject = 'تحديث بخصوص طلبك - WolfTechno 🐺';
                message = `نعتذر منك، تم رفض طلبك رقم #${orderNumber}.\n${reason ? `السبب: ${reason}` : ''}\n\nإذا كان لديك أي استفسار، يرجى التواصل مع الدعم الفني. 🐺`;
                break;
        }

        await this.sendMail(to, subject, message);
    }

    async sendNewOfferEmail(to: string, offerName: string, discount: string, code?: string) {
        const subject = 'عرض جديد حصري لك! 🔥 - WolfTechno 🐺';
        const message = `مرحباً بك! ✨\n\nلدينا عرض جديد رائع من أجلك: "${offerName}"\nاستمتع بخصم يصل إلى ${discount}%! 🎊\n${code ? `استخدم الكود: ${code}` : ''}\n\nلا تفوت الفرصة وتسوق الآن! 🚀🛒\n\nWolfTechno 🐺`;

        await this.sendMail(to, subject, message);
    }

    async sendGiftCardNotification(to: string, senderName: string, amount: number, code: string) {
        const subject = 'وصلتك هدية! 🎁 - WolfTechno 🐺';
        const websiteUrl = this.configService.get<string>('FRONTEND_URL') || 'https://wolftechno.com';

        const message = `مرحباً بك! ✨\n\nلديك مفاجأة رائعة! لقد أرسل لك ${senderName} كارت هدية بقيمة ${amount} درهم. 🎊\n\nيمكنك استخدام هذا الكود عند الدفع للحصول على خصم مباشر على مشترياتك:\nكود الهدية: ${code}\n\nتسوق الآن واستمتع بهديتك: ${websiteUrl}\n\nنتمنى لك تجربة تسوق ممتعة! 🐺💙`;

        await this.sendMail(to, subject, message);
    }
}
