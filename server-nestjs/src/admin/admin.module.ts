import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminCronService } from './admin.cron';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';

import { NotificationsModule } from '../notifications/notifications.module';
import { MediaModule } from '../media/media.module';

@Module({
    imports: [AuthModule, DatabaseModule, NotificationsModule, MediaModule],
    controllers: [AdminController],
    providers: [AdminService, AuthService, NotificationsService, AdminCronService],
})
export class AdminModule { }
