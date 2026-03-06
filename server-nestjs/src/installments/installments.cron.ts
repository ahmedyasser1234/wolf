import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { installmentPayments, users, orders } from '../database/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InstallmentsCronService {
    private readonly logger = new Logger(InstallmentsCronService.name);

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) { }

    // Run every day at 9:00 AM
    @Cron('0 9 * * *')
    async handleInstallmentNotifications() {
        this.logger.log('Starting daily installment notifications check...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        try {
            // 1. Notify Customers about upcoming payments (due tomorrow)
            const upcomingPayments = await this.databaseService.db
                .select({
                    payment: installmentPayments,
                    customer: users,
                    order: orders
                })
                .from(installmentPayments)
                .innerJoin(users, eq(installmentPayments.customerId, users.id))
                .innerJoin(orders, eq(installmentPayments.orderId, orders.id))
                .where(
                    and(
                        eq(installmentPayments.status, 'pending'),
                        gte(installmentPayments.dueDate, tomorrow),
                        lte(installmentPayments.dueDate, tomorrowEnd)
                    )
                );

            for (const { payment, customer, order } of upcomingPayments) {
                const amount = payment.amount;
                const orderNum = order.orderNumber;

                // Email
                if (customer.email) {
                    await this.mailService.sendMail(
                        customer.email,
                        'تذكير بموعد القسط - فستان',
                        `عزيزي ${customer.name || 'عميلنا'}، نود تذكيرك بأن موعد القسط القادم للطلب رقم #${orderNum} هو غداً. المبلغ المستحق: ${amount}. يرجى السداد عبر لوحة التحكم الخاصة بك.`
                    );
                }

                // In-app Notification
                await this.notificationsService.notify(
                    customer.id,
                    'installment_reminder',
                    'تذكير بموعد القسط 💳',
                    `موعد القسط القادم للطلب رقم #${orderNum} هو غداً. المبلغ: ${amount}`,
                    order.id
                );
            }

            // 2. Notify Admins about overdue payments (due today or earlier, still pending)
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const overduePayments = await this.databaseService.db
                .select({
                    payment: installmentPayments,
                    customer: users,
                    order: orders
                })
                .from(installmentPayments)
                .innerJoin(users, eq(installmentPayments.customerId, users.id))
                .innerJoin(orders, eq(installmentPayments.orderId, orders.id))
                .where(
                    and(
                        eq(installmentPayments.status, 'pending'),
                        lte(installmentPayments.dueDate, todayEnd)
                    )
                );

            if (overduePayments.length > 0) {
                const message = `هناك ${overduePayments.length} أقساط مستحقة لم يتم سدادها حتى الآن.`;
                await this.notificationsService.notifyAdmins(
                    'installment_overdue',
                    '⚠️ تنبيه: أقساط متأخرة',
                    message,
                    null
                );
            }

            this.logger.log(`Notifications sent: ${upcomingPayments.length} customers, Admin alert for ${overduePayments.length} overdue.`);

        } catch (error) {
            this.logger.error('Failed to process installment notifications', error);
        }
    }
}
