import { Module } from '@nestjs/common';
import { InstallmentsController } from './installments.controller';
import { InstallmentsService } from './installments.service';
import { InstallmentsCronService } from './installments.cron';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [MailModule, NotificationsModule],
    controllers: [InstallmentsController],
    providers: [InstallmentsService, InstallmentsCronService],
    exports: [InstallmentsService],
})
export class InstallmentsModule { }
