import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UnauthorizedException, ParseIntPipe, Logger } from '@nestjs/common';
import { OffersService } from './offers.service';
import { AuthService } from '../auth/auth.service';
import { VendorsService } from '../vendors/vendors.service';
import type { Request } from 'express';
import { COOKIE_NAME } from '../common/constants';

@Controller('offers')
export class OffersController {
    constructor(
        private offersService: OffersService,
        private authService: AuthService,
        private vendorsService: VendorsService,
    ) { }

    private async getVendorId(req: Request): Promise<number> {
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (!token) throw new UnauthorizedException();

        const payload = await this.authService.verifySession(token);
        if (!payload) throw new UnauthorizedException();

        const user = await this.authService.findUserByOpenId(payload.openId);
        if (!user) throw new UnauthorizedException();

        const vendor = await this.vendorsService.findByUserId(user.id);
        if (!vendor) throw new UnauthorizedException('Vendor not found');

        return vendor.id;
    }

    @Post()
    async create(@Req() req: Request, @Body() body: any) {
        const vendorId = await this.getVendorId(req);
        return this.offersService.create(vendorId, body);
    }

    private readonly logger = new Logger(OffersController.name);

    @Get()
    async findAll(@Req() req: Request) {
        this.logger.log(`🔍 [OffersController] Request: ${req.url} | Query: ${JSON.stringify(req.query)}`);

        // 1. Try standard query param
        let vendorId = req.query.vendorId;

        // 2. Fallback: Parse from URL manually if missing
        if (!vendorId && req.url.includes('vendorId=')) {
            const match = req.url.match(/vendorId=(\d+)/);
            if (match) vendorId = match[1];
        }

        if (vendorId) {
            this.logger.log(`✅ [OffersController] Public Access via vendorId=${vendorId}`);
            return this.offersService.findAll(Number(vendorId));
        }

        // 3. Optional Auth for Dashboard view
        const token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.[COOKIE_NAME];

        if (token) {
            try {
                const payload = await this.authService.verifySession(token);
                if (payload) {
                    if (payload.role === 'admin') {
                        this.logger.log('👑 [OffersController] Admin view - all offers');
                        return this.offersService.findAll();
                    }

                    const user = await this.authService.findUserByOpenId(payload.openId);
                    if (user) {
                        const vendor = await this.vendorsService.findByUserId(user.id);
                        if (vendor) {
                            this.logger.log(`🏪 [OffersController] Vendor view - vendorId=${vendor.id}`);
                            return this.offersService.findAll(vendor.id);
                        }
                    }
                }
            } catch (e) {
                this.logger.warn(`⚠️ [OffersController] Auth error: ${e.message}`);
            }
        }

        // 4. Default: Public Global View (All offers)
        this.logger.log('🌐 [OffersController] Public Global View');
        return this.offersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.offersService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.offersService.update(id, body);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.offersService.delete(id);
    }
}
