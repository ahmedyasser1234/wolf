import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
    imports: [DatabaseModule, AuthModule, WalletsModule],
    controllers: [PointsController],
    providers: [PointsService],
    exports: [PointsService],
})
export class PointsModule { }
