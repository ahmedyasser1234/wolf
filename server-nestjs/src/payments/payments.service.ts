import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { paymentGateways } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PaymentsService {
    constructor(
        private configService: ConfigService,
        private databaseService: DatabaseService,
        private httpService: HttpService
    ) { }

    async getActiveCardGateway() {
        const gateways = await this.databaseService.db
            .select()
            .from(paymentGateways)
            .where(eq(paymentGateways.isActive, true));

        // Filter out non-card gateways
        const cardGateways = gateways.filter(g => 
            !['cash_on_delivery', 'installments', 'cash'].includes(g.name) && 
            (g.secretKey || g.publishableKey)
        );

        if (cardGateways.length === 0) return null;

        // Return the first one (prioritize stripe if multiple are active)
        const stripe = cardGateways.find(g => g.name === 'stripe');
        return stripe || cardGateways[0];
    }

    private async getGatewayConfig(name: string) {
        const [gateway] = await this.databaseService.db
            .select()
            .from(paymentGateways)
            .where(eq(paymentGateways.name, name))
            .limit(1);

        const noKeyRequired = ['cash_on_delivery', 'installments', 'cash'];
        if (!gateway || (!gateway.secretKey && !noKeyRequired.includes(name))) {
            console.error(`Gateway configuration missing for: ${name}`);
            return null;
        }

        return gateway;
    }

    async createCheckoutSession(gatewayName: string, orderId: number, amount: number, customerEmail: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL');
        console.log(`🌐 [PaymentsService] START createCheckoutSession`);
        console.log(`   - Gateway: ${gatewayName}, Order: ${orderId}, Amount: ${amount}`);
        console.log(`   - FRONTEND_URL from Config: ${frontendUrl}`);

        const config = await this.getGatewayConfig(gatewayName);

        if (!config && gatewayName !== 'cash_on_delivery') {
            throw new BadRequestException(`بوابة الدفع ${gatewayName} غير مهيأة بعد`);
        }

        switch (gatewayName) {
            case 'stripe':
                return this.handleStripePayment(config!, orderId, amount, customerEmail);

            case 'tap':
                return this.handleTapPayment(config!, orderId, amount, customerEmail);

            case 'paymob':
                return this.handlePaymobPayment(config!, orderId, amount, customerEmail);

            case 'geidea':
                return this.handleGeideaPayment(config!, orderId, amount, customerEmail);

            case 'mamo':
                return this.handleMamoPayment(config!, orderId, amount, customerEmail);

            case 'cash_on_delivery':
                return { url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}&method=cod` };

            case 'installments':
            case 'cash':
                // Handled internally - redirect directly to success
                return { url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}&method=${gatewayName}` };

            case 'payby':
                return this.handlePaybyPayment(config!, orderId, amount, customerEmail);

            case 'dpo_pay':
                return this.handleDpoPayment(config!, orderId, amount, customerEmail);

            case 'ccavenue':
                return this.handleCCAvenuePayment(config!, orderId, amount, customerEmail);

            case 'tigerpay':
            case 'paymennt':
            case 'utap':
            case 'my_network':
            case 'omnispay':
            case 'vaultspay':
            case 'afspro':
                return this.handleGenericHostedPayment(gatewayName, config!, orderId, amount, customerEmail);

            default:
                // For other gateways, return placeholder for now or common pattern
                console.log(`[PaymentsService] Redirecting to placeholder for ${gatewayName} for Order #${orderId}`);
                return { url: `${this.configService.get('FRONTEND_URL')}/checkout/process?gateway=${gatewayName}&orderId=${orderId}` };
        }
    }

    async createGiftCardCheckoutSession(gatewayName: string, giftCardId: number, amount: number, customerEmail: string) {
        const config = await this.getGatewayConfig(gatewayName);

        if (!config) {
            throw new BadRequestException(`بوابة الدفع ${gatewayName} غير مهيأة بعد`);
        }

        if (gatewayName === 'stripe') {
            const stripe = new Stripe(config.secretKey, {
                apiVersion: '2023-10-16' as any,
            });

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'sar',
                            product_data: {
                                name: `شراء بطاقة هدية`,
                            },
                            unit_amount: Math.round(amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${this.configService.get('FRONTEND_URL')}/profile?gift_card_success=${giftCardId}`,
                cancel_url: `${this.configService.get('FRONTEND_URL')}/profile?gift_card_cancel=true`,
                customer_email: customerEmail,
                metadata: {
                    giftCardId: giftCardId.toString(),
                    type: 'gift_card'
                },
            });

            return { url: session.url };
        }

        throw new BadRequestException(`بوابة الدفع ${gatewayName} غير مدعومة بعد لشراء بطاقات الهدايا`);
    }

    async createWalletTopUpSession(gatewayName: string, userId: number, amount: number, customerEmail: string) {
        const config = await this.getGatewayConfig(gatewayName);

        if (!config) {
            throw new BadRequestException(`بوابة الدفع ${gatewayName} غير مهيأة بعد`);
        }

        if (gatewayName === 'stripe') {
            const stripe = new Stripe(config.secretKey, {
                apiVersion: '2023-10-16' as any,
            });

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'sar',
                            product_data: {
                                name: `شحن رصيد المحفظة`,
                            },
                            unit_amount: Math.round(amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${this.configService.get('FRONTEND_URL')}/wallet?topup_success=true&amount=${amount}`,
                cancel_url: `${this.configService.get('FRONTEND_URL')}/wallet?topup_cancel=true`,
                customer_email: customerEmail,
                metadata: {
                    userId: userId.toString(),
                    amount: amount.toString(),
                    type: 'wallet_topup'
                },
            });

            return { url: session.url };
        }

        throw new BadRequestException(`بوابة الدفع ${gatewayName} غير مدعومة بعد لشحن المحفظة`);
    }

    private async handleStripePayment(config: any, orderId: number, amount: number, customerEmail: string) {
        const stripe = new Stripe(config.secretKey, {
            apiVersion: '2023-10-16' as any,
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'sar',
                        product_data: {
                            name: `Order #${orderId}`,
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`,
            cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/cancel?orderId=${orderId}`,
            customer_email: customerEmail,
            metadata: {
                orderId: orderId.toString(),
            },
        });

        return { url: session.url };
    }

    private async handleTapPayment(config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://api.tap.company/v2/charges',
                    {
                        amount: amount,
                        currency: 'SAR',
                        threeDSecure: true,
                        save_card: false,
                        description: `Order #${orderId}`,
                        metadata: { orderId: orderId.toString() },
                        customer: { email: customerEmail },
                        redirect: {
                            url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`
                        }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${config.secretKey}`,
                            accept: 'application/json',
                            'content-type': 'application/json'
                        }
                    }
                )
            );
            const data = (response as any).data;
            return { url: data.transaction.url };
        } catch (error) {
            console.error('[PaymentsService] Tap Error:', error.response?.data || error.message);
            throw new BadRequestException('فشل الاتصال ببوابة Tap');
        }
    }

    private async handlePaymobPayment(config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            // 1. Authentication
            const authRes = await firstValueFrom(
                this.httpService.post('https://accept.paymob.com/api/auth/tokens', {
                    api_key: config.secretKey // This is the Paymob API Key
                })
            );
            const token = ((authRes as any).data as any).token;

            // 2. Order Registration
            const orderRes = await firstValueFrom(
                this.httpService.post('https://accept.paymob.com/api/ecommerce/orders', {
                    auth_token: token,
                    delivery_needed: false,
                    amount_cents: Math.round(amount * 100),
                    currency: 'SAR',
                    items: []
                })
            );

            // 3. Payment Key Generation
            const paymentKeyRes = await firstValueFrom(
                this.httpService.post('https://accept.paymob.com/api/acceptance/payment_keys', {
                    auth_token: token,
                    amount_cents: Math.round(amount * 100),
                    expiration: 3600,
                    order_id: ((orderRes as any).data as any).id,
                    billing_data: {
                        apartment: 'NA',
                        email: customerEmail,
                        floor: 'NA',
                        first_name: 'Customer',
                        street: 'NA',
                        building: 'NA',
                        phone_number: 'NA',
                        shipping_method: 'NA',
                        postal_code: 'NA',
                        city: 'NA',
                        country: 'SA',
                        last_name: 'NA',
                        state: 'NA'
                    },
                    currency: 'SAR',
                    integration_id: config.config?.integrationId || config.publishableKey, // Integration ID
                    lock_order_when_paid: 'false'
                })
            );

            const paymentToken = ((paymentKeyRes as any).data as any).token;
            const iframeId = config.config?.iframeId || 'default';
            return { url: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}` };
        } catch (error) {
            console.error('[PaymentsService] Paymob Error:', error.response?.data || error.message);
            throw new BadRequestException('فشل الاتصال ببوابة Paymob');
        }
    }

    private async handleGeideaPayment(config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            // Geidea uses Basic Auth with MerchantKey:Password
            const auth = Buffer.from(`${config.publishableKey}:${config.secretKey}`).toString('base64');
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://api.merchant.geidea.net/payment-intent/api/v1/direct/session',
                    {
                        amount: amount,
                        currency: 'SAR',
                        orderId: orderId.toString(),
                        callbackUrl: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`,
                        paymentMethods: ['card']
                    },
                    {
                        headers: {
                            Authorization: `Basic ${auth}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )
            );
            const data = (response as any).data;
            return { url: data.sessionUrl };
        } catch (error) {
            console.error('[PaymentsService] Geidea Error:', error.response?.data || error.message);
            throw new BadRequestException('فشل الاتصال ببوابة Geidea');
        }
    }

    private async handleMamoPayment(config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://api.mamopay.com/api/v1/links',
                    {
                        title: `Order #${orderId}`,
                        amount: amount,
                        capacity: 1,
                        active: true,
                        return_url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`,
                        failure_url: `${this.configService.get('FRONTEND_URL')}/checkout/cancel?orderId=${orderId}`
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${config.secretKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )
            );
            const data = (response as any).data;
            return { url: data.payment_url };
        } catch (error) {
            console.error('[PaymentsService] Mamo Error:', error.response?.data || error.message);
            throw new BadRequestException('فشل الاتصال ببوابة Mamo');
        }
    }

    private async handlePaybyPayment(config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            // PayBy often uses a Unified Order API
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://api.payby.com/mch/v1/order/paypage-create',
                    {
                        partner_id: config.publishableKey,
                        out_trade_no: orderId.toString(),
                        total_amount: amount,
                        subject: `Order #${orderId}`,
                        notify_url: `${this.configService.get('BACKEND_URL')}/payments/webhook/payby`,
                        return_url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${config.secretKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )
            );
            const data = (response as any).data;
            return { url: data.pay_url || data.url };
        } catch (error) {
            console.error('[PaymentsService] PayBy Error:', error.response?.data || error.message);
            throw new BadRequestException('فشل الاتصال ببوابة PayBy');
        }
    }

    private async handleDpoPayment(config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            // DPO Pay usually involves an XML request, but some regions have JSON wrappers
            // We'll use a simplified link generation logic
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://secure.3gdirectpay.com/API/v6/',
                    {
                        CompanyToken: config.publishableKey,
                        Request: 'createToken',
                        Transaction: {
                            PaymentAmount: amount,
                            PaymentCurrency: 'SAR',
                            CompanyRef: orderId.toString(),
                            metadata: { orderId }
                        }
                    }
                )
            );
            const data = (response as any).data;
            // DPO returns a TransactionToken which is used to redirect
            const token = data.TransactionToken || data;
            return { url: `https://secure.3gdirectpay.com/payv2.php?ID=${token}` };
        } catch (error) {
            console.error('[PaymentsService] DPO Error:', error.response?.data || error.message);
            throw new BadRequestException('فشل الاتصال ببوابة DPO Pay');
        }
    }

    private async handleCCAvenuePayment(config: any, orderId: number, amount: number, customerEmail: string) {
        // CCAvenue requires encryption. We provide a structured redirect to a processing route
        const baseUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
        const params = new URLSearchParams({
            merchant_id: config.publishableKey || '',
            access_code: config.config?.accessCode || '',
            order_id: orderId.toString(),
            amount: amount.toString(),
            currency: 'SAR',
            redirect_url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`,
            cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/cancel?orderId=${orderId}`,
            language: 'EN'
        });

        return { url: `${baseUrl}&${params.toString()}` };
    }

    private async handleGenericHostedPayment(name: string, config: any, orderId: number, amount: number, customerEmail: string) {
        try {
            const endpoints: Record<string, string> = {
                tigerpay: 'https://api.tigerpay.me/v1/payments',
                paymennt: 'https://api.paymennt.com/v1/checkout',
                utap: 'https://api.utap.io/v1/sessions',
                omnispay: 'https://api.omnispay.com/v1/charges'
            };

            const url = endpoints[name] || `https://api.${name}.com/v1/checkout`;

            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {
                        amount,
                        currency: 'SAR',
                        order_id: orderId.toString(),
                        customer: { email: customerEmail },
                        redirect_url: `${this.configService.get('FRONTEND_URL')}/checkout/success?orderId=${orderId}`
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${config.secretKey || config.publishableKey}`,
                            'X-Merchant-ID': config.merchantId || config.publishableKey
                        }
                    }
                )
            );

            const data = (response as any).data;
            return { url: data.redirect_url || data.url || data.checkout_url };
        } catch (error) {
            console.error(`[PaymentsService] ${name} Error:`, error.response?.data || error.message);
            return { url: `${this.configService.get('FRONTEND_URL')}/checkout/process?gateway=${name}&orderId=${orderId}&error=api_fail` };
        }
    }
}
