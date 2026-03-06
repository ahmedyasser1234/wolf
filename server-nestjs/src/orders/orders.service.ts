
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { orders, orderItems, products, cartItems, notifications, vendors, coupons, offers, offerItems, users, walletTransactions, customerWallets, installmentPlans, installments, giftCards } from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { WalletsService } from '../wallets/wallets.service';
import { PointsService } from '../points/points.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
    constructor(
        private databaseService: DatabaseService,
        private notificationsService: NotificationsService,
        private couponsService: CouponsService,
        private walletsService: WalletsService,
        private pointsService: PointsService,
        private paymentsService: PaymentsService
    ) { }

    async findAll(customerId: number, limit = 20, offset = 0) {
        return await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.customerId, customerId))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(orders.createdAt));
    }

    async findOne(id: number) {
        const orderRaw = await this.databaseService.db
            .select({
                order: orders,
                customer: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    phone: users.phone,
                }
            })
            .from(orders)
            .leftJoin(users, eq(orders.customerId, users.id))
            .where(eq(orders.id, id))
            .limit(1);

        if (orderRaw.length === 0) return null;

        const items = await this.databaseService.db
            .select({
                id: orderItems.id,
                orderId: orderItems.orderId,
                productId: orderItems.productId,
                vendorId: orderItems.vendorId,
                quantity: orderItems.quantity,
                price: orderItems.price,
                total: orderItems.total,
                size: orderItems.size,
                productNameAr: products.nameAr,
                productNameEn: products.nameEn,
                productImage: products.images,
                storeNameAr: vendors.storeNameAr,
                storeNameEn: vendors.storeNameEn,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .leftJoin(vendors, eq(orderItems.vendorId, vendors.id))
            .where(eq(orderItems.orderId, id));

        return { ...orderRaw[0].order, customer: orderRaw[0].customer, items };
    }

    /**
     * NEW FLOW:
     * - INSTALLMENT: validate deposit payment (wallet/gift_card/card) FIRST,
     *   then create order with paymentStatus='pending_kyc_review' + store depositAmount + depositPaymentMethod.
     * - CASH / COD: create order directly with status='pending_confirmation', no deposit needed.
     */
    async create(
        customerId: number,
        shippingAddress: any,
        paymentMethod = 'card',
        couponCode?: string,
        walletAmountUsed = 0,
        installmentPlanId?: number,
        kycData?: any,
        depositPaymentMethod?: 'wallet' | 'card' | 'gift_card',
        depositGiftCardCode?: string,
        language = 'ar',
    ) {
        console.log(`📦 [OrdersService] CREATE ORDER START:`, {
            customerId,
            paymentMethod,
            installmentPlanId,
            depositPaymentMethod,
            depositGiftCardCode,
            walletAmountUsed
        });

        const cart = await this.databaseService.db
            .select()
            .from(cartItems)
            .where(eq(cartItems.customerId, customerId));

        if (cart.length === 0) throw new BadRequestException('السلة فارغة');

        const [customerRecord] = await this.databaseService.db
            .select({ status: users.status })
            .from(users)
            .where(eq(users.id, customerId));
        if (customerRecord?.status === 'blocked') throw new BadRequestException('حسابك موقوف ولا يمكنك إتمام الطلب.');
        if (customerRecord?.status === 'deactivated') throw new BadRequestException('حسابك معطّل مؤقتاً ولا يمكنك إتمام الطلب. يرجى التواصل مع الدعم.');

        // Group items by vendor
        const vendorGroups = new Map<number, { items: any[], subtotal: number, vendorUserId: number }>();
        for (const item of cart) {
            const product = await this.databaseService.db
                .select()
                .from(products)
                .where(eq(products.id, item.productId))
                .limit(1);

            if (product.length > 0) {
                const prod = product[0];
                const vendorId = prod.vendorId;
                let vendorUserId = 0;
                if (vendorId) {
                    const vendor = await this.databaseService.db
                        .select({ userId: vendors.userId })
                        .from(vendors)
                        .where(eq(vendors.id, vendorId))
                        .limit(1);
                    if (vendor.length > 0) vendorUserId = vendor[0].userId;
                }
                if (!vendorGroups.has(vendorId)) {
                    vendorGroups.set(vendorId, { items: [], subtotal: 0, vendorUserId });
                }
                const price = Number(prod.price);
                const itemTotal = price * item.quantity;
                const group = vendorGroups.get(vendorId)!;
                group.subtotal += itemTotal;
                group.items.push({
                    productId: prod.id,
                    vendorId: prod.vendorId,
                    quantity: item.quantity,
                    price: price,
                    total: itemTotal,
                    size: item.size,
                });
            }
        }

        let coupon: any = null;
        if (couponCode) {
            try { coupon = await this.couponsService.findByCode(couponCode); } catch (e) { }
        }

        // ============================================================
        // INSTALLMENT FLOW: Calculate deposit & validate payment FIRST
        // ============================================================
        console.log(`🚀 [OrdersService.create] STARTED`, {
            customerId,
            paymentMethod,
            depositPaymentMethod,
            installmentPlanId: !!installmentPlanId,
            walletAmountUsed,
            language
        });

        let depositAmount = 0;
        let stripeCheckoutUrl: string | null = null;
        let resolvedDepositPaymentMethod = (depositPaymentMethod || 'card') as 'card' | 'wallet' | 'gift_card';
        console.log(`   - [Installment Check] depositPaymentMethod: ${depositPaymentMethod}, resolved: ${resolvedDepositPaymentMethod}`);

        if (installmentPlanId) {
            // Calculate gross cart total (before coupon / shipping per vendor)
            const grossTotal = Array.from(vendorGroups.values()).reduce((sum, g) => sum + g.subtotal, 0);
            const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

            const [plan] = await this.databaseService.db
                .select()
                .from(installmentPlans)
                .where(eq(installmentPlans.id, installmentPlanId))
                .limit(1);

            if (!plan) throw new BadRequestException('خطة التقسيط غير موجودة');
            if (grossTotal < Number(plan.minAmount)) {
                throw new BadRequestException(`الحد الأدنى للتقسيط هو ${plan.minAmount}`);
            }
            const minQ = plan.minQuantity || 1;
            const maxQ = plan.maxQuantity || 0;
            if (totalItems < minQ || (maxQ > 0 && totalItems > maxQ)) {
                throw new BadRequestException(`هذا النظام متاح فقط لعدد منتجات بين ${minQ} و ${maxQ > 0 ? maxQ : '∞'}`);
            }

            const interestAmount = grossTotal * (plan.interestRate || 0) / 100;
            const totalWithInterest = grossTotal + interestAmount;
            const dpPct = plan.downPaymentPercentage || 0;
            depositAmount = totalWithInterest * dpPct / 100;

            if (depositAmount <= 0) throw new BadRequestException('مبلغ المقدم غير صحيح');
            if (!kycData) throw new BadRequestException('يجب رفع الأوراق المطلوبة قبل الدفع');
            // depositPaymentMethod is optional, defaults to 'card' at line 165

            // --- Process deposit payment ---
            if (depositPaymentMethod === 'wallet') {
                const [wallet] = await this.databaseService.db
                    .select()
                    .from(customerWallets)
                    .where(eq(customerWallets.userId, customerId))
                    .limit(1);
                if (!wallet || Number(wallet.balance) < depositAmount) {
                    throw new BadRequestException(`رصيد المحفظة غير كافٍ. الرصيد المتاح: ${wallet?.balance || 0}, المطلوب: ${depositAmount}`);
                }
                await this.walletsService.deductBalance(customerId, depositAmount, `مقدم دفع تقسيط - في انتظار مراجعة الأوراق`);
                console.log(`  - [Deposit] SUCCESS: Deducted ${depositAmount} from wallet for customer ${customerId}. resolvedDepositPaymentMethod: ${resolvedDepositPaymentMethod}`);

            } else if (depositPaymentMethod === 'gift_card') {
                if (!depositGiftCardCode) throw new BadRequestException('يرجى إدخال كود كارت الهدية');
                const [giftCard] = await this.databaseService.db
                    .select()
                    .from(giftCards)
                    .where(eq(giftCards.code, depositGiftCardCode.toUpperCase()))
                    .limit(1);
                if (!giftCard) throw new BadRequestException('كود كارت الهدية غير صحيح');
                if (giftCard.isRedeemed) throw new BadRequestException('هذا الكارت تم استخدامه بالفعل');
                if (Number(giftCard.amount) < depositAmount) {
                    throw new BadRequestException(`قيمة الكارت (${giftCard.amount}) أقل من المقدم المطلوب (${depositAmount})`);
                }

                const newBalance = Number(giftCard.amount) - depositAmount;
                const isFullyRedeemed = newBalance <= 0;

                await this.databaseService.db
                    .update(giftCards)
                    .set({
                        amount: newBalance,
                        isRedeemed: isFullyRedeemed,
                        redeemedByUserId: isFullyRedeemed ? customerId : null,
                        redeemedAt: isFullyRedeemed ? new Date() : null
                    })
                    .where(eq(giftCards.id, giftCard.id));
                console.log(`  - [Deposit] Gift card ${depositGiftCardCode} used for deposit. Remaining: ${newBalance}`);

            } else if (depositPaymentMethod === 'card') {
                // For card payments we create a gateway session.
                // The order is created BEFORE redirect so we have an orderId for the session metadata.
                // We mark it with paymentStatus='awaiting_deposit_payment'.
                // The webhook will flip it to 'pending_kyc_review' after payment confirmation.
                // SIMPLIFICATION: We create the order and return checkoutUrl; webhook updates payment status.
                resolvedDepositPaymentMethod = 'card';
            }
        } else {
            // ============================================================
            // REGULAR ORDER FLOW: Process full payment if wallet/gift_card
            // ============================================================
            const grossTotal = Array.from(vendorGroups.values()).reduce((sum, g) => sum + g.subtotal, 0);

            if (paymentMethod === 'wallet') {
                const [wallet] = await this.databaseService.db
                    .select()
                    .from(customerWallets)
                    .where(eq(customerWallets.userId, customerId))
                    .limit(1);
                if (!wallet || Number(wallet.balance) < grossTotal) {
                    throw new BadRequestException(`رصيد المحفظة غير كافٍ. الرصيد المتاح: ${wallet?.balance || 0}, المطلوب: ${grossTotal}`);
                }
                await this.walletsService.deductBalance(customerId, grossTotal, `طلب شراء - ${paymentMethod}`);
                console.log(`  - [Payment] Deducted ${grossTotal} from wallet for customer ${customerId}`);

            } else if (paymentMethod === 'gift_card') {
                if (!depositGiftCardCode) throw new BadRequestException('يرجى إدخال كود كارت الهدية');
                const [giftCard] = await this.databaseService.db
                    .select()
                    .from(giftCards)
                    .where(eq(giftCards.code, depositGiftCardCode.toUpperCase()))
                    .limit(1);
                if (!giftCard) throw new BadRequestException('كود كارت الهدية غير صحيح');
                if (giftCard.isRedeemed) throw new BadRequestException('هذا الكارت تم استخدامه بالفعل');
                if (Number(giftCard.amount) < grossTotal) {
                    throw new BadRequestException(
                        language === 'ar'
                            ? `رصيد البطاقة (${giftCard.amount}) أقل من إجمالي الطلب (${grossTotal}). يرجى شحن البطاقة في محفظتك أولاً لاستخدام الرصيد مع طرق دفع أخرى.`
                            : `Card balance (${giftCard.amount}) is less than total (${grossTotal}). Please redeem the card to your wallet first to use it with other payment methods.`
                    );
                }

                const newBalance = Number(giftCard.amount) - grossTotal;
                const isFullyRedeemed = newBalance <= 0;

                await this.databaseService.db
                    .update(giftCards)
                    .set({
                        amount: newBalance,
                        isRedeemed: isFullyRedeemed,
                        redeemedByUserId: isFullyRedeemed ? customerId : null,
                        redeemedAt: isFullyRedeemed ? new Date() : null
                    })
                    .where(eq(giftCards.id, giftCard.id));
                console.log(`  - [Payment] Gift card ${depositGiftCardCode} used for full payment. Remaining: ${newBalance}`);
            }
        }

        // ============================================================
        // CREATE ORDERS IN TRANSACTION
        // ============================================================
        const createdOrders: any[] = [];

        try {
            await this.databaseService.db.transaction(async (tx) => {
                for (const [vendorId, group] of vendorGroups) {
                    // Stock Check
                    for (const item of group.items) {
                        const [prod] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
                        if (!prod) throw new BadRequestException('Product not found');
                        if (item.size) {
                            const sizes = prod.sizes as { size: string; quantity: number }[] | null;
                            const sizeObj = sizes?.find(s => s.size === item.size);
                            if (!sizeObj || sizeObj.quantity < item.quantity) {
                                throw new BadRequestException(`الكمية غير متوفرة لـ ${prod.nameAr}`);
                            }
                        } else if ((prod.stock || 0) < item.quantity) {
                            throw new BadRequestException(`الكمية غير متوفرة لـ ${prod.nameAr}`);
                        }
                    }

                    // Discounts & Shipping
                    let totalDiscount = 0;
                    if (coupon && coupon.vendorId === vendorId) {
                        totalDiscount = (group.subtotal * coupon.discountPercent) / 100;
                    }
                    const [vendor] = await tx.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
                    const shippingCost = vendor?.shippingCost || 0;
                    const commissionRate = vendor?.commissionRate || 10;
                    const finalSubtotal = group.subtotal - totalDiscount;
                    const orderTotal = finalSubtotal + shippingCost;
                    const commission = (finalSubtotal * commissionRate) / 100;
                    const orderNumber = `ORD-${Date.now()}-${(vendorId === null || vendorId === undefined) ? 0 : vendorId}`;

                    // Determine status/paymentStatus based on order type
                    const isInstallment = !!installmentPlanId;
                    const isCash = paymentMethod === 'cash' || paymentMethod === 'cod' || paymentMethod === 'cashOnDelivery';
                    const orderStatus = isCash ? 'pending' : (isInstallment ? 'pending' : 'pending');
                    const orderPaymentStatus = isInstallment
                        ? (resolvedDepositPaymentMethod === 'card' ? 'awaiting_deposit_payment' : 'pending_kyc_review')
                        : (paymentMethod === 'wallet' || paymentMethod === 'gift_card' ? 'paid' : 'pending');

                    console.log(`   - Pre-Insert Check [Vendor ${vendorId}]:`, {
                        orderNumber,
                        isInstallment,
                        resolvedDepositPaymentMethod,
                        finalPaymentMethod: isInstallment ? 'installments' : paymentMethod,
                        orderStatus,
                        orderPaymentStatus
                    });

                    const [newOrder] = await tx
                        .insert(orders)
                        .values({
                            orderNumber,
                            customerId,
                            vendorId,
                            status: orderStatus,
                            paymentStatus: orderPaymentStatus,
                            subtotal: group.subtotal,
                            discount: totalDiscount,
                            shippingCost,
                            commission,
                            total: orderTotal,
                            shippingAddress,
                            paymentMethod: isInstallment ? 'installments' : paymentMethod,
                            installmentPlanId,
                            kycData: isInstallment ? kycData : null,
                            depositAmount: isInstallment ? depositAmount : 0,
                            depositPaymentMethod: isInstallment ? resolvedDepositPaymentMethod : null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .returning();

                    console.log(`   ✅ [OrdersService.create] Order Saved:`, {
                        id: newOrder.id,
                        orderNumber: newOrder.orderNumber,
                        paymentMethod: newOrder.paymentMethod,
                        paymentStatus: newOrder.paymentStatus,
                        depositPaymentMethod: newOrder.depositPaymentMethod
                    });

                    const itemsWithOrderId = group.items.map(item => ({ ...item, orderId: newOrder.id }));
                    await tx.insert(orderItems).values(itemsWithOrderId);

                    // Update stock
                    for (const item of group.items) {
                        const [prod] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
                        const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                        let newSizes = prod.sizes;
                        if (item.size && prod.sizes) {
                            newSizes = (prod.sizes as any[]).map(s => s.size === item.size ? { ...s, quantity: Math.max(0, s.quantity - item.quantity) } : s);
                        }
                        await tx.update(products).set({ stock: newStock, sizes: newSizes }).where(eq(products.id, item.productId));
                    }

                    // Create installment record
                    if (isInstallment) {
                        const [plan] = await tx.select().from(installmentPlans).where(eq(installmentPlans.id, installmentPlanId!)).limit(1);
                        if (plan) {
                            const interestAmount = orderTotal * (plan.interestRate || 0) / 100;
                            const totalWithInterest = orderTotal + interestAmount;
                            const dpPct = plan.downPaymentPercentage || 0;
                            const financedAmount = totalWithInterest * (1 - dpPct / 100);
                            await tx.insert(installments).values({
                                orderId: newOrder.id,
                                totalAmount: financedAmount,
                                remainingAmount: financedAmount,
                                installmentsCount: plan.months,
                                status: 'pending_approval',
                                nextPaymentDate: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                        }
                    }

                    createdOrders.push(newOrder);
                }

                // Cart cleanup
                await tx.delete(cartItems).where(eq(cartItems.customerId, customerId));
                if (coupon) {
                    await tx.update(coupons)
                        .set({ usedCount: sql`${coupons.usedCount} + 1` })
                        .where(eq(coupons.id, coupon.id));
                }
            });

            // For card deposit: create gateway session now that we have orderId
            // For card deposit: create gateway session now that we have orderId
            if (installmentPlanId && resolvedDepositPaymentMethod === 'card' && createdOrders.length > 0) {
                const [customer] = await this.databaseService.db.select().from(users).where(eq(users.id, customerId)).limit(1);
                const session = await this.paymentsService.createCheckoutSession(
                    'stripe',
                    createdOrders[0].id,
                    depositAmount,
                    customer.email!
                );
                stripeCheckoutUrl = session.url;
            } else if (!installmentPlanId && paymentMethod === 'card' && createdOrders.length > 0) {
                // Regular order card payment
                const [customer] = await this.databaseService.db.select().from(users).where(eq(users.id, customerId)).limit(1);
                const grandTotal = createdOrders.reduce((sum, o) => sum + Number(o.total), 0);
                const session = await this.paymentsService.createCheckoutSession(
                    'stripe',
                    createdOrders[0].id, // For multi-vendor simple fix use first order id, but webhook should handle grouped
                    grandTotal,
                    customer.email!
                );
                stripeCheckoutUrl = session.url;
            }

            // Notify admins ONLY for orders with 'paid' or 'pending_kyc_review' (Internal success)
            for (const order of createdOrders) {
                const isPaid = order.paymentStatus === 'paid';
                const isInternalInstallment = order.installmentPlanId && order.paymentStatus === 'pending_kyc_review' && (order.depositPaymentMethod === 'wallet' || order.depositPaymentMethod === 'gift_card');

                if (isPaid || isInternalInstallment) {
                    try {
                        const isInstallment = !!order.installmentPlanId;
                        await this.notificationsService.notifyAdmins(
                            'new_order',
                            isInstallment ? '📋 طلب تقسيط جديد (مدفوع المقدم)' : '🛒 طلب جديد تم دفعه',
                            isInstallment
                                ? `طلب تقسيط جديد #${order.orderNumber} بمقدم ${order.depositAmount} (تم الدفع داخلياً)`
                                : `طلب رقم #${order.orderNumber} تم دفعه بالكامل بقيمة ${order.total}`,
                            order.id
                        );
                    } catch (e) {
                        console.error('Failed to notify admin:', e.message);
                    }
                }
            }

            return { orders: createdOrders, checkoutUrl: stripeCheckoutUrl };
        } catch (error) {
            // IMPORTANT: If order creation fails AFTER deposit was deducted (wallet/gift_card),
            // we must refund to prevent money loss.
            if (installmentPlanId && depositAmount > 0 && resolvedDepositPaymentMethod === 'wallet') {
                try {
                    await this.walletsService.topUpBalance(customerId, depositAmount, `استرجاع مقدم بسبب خطأ في إنشاء الطلب`);
                    console.log(`  - [Rollback] Refunded deposit ${depositAmount} to wallet for customer ${customerId}`);
                } catch (refundErr) {
                    console.error('CRITICAL: Failed to refund deposit after order creation failure:', refundErr.message);
                }
            }
            console.error(`❌ [OrdersService] FATAL ERROR in create:`, error);
            throw error;
        }
    }





    async updateStatus(orderId: number, status: string, userId?: number) {
        // Fetch Order with Vendor info using standard Join
        const [result] = await this.databaseService.db
            .select()
            .from(orders)
            .leftJoin(vendors, eq(orders.vendorId, vendors.id))
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!result || !result.orders) throw new BadRequestException('Order not found');

        const currentOrder = result.orders;
        const vendor = result.vendors;
        const vendorUserId = vendor ? vendor.userId : null;

        // Validation 1: Strict Forward-Only Workflow
        const stepMap: Record<string, number> = {
            'pending': 1,
            'preparing_shipment': 2,
            'shipped': 3,
            'delivered': 4,
            'cancelled': 5
        };

        const currentStatusNormalized = (currentOrder.status || '').toLowerCase();
        const newStatusNormalized = (status || '').toLowerCase();

        const currentStep = stepMap[currentStatusNormalized] || 0;
        const newStep = stepMap[newStatusNormalized] || 0;

        // Prevent ANY backtracking (except cancelling, if allowed)
        if (newStep < currentStep && newStatusNormalized !== 'cancelled') {
            throw new BadRequestException('Cannot revert order to a previous status.');
        }

        // Feature: Refund deposit if installment order is cancelled and deposit was paid
        if (newStatusNormalized === 'cancelled' && currentStatusNormalized !== 'cancelled') {
            await this.refundOrderDeposit(orderId);
        }

        // Feature 2: Cancel Points if the order is cancelled and it previously earned points
        if (newStatusNormalized === 'cancelled' && (currentStatusNormalized === 'delivered' || currentOrder.paymentStatus === 'paid')) {
            await this.pointsService.reversePoints(currentOrder.customerId, Number(currentOrder.total), orderId);
        }

        // Validation 2: Role Checks (if userId provided)
        if (userId) {
            const [user] = await this.databaseService.db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (user) {
                // Vendor checks
                if (user.role === 'vendor') {
                    // Verify vendor owns the order
                    if (user.id !== vendorUserId) {
                        throw new BadRequestException('You are not authorized to update this order.');
                    }
                    // Vendor cannot set Delivered
                    if (newStatusNormalized === 'delivered') {
                        throw new BadRequestException('Vendors cannot mark orders as Delivered. Only customers can confirm receipt.');
                    }
                }
            }
        }

        const [updatedOrder] = await this.databaseService.db
            .update(orders)
            .set({ status: newStatusNormalized, updatedAt: new Date() })
            .where(eq(orders.id, orderId))
            .returning();

        if (updatedOrder) {
            // Customer Notification
            await this.notificationsService.notify(
                updatedOrder.customerId,
                'order_status',
                'تحديث حالة الطلب',
                `تم تغيير حالة طلبك رقم #${updatedOrder.orderNumber} إلى ${status}`,
                updatedOrder.id
            );

            // Vendor Notification (If Delivered)
            if (newStatusNormalized === 'delivered' && vendorUserId) {
                await this.notificationsService.notify(
                    vendorUserId,
                    'order_delivered',
                    'تم تسليم الطلب',
                    `قام العميل بتأكيد استلام الطلب رقم #${updatedOrder.orderNumber}`,
                    updatedOrder.id
                );

                // Move funds from pending to available in Vendor Wallet
                const vendorEarnings = Number(updatedOrder.total) - Number(updatedOrder.commission) - Number(updatedOrder.shippingCost || 0);
                const vendorId = updatedOrder.vendorId;
                if (vendorId) {
                    await this.walletsService.handleOrderDelivered(vendorId, updatedOrder.id, vendorEarnings);
                }

                // Award points if not already awarded (COD case)
                if (updatedOrder.paymentStatus === 'paid' || newStatusNormalized === 'delivered') {
                    await this.pointsService.earnPoints(updatedOrder.customerId, updatedOrder.total, updatedOrder.id);
                }
            }
        }
    }

    async refundOrderDeposit(orderId: number) {
        const [order] = await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) return;

        const isInstallment = !!order.installmentPlanId;
        const isPaidStatus = ['pending_kyc_review', 'paid'].includes(order.paymentStatus || '');
        const hasDeposit = Number(order.depositAmount) > 0;

        if (isInstallment && isPaidStatus && hasDeposit) {
            // Check if already refunded via wallet transactions to prevent duplicates
            // We use the referenceId convention 'refund_{orderId}'
            const [existingRefund] = await this.databaseService.db
                .select()
                .from(walletTransactions)
                .where(eq(walletTransactions.referenceId, `refund_${orderId}`))
                .limit(1);

            if (!existingRefund) {
                await this.walletsService.topUpBalance(
                    order.customerId,
                    Number(order.depositAmount),
                    `refund_${orderId}`,
                    `استرجاع مقدم الدفع للطلب رقم #${order.orderNumber}`
                );
                console.log(`💰 [OrdersService] Successfully refunded deposit of ${order.depositAmount} for order #${orderId}`);
            }
        }
    }

    // --- Admin KYC Review Flow ---
    async reviewKycRequest(orderId: number, action: 'approve' | 'reject', adminUserId: number, reason?: string) {
        const [order] = await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) throw new BadRequestException('Order not found');
        if (!['pending_kyc_review', 'awaiting_deposit_payment'].includes(order.paymentStatus)) {
            throw new BadRequestException(`هذا الطلب غير متاح للمراجعة حالياً (الحالة الحالية: ${order.paymentStatus})`);
        }

        const [installment] = await this.databaseService.db
            .select()
            .from(installments)
            .where(eq(installments.orderId, orderId))
            .limit(1);

        if (!installment) throw new BadRequestException('Installment plan not found for this order');

        let updatedOrder;

        if (action === 'approve') {
            [updatedOrder] = await this.databaseService.db
                .update(orders)
                .set({
                    status: 'preparing_shipment', // Move directly to preparing_shipment after KYC approval
                    paymentStatus: 'paid', // Deposit was already paid
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            await this.databaseService.db
                .update(installments)
                .set({
                    status: 'active',
                    updatedAt: new Date()
                })
                .where(eq(installments.id, installment.id));

            // Notify Customer
            await this.notificationsService.notify(
                order.customerId,
                'kyc_approved',
                'تمت الموافقة على طلب التقسيط',
                `تمت الموافقة على طلب التقسيط للطلب رقم #${order.orderNumber}. جارٍ تجهيز طلبك.`,
                order.id
            );

        } else if (action === 'reject') {
            [updatedOrder] = await this.databaseService.db
                .update(orders)
                .set({
                    status: 'cancelled',
                    paymentStatus: 'failed',
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            await this.databaseService.db
                .update(installments)
                .set({
                    status: 'rejected',
                    updatedAt: new Date()
                })
                .where(eq(installments.id, installment.id));

            // Restore stock since order is cancelled
            const orderItemsList = await this.databaseService.db
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId));

            for (const item of orderItemsList) {
                const [prod] = await this.databaseService.db.select().from(products).where(eq(products.id, item.productId)).limit(1);
                if (prod) {
                    const newStock = (prod.stock || 0) + item.quantity;
                    let newSizes = prod.sizes;
                    if (item.size && prod.sizes) {
                        newSizes = (prod.sizes as any[]).map(s => s.size === item.size ? { ...s, quantity: s.quantity + item.quantity } : s);
                    }
                    await this.databaseService.db.update(products).set({ stock: newStock, sizes: newSizes }).where(eq(products.id, item.productId));
                }
            }

            // Refund deposit to wallet (Automated refund on rejection)
            await this.refundOrderDeposit(orderId);

            // Notify Customer
            const message = reason ? `نعتذر، تم رفض طلب التقسيط للطلب رقم #${order.orderNumber}: ${reason}. تم استرجاع مبلغ المقدم إلى محفظتك.` : `نعتذر، تم رفض طلب التقسيط للطلب رقم #${order.orderNumber}. تم استرجاع مبلغ المقدم إلى محفظتك.`;
            await this.notificationsService.notify(
                order.customerId,
                'kyc_rejected',
                'تم رفض طلب التقسيط',
                message,
                order.id
            );
        }

        return { success: true, order: updatedOrder, action };
    }

    async getDownPaymentCheckoutUrl(orderId: number, customerId: number) {
        const [order] = await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order || order.customerId !== customerId) {
            throw new BadRequestException('Order not found');
        }

        // Modified: For deposit-first flow, this might be used if card payment failed initially
        if (order.paymentStatus !== 'awaiting_deposit_payment') {
            throw new BadRequestException('This order is not ready for down payment');
        }

        const [customer] = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.id, customerId))
            .limit(1);

        const gateway = (order.depositPaymentMethod === 'card' || !order.depositPaymentMethod) ? 'stripe' : order.depositPaymentMethod;

        const session = await this.paymentsService.createCheckoutSession(
            gateway as any,
            order.id,
            Number(order.depositAmount),
            customer.email!
        );

        return { checkoutUrl: session.url };
    }

    async confirmDepositPayment(orderId: number, adminUserId: number) {
        const [order] = await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) throw new BadRequestException('Order not found');
        if (order.paymentStatus !== 'awaiting_deposit_payment') {
            throw new BadRequestException('Order is not awaiting deposit payment');
        }

        const [updatedOrder] = await this.databaseService.db
            .update(orders)
            .set({
                paymentStatus: 'pending_kyc_review',
                updatedAt: new Date()
            })
            .where(eq(orders.id, orderId))
            .returning();

        // Notify Customer
        await this.notificationsService.notify(
            order.customerId,
            'deposit_received',
            'تم استلام مقدم الدفع',
            `تم استلام مبلغ المقدم للطلب رقم #${order.orderNumber}. طلبك الآن قيد مراجعة الأوراق.`,
            order.id
        );

        // Notify Admin specifically for installments success
        try {
            await this.notificationsService.notifyAdmins(
                'new_order',
                '📋 طلب تقسيط جديد - تم دفع المقدم',
                `طلب تقسيط جديد #${order.orderNumber} بمقدم ${order.depositAmount} - يحتاج مراجعة الأوراق`,
                order.id
            );
        } catch (e) {
            console.error('Failed to notify admin on deposit confirmation:', e.message);
        }

        return { success: true, order: updatedOrder };
    }

    async confirmPayment(orderId: number) {
        const [order] = await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) throw new BadRequestException('Order not found');

        // Handle Installments Deposit Confirmation
        if (order.installmentPlanId) {
            if (order.paymentStatus === 'pending_kyc_review') {
                return { success: true, alreadyPaid: true };
            }
            // Transition installment order to KYC review state (auto-confirming the card deposit)
            return this.confirmDepositPayment(orderId, 0); // Using 0 as system ID
        }

        // Handle Regular Order Payment Confirmation
        if (order.paymentStatus === 'paid') {
            return { success: true, alreadyPaid: true };
        }

        const [updatedOrder] = await this.databaseService.db
            .update(orders)
            .set({
                paymentStatus: 'paid',
                updatedAt: new Date()
            })
            .where(eq(orders.id, orderId))
            .returning();

        // Notify Admin of SUCCESSFUL regular payment
        try {
            await this.notificationsService.notifyAdmins(
                'new_order',
                '🛒 طلب جديد تم دفعه (بوابة الدفع)',
                `طلب رقم #${order.orderNumber} تم دفعه بنجاح عبر بوابة الدفع بقيمة ${order.total}`,
                order.id
            );
        } catch (e) {
            console.error('Failed to notify admin on payment confirmation:', e.message);
        }

        return { success: true, order: updatedOrder };
    }
}
