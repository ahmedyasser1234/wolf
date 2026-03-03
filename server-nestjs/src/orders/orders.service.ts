
import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { orders, orderItems, products, cartItems, notifications, vendors, coupons, offers, offerItems, users, walletTransactions, customerWallets, installmentPlans, installments } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
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

    async create(customerId: number, shippingAddress: any, paymentMethod = 'card', couponCode?: string, walletAmountUsed = 0, installmentPlanId?: number, kycData?: any) {
        console.log(`📦 [OrdersService] Creating Order for Customer: ${customerId}, WalletUsed: ${walletAmountUsed}`);

        const cart = await this.databaseService.db
            .select()
            .from(cartItems)
            .where(eq(cartItems.customerId, customerId));

        if (cart.length === 0) throw new BadRequestException('السلة فارغة');

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
            try {
                coupon = await this.couponsService.findByCode(couponCode);
            } catch (e) { }
        }

        const createdOrders: any[] = [];
        let stripeCheckoutUrl = null;

        await this.databaseService.db.transaction(async (tx) => {
            // Check Wallet Balance if used
            if (walletAmountUsed > 0) {
                const [wallet] = await tx.select().from(customerWallets).where(eq(customerWallets.userId, customerId)).limit(1);
                if (!wallet || Number(wallet.balance) < walletAmountUsed) {
                    throw new BadRequestException('رصيد المحفظة غير كافٍ');
                }
            }

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
                let totalDiscount = 0; // Simplified for now, can re-add complex logic later
                if (coupon && coupon.vendorId === vendorId) {
                    totalDiscount = (group.subtotal * coupon.discountPercent) / 100;
                }

                const [vendor] = await tx.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
                const shippingCost = vendor?.shippingCost || 0;
                const commissionRate = vendor?.commissionRate || 10;

                const finalSubtotal = group.subtotal - totalDiscount;
                const orderTotal = finalSubtotal + shippingCost;
                const commission = (finalSubtotal * commissionRate) / 100;

                const orderNumber = `ORD-${Date.now()}-${vendorId}`;

                const [newOrder] = await tx
                    .insert(orders)
                    .values({
                        orderNumber,
                        customerId,
                        vendorId,
                        status: 'pending',
                        paymentStatus: installmentPlanId ? 'pending_kyc_review' : 'pending',
                        subtotal: group.subtotal,
                        discount: totalDiscount,
                        shippingCost,
                        commission,
                        total: orderTotal,
                        shippingAddress,
                        paymentMethod,
                        installmentPlanId,
                        kycData,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

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

                createdOrders.push(newOrder);
            }

            // Handle Payments (Wallet + Stripe)
            let remainingToPay = createdOrders.reduce((sum, o) => sum + Number(o.total), 0);

            if (walletAmountUsed > 0) {
                const amountToDeduct = Math.min(walletAmountUsed, remainingToPay);
                await this.walletsService.deductBalance(customerId, amountToDeduct, `Order Payment (Split)`);
                remainingToPay -= amountToDeduct;
            }

            // Handle Installments if selected
            let requiresInstallmentReview = false;

            if (remainingToPay > 0 && paymentMethod !== 'cash_on_delivery' && !requiresInstallmentReview) {
                const [customer] = await tx.select().from(users).where(eq(users.id, customerId)).limit(1);

                // If paymentMethod is 'card' or empty, default to 'stripe' for backward compatibility
                const gateway = (paymentMethod === 'card' || !paymentMethod) ? 'stripe' : paymentMethod;

                const session = await this.paymentsService.createCheckoutSession(
                    gateway,
                    createdOrders[0].id, // Link to first order for metadata
                    remainingToPay,
                    customer.email!
                );
                stripeCheckoutUrl = session.url;
            } else if (remainingToPay <= 0 && !requiresInstallmentReview) {
                // Fully paid by wallet
                for (const order of createdOrders) {
                    await tx.update(orders).set({ paymentStatus: 'paid', status: 'confirmed' }).where(eq(orders.id, order.id));
                }
            }

            if (installmentPlanId && createdOrders.length > 0) {
                const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
                const baseTotalToFinance = createdOrders.reduce((sum, o) => sum + Number(o.total), 0) - (walletAmountUsed || 0);

                if (baseTotalToFinance > 0) {
                    const [plan] = await tx.select().from(installmentPlans).where(eq(installmentPlans.id, installmentPlanId)).limit(1);
                    if (plan) {
                        // Validation: Min Amount (base)
                        if (baseTotalToFinance < Number(plan.minAmount)) {
                            throw new BadRequestException(`الحد الأدنى للتقسيط هو ${plan.minAmount}`);
                        }

                        // Validation: Quantity Range
                        const minQ = plan.minQuantity || 1;
                        const maxQ = plan.maxQuantity || 0;
                        if (totalItems < minQ || (maxQ > 0 && totalItems > maxQ)) {
                            throw new BadRequestException(`هذا النظام متاح فقط لعدد منتجات بين ${minQ} و ${maxQ > 0 ? maxQ : '∞'}`);
                        }

                        const interestAmount = baseTotalToFinance * (plan.interestRate || 0) / 100;
                        const totalWithInterest = baseTotalToFinance + interestAmount;
                        const dpPct = plan.downPaymentPercentage || 0;
                        const downPayment = totalWithInterest * dpPct / 100;
                        const financedAmount = totalWithInterest - downPayment;

                        // CRITICAL: We DO NOT charge the down payment yet. We wait for Admin approval.
                        // We record the installment request as 'pending_approval'
                        requiresInstallmentReview = true;

                        await tx.insert(installments).values({
                            orderId: createdOrders[0].id,
                            totalAmount: financedAmount,
                            remainingAmount: financedAmount,
                            installmentsCount: plan.months,
                            status: 'pending_approval',
                            nextPaymentDate: null, // Will be set after down payment is paid
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });

                    }
                }
            }

            // Award Points (1 AED = 1 Point)
            const totalPurchaseAmount = createdOrders.reduce((sum, o) => sum + Number(o.total), 0);
            if (totalPurchaseAmount > 0) {
                await this.pointsService.earnPoints(customerId, totalPurchaseAmount, createdOrders[0].id);
            }

            await tx.delete(cartItems).where(eq(cartItems.customerId, customerId));
        });

        return { orders: createdOrders, checkoutUrl: stripeCheckoutUrl };
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
        const stepMap: Record<string, number> = { pending: 1, confirmed: 2, shipped: 3, delivered: 4, cancelled: 0 };

        const currentStatusNormalized = (currentOrder.status || '').toLowerCase();
        const newStatusNormalized = (status || '').toLowerCase();

        const currentStep = stepMap[currentStatusNormalized] || 0;
        const newStep = stepMap[newStatusNormalized] || 0;

        // Prevent ANY backtracking (except cancelling, if allowed)
        if (newStep < currentStep && newStatusNormalized !== 'cancelled') {
            throw new BadRequestException('Cannot revert order to a previous status.');
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

    // --- Admin KYC Review Flow ---
    async reviewKycRequest(orderId: number, action: 'approve' | 'reject', adminUserId: number, reason?: string) {
        const [order] = await this.databaseService.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) throw new BadRequestException('Order not found');
        if (order.paymentStatus !== 'pending_kyc_review') {
            throw new BadRequestException('This order is not pending KYC review');
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
                    paymentStatus: 'pending_payment',
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            await this.databaseService.db
                .update(installments)
                .set({
                    status: 'approved_awaiting_payment',
                    updatedAt: new Date()
                })
                .where(eq(installments.id, installment.id));

            // Notify Customer
            await this.notificationsService.notify(
                order.customerId,
                'kyc_approved',
                'تمت الموافقة على طلب التقسيط',
                `تمت الموافقة على طلب التقسيط للطلب رقم #${order.orderNumber}. تفضل بدفع المقدم للبدء.`,
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

            // Notify Customer
            const message = reason ? `نعتذر، تم رفض طلب التقسيط للطلب رقم #${order.orderNumber}: ${reason}` : `نعتذر، تم رفض طلب التقسيط للطلب رقم #${order.orderNumber}.`;
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

        if (order.paymentStatus !== 'pending_payment') {
            throw new BadRequestException('This order is not ready for down payment');
        }

        const [installment] = await this.databaseService.db
            .select()
            .from(installments)
            .where(eq(installments.orderId, orderId))
            .limit(1);

        if (!installment || installment.status !== 'approved_awaiting_payment') {
            throw new BadRequestException('Installment is not in the correct state to pay the down payment');
        }

        const [customer] = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.id, customerId))
            .limit(1);

        // Calculate Down Payment: Order Total - Financed Amount
        // Since we didn't store the exact DP amount in `installments`, we reconstruct it (or we can just calculate total amount + interest - financed)
        // Actually, the easiest way is: Total With Interest = (Financed Amount / (1 - DownPayment%)) -> wait, financed = total * (1 - dp)
        // Let's rely on the original plan calculation or just look at `installment.totalAmount`. The `totalAmount` in DB is the `financedAmount`.
        // Let's get the plan.

        let downPaymentToPay = Number(order.total); // default fallback

        if (order.installmentPlanId) {
            const [plan] = await this.databaseService.db.select().from(installmentPlans).where(eq(installmentPlans.id, order.installmentPlanId)).limit(1);
            if (plan) {
                const interestAmount = Number(order.total) * (plan.interestRate || 0) / 100;
                const totalWithInterest = Number(order.total) + interestAmount;
                const dpPct = plan.downPaymentPercentage || 0;
                downPaymentToPay = totalWithInterest * dpPct / 100;
            }
        }

        const gateway = (order.paymentMethod === 'card' || !order.paymentMethod) ? 'stripe' : order.paymentMethod;

        const session = await this.paymentsService.createCheckoutSession(
            gateway,
            order.id, // Link to order for metadata
            downPaymentToPay,
            customer.email!
        );

        return { checkoutUrl: session.url };
    }
}
