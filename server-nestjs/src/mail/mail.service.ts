
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
        const host = this.cleanConfig(this.configService.get<string>('SMTP_HOST'));
        const port = this.configService.get<string>('SMTP_PORT');
        const user = this.cleanConfig(this.configService.get<string>('SMTP_USER'));
        const pass = this.cleanConfig(this.configService.get<string>('SMTP_PASS'));

        if (host && user && pass) {
            this.logger.log(`📧 Initializing mail transport for ${host}:${port}`);
            // Very detailed masked debugging
            const passLength = pass.length;
            const firstChar = pass[0];
            const lastChar = pass[pass.length - 1];
            const firstCharCode = pass.charCodeAt(0);
            const lastCharCode = pass.charCodeAt(pass.length - 1);
            
            this.logger.log(`📧 SMTP Config Check: Host=${host}, User=${user}`);
            this.logger.log(`📧 SMTP Pass Debug: Length=${passLength}, FirstChar='${firstChar}'(${firstCharCode}), LastChar='${lastChar}'(${lastCharCode})`);

            this.transporter = nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                pool: false, 
                name: 'wolftechno.com', // Ehlo name
                auth: { user, pass },
                authMethod: 'LOGIN', // Move to top level
                tls: { 
                    rejectUnauthorized: false, 
                    minVersion: 'TLSv1.2',
                    ciphers: 'SSLv3' // Sometimes needed for legacy-ish SMTP
                },
                debug: true, 
                logger: true,
                connectionTimeout: 30000,
            } as any);

            this.transporter.verify((error) => {
                if (error) {
                    this.logger.error(`❌ Mail transport verification failed for ${user}:`, error.message);
                } else {
                    this.logger.log(`📧 Mail transport verified and ready for ${user}`);
                }
            });
        } else {
            this.logger.warn('⚠️ SMTP configuration missing. MailService will log emails to console.');
        }
    }

    private cleanConfig(val: string | undefined): string | undefined {
        if (!val) return val;
        let cleaned = val.trim();
        // Remove surrounding ' or " only if they balance out
        if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return cleaned;
    }

    async sendOTP(to: string, code: string, type: 'registration' | 'password_reset') {
        const templateType = type === 'registration' ? 'otp_registration' : 'otp_password_reset';
        const template = await this.emailTemplatesService.findByType(templateType);

        if (template) {
            await this.sendTemplateEmail(to, template, { otpCode: code });
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
            await this.sendTemplateEmail(to, template, { orderNumber });
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
            await this.sendTemplateEmail(to, template, { orderNumber, reason: reason || '' });
        } else {
            let subject = 'تحديث بخصوص طلبك - WolfTechno 🐺';
            let message = `تحديث لطلبك رقم #${orderNumber}`;
            await this.sendMail(to, subject, message);
        }
    }

    async sendGiftCardNotification(to: string, senderName: string, amount: number, code: string) {
        const template = await this.emailTemplatesService.findByType('gift_card_notification');
        if (template) {
            await this.sendTemplateEmail(to, template, { senderName, amount, code });
        } else {
            const subject = 'وصلتك هدية! 🎁 - WolfTechno 🐺';
            const message = `لقد أرسل لك ${senderName} كارت هدية بقيمة ${amount} درهم. الكود: ${code}`;
            await this.sendMail(to, subject, message);
        }
    }

    async sendNewOfferEmail(to: string, offerName: string, discount: string, code?: string) {
        const template = await this.emailTemplatesService.findByType('new_offer_notification');
        if (template) {
            await this.sendTemplateEmail(to, template, { 
                offerName, 
                discount, 
                code: code || '' 
            });
        } else {
            const subject = 'عرض جديد حصري لك! 🔥 - WolfTechno 🐺';
            const message = `لدينا عرض جديد: ${offerName} بخصم ${discount}%!`;
            await this.sendMail(to, subject, message);
        }
    }

    private async sendTemplateEmail(to: string, template: any, variables: Record<string, string | number>) {
        const subject = `${template.subjectAr} | ${template.subjectEn}`;
        
        const bodyAr = this.emailTemplatesService.replacePlaceholders(template.bodyAr, variables);
        const bodyEn = this.emailTemplatesService.replacePlaceholders(template.bodyEn, variables);

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
                ${bodyAr.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: ltr; text-align: left;">
                ${bodyEn.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
        `;
        
        const text = `${bodyAr}\n\n---\n\n${bodyEn}`;
        
        await this.sendMail(to, subject, text, html);
    }

    async sendMail(to: string, subject: string, text: string, html?: string) {
        const from = this.configService.get<string>('MAIL_FROM') || '"WolfTechno" <noreply@wolftechno.com>';
        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, text, html });
                this.logger.log(`✅ Email sent to ${to} | Subject: ${subject}`);
            } catch (error) {
                this.logger.error(`❌ Failed to send email to ${to}:`, error.message);
                if (error.stack) {
                    this.logger.debug(error.stack);
                }
            }
        } else {
            this.logger.warn(`📝 [Mail Simulation] SMTP not configured. Email to ${to} was NOT sent.`);
            this.logger.log(`📝 [Mail simulation] Subject: ${subject}`);
            this.logger.log(`📝 [Mail simulation] Content (Text): ${text}`);
            if (html) {
                this.logger.log(`📝 [Mail simulation] Content (HTML length): ${html.length} chars`);
            }
        }
    }
}
