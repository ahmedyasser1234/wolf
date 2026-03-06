
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
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // true for 465, false for other ports
                auth: {
                    user,
                    pass,
                },
            });
            this.logger.log('📧 Mail transport initialized');
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

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from,
                    to,
                    subject,
                    text,
                });
                this.logger.log(`✅ Order confirmation email sent to ${to} for order ${orderNumber}`);
            } catch (error) {
                this.logger.error(`❌ Failed to send email to ${to}:`, error);
            }
        } else {
            this.logger.log(`📝 [Mail Log] To: ${to} | Subject: ${subject}`);
            this.logger.log(`📝 [Mail Log] Content: ${text}`);
        }
    }
}
