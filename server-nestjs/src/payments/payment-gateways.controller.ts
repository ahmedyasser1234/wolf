import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { paymentGateways } from '../database/schema';
import { eq } from 'drizzle-orm';

@Controller('payment-gateways')
export class PaymentGatewaysController {
    constructor(private readonly databaseService: DatabaseService) { }

    @Get('enabled')
    async listEnabled() {
        return await this.databaseService.db
            .select({
                id: paymentGateways.id,
                name: paymentGateways.name,
                displayNameAr: paymentGateways.displayNameAr,
                displayNameEn: paymentGateways.displayNameEn,
                logo: paymentGateways.logo,
            })
            .from(paymentGateways)
            .where(eq(paymentGateways.isActive, true));
    }
}
