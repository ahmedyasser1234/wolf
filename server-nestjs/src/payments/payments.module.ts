import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [HttpModule, DatabaseModule],
    providers: [PaymentsService],
    controllers: [PaymentGatewaysController],
    exports: [PaymentsService],
})
export class PaymentsModule { }
