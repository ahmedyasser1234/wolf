import { Controller, Post, Get, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { COOKIE_NAME } from '../common/constants';
import type { Request } from 'express';

@Controller('reviews')
export class ReviewsController {
    constructor(
        private reviewsService: ReviewsService,
        private authService: AuthService,
        private databaseService: DatabaseService
    ) { }

    private async getUserId(req: Request): Promise<number> {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException('Not logged in');

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException('Invalid session');

        const [user] = await this.databaseService.db
            .select()
            .from(users)
            .where(eq(users.openId, payload.openId))
            .limit(1);

        if (!user) throw new UnauthorizedException('User not found');
        return user.id;
    }

    @Post('product')
    async createProductReview(@Req() req: Request, @Body() body: any) {
        const customerId = await this.getUserId(req);
        return this.reviewsService.createProductReview({
            productId: parseInt(body.productId),
            customerId,
            rating: parseInt(body.rating),
            title: body.title,
            comment: body.comment,
            isVerifiedPurchase: body.isVerifiedPurchase || false,
        });
    }

    @Get('product/:id')
    async getProductReviews(@Param('id') id: string) {
        return this.reviewsService.getProductReviews(parseInt(id));
    }

    @Post('vendor')
    async createVendorReview(@Req() req: Request, @Body() body: any) {
        const customerId = await this.getUserId(req);
        return this.reviewsService.createVendorReview({
            vendorId: parseInt(body.vendorId),
            customerId,
            rating: parseInt(body.rating),
            comment: body.comment,
            isVerifiedPurchase: body.isVerifiedPurchase || false,
        });
    }

    @Get('vendor/:id')
    async getVendorReviews(@Param('id') id: string) {
        return this.reviewsService.getVendorReviews(parseInt(id));
    }
}
