
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
                auth: {
                    user,
                    pass,
                },
                tls: {
                    // Do not fail on invalid certs (common for custom SMTP/VPS)
                    rejectUnauthorized: false
                },
                // If using port 587, often STARTTLS is required
                requireTLS: Number(port) === 587,
                connectionTimeout: 15000, // 15 seconds
                greetingTimeout: 15000,
                socketTimeout: 15000,
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
}
