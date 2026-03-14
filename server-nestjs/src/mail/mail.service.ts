
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplatesService } from '../email-templates/email-templates.service';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(
        private configService: ConfigService,
        private emailTemplatesService: EmailTemplatesService
    ) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && user && pass) {
            this.logger.log(`📧 Initializing mail transport for ${host}:${port}`);

            this.transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                auth: { user, pass },
                tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
                requireTLS: Number(port) === 587,
                connectionTimeout: 30000,
            });

            this.transporter.verify((error) => {
                if (error) {
                    this.logger.error(`❌ Mail transport verification failed:`, error.message);
                } else {
                    this.logger.log('📧 Mail transport verified and ready');
                }
            });
        } else {
            this.logger.warn('⚠️ SMTP configuration missing. MailService will log emails to console.');
        }
    }

    async sendOTP(to: string, code: string, type: 'registration' | 'password_reset') {
        const templateType = type === 'registration' ? 'otp_registration' : 'otp_password_reset';
        const template = await this.emailTemplatesService.findByType(templateType);

        if (template) {
            const subject = template.subjectAr; // Defaulting to Arabic for now as per project theme
            const body = this.emailTemplatesService.replacePlaceholders(template.bodyAr, { otpCode: code });
            await this.sendMail(to, subject, body);
        } else {
            // Fallback
            const subject = type === 'registration' ? 'كود التحقق الخاص بك - WolfTechno 🐺' : 'استعادة كلمة المرور - WolfTechno 🐺';
            const message = type === 'registration'
                ? `مرحباً بك في WolfTechno! 🐺💙\n\nكود التحقق الخاص بك هو: ${code}`
                : `لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.\n\nكود التحقق هو: ${code}`;
            await this.sendMail(to, subject, message);
        }
    }

    async sendOrderConfirmation(to: string, orderNumber: string) {
        const template = await this.emailTemplatesService.findByType('order_confirmation');
        if (template) {
            const subject = template.subjectAr;
            const body = this.emailTemplatesService.replacePlaceholders(template.bodyAr, { orderNumber });
            await this.sendMail(to, subject, body);
        } else {
            const subject = 'تم استلام طلبك بنجاح - WolfTechno 🐺';
            const text = `تم استلام طلبك بنجاح رقم: ${orderNumber}`;
            await this.sendMail(to, subject, text);
        }
    }

    async sendOrderStatusEmail(to: string, orderNumber: string, statusKey: 'accepted' | 'shipped' | 'rejected', reason?: string) {
        const templateType = `order_status_${statusKey}`;
        const template = await this.emailTemplatesService.findByType(templateType);

        if (template) {
            const subject = template.subjectAr;
            const body = this.emailTemplatesService.replacePlaceholders(template.bodyAr, { orderNumber, reason: reason || '' });
            await this.sendMail(to, subject, body);
        } else {
            // Fallback to original logic
            let subject = 'تحديث بخصوص طلبك - WolfTechno 🐺';
            let message = `تحديث لطلبك رقم #${orderNumber}`;
            await this.sendMail(to, subject, message);
        }
    }

    async sendGiftCardNotification(to: string, senderName: string, amount: number, code: string) {
        const template = await this.emailTemplatesService.findByType('gift_card_notification');
        if (template) {
            const subject = template.subjectAr;
            const body = this.emailTemplatesService.replacePlaceholders(template.bodyAr, { senderName, amount, code });
            await this.sendMail(to, subject, body);
        } else {
            const subject = 'وصلتك هدية! 🎁 - WolfTechno 🐺';
            const message = `لقد أرسل لك ${senderName} كارت هدية بقيمة ${amount} درهم. الكود: ${code}`;
            await this.sendMail(to, subject, message);
        }
    }

    async sendMail(to: string, subject: string, text: string) {
        const from = this.configService.get<string>('MAIL_FROM') || '"WolfTechno" <noreply@wolftechno.com>';
        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, text });
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
