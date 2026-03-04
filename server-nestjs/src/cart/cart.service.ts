import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { cartItems, products, productColors } from '../database/schema';
import { eq, and, isNull } from 'drizzle-orm';

@Injectable()
export class CartService {
    constructor(private databaseService: DatabaseService) { }

    async getItems(customerId: number) {
        const items = await this.databaseService.db
            .select({
                cartItem: cartItems,
                product: products
            })
            .from(cartItems)
            .leftJoin(products, eq(cartItems.productId, products.id))
            .where(eq(cartItems.customerId, customerId));

        return items.map(({ cartItem, product }) => ({
            ...cartItem,
            product
        }));
    }

    async addItem(customerId: number, productId: number, quantity: number, size?: string, color?: string) {
        const product = await this.databaseService.db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (product.length === 0) {
            throw new BadRequestException('المنتج غير موجود');
        }

        const prod = product[0];

        // Stock Validation
        if (color) {
            const colorVariant = await this.databaseService.db
                .select()
                .from(productColors)
                .where(and(eq(productColors.productId, productId), eq(productColors.colorName, color)))
                .limit(1);

            if (colorVariant.length === 0) {
                throw new BadRequestException('اللون غير متوفر');
            }

            if (colorVariant[0].quantity < quantity) {
                throw new BadRequestException('الكمية غير متوفرة لهذا اللون');
            }
        } else {
            if ((prod.stock || 0) < quantity) {
                throw new BadRequestException('الكمية غير متوفرة');
            }
        }

        const existing = await this.databaseService.db
            .select()
            .from(cartItems)
            .where(and(
                eq(cartItems.customerId, customerId),
                eq(cartItems.productId, productId),
                size ? eq(cartItems.size, size) : isNull(cartItems.size),
                color ? eq(cartItems.color, color) : isNull(cartItems.color)
            ))
            .limit(1);

        if (existing.length > 0) {
            return await this.databaseService.db
                .update(cartItems)
                .set({ quantity: existing[0].quantity + quantity, updatedAt: new Date() })
                .where(eq(cartItems.id, existing[0].id));
        }

        return await this.databaseService.db.insert(cartItems).values({
            customerId,
            productId,
            quantity,
            size,
            color
        });
    }

    async updateQuantity(customerId: number, cartItemId: number, quantity: number) {
        if (quantity === 0) {
            return this.removeItem(customerId, cartItemId);
        }

        const existing = await this.databaseService.db
            .select()
            .from(cartItems)
            .where(and(eq(cartItems.id, cartItemId), eq(cartItems.customerId, customerId)))
            .limit(1);

        if (existing.length === 0) {
            throw new BadRequestException('Item not found');
        }

        // Optional: Check stock again? For now, trust add check or assume UI limits. 
        // Ideally we should check stock here too.

        return await this.databaseService.db
            .update(cartItems)
            .set({ quantity, updatedAt: new Date() })
            .where(eq(cartItems.id, cartItemId));
    }

    async removeItem(customerId: number, cartItemId: number) {
        return await this.databaseService.db
            .delete(cartItems)
            .where(and(eq(cartItems.id, cartItemId), eq(cartItems.customerId, customerId)));
    }

    async clear(customerId: number) {
        return await this.databaseService.db
            .delete(cartItems)
            .where(eq(cartItems.customerId, customerId));
    }
}
