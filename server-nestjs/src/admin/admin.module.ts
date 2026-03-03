import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [AuthModule, DatabaseModule, NotificationsModule],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService]
})
export class AdminModule { }
