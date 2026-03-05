import { Module } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardsController } from './gift-cards.controller';
import { DatabaseModule } from '../database/database.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [DatabaseModule, WalletsModule, AuthModule, PaymentsModule],
    providers: [GiftCardsService],
    controllers: [GiftCardsController],
    exports: [GiftCardsService],
})
export class GiftCardsModule { }
