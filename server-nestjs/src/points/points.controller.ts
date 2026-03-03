import { Controller, Get, UseGuards, Request, Post } from '@nestjs/common';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('points')
export class PointsController {
    constructor(private readonly pointsService: PointsService) { }

    @Get('my-points')
    @UseGuards(JwtAuthGuard)
    async getMyPoints(@Request() req) {
        const userId = req.user.id;
        const pointsRecord = await this.pointsService.getOrCreatePoints(userId);
        const history = await this.pointsService.getHistory(userId);

        return {
            points: pointsRecord.points,
            history,
        };
    }

    @Post('redeem')
    @UseGuards(JwtAuthGuard)
    async redeem(@Request() req) {
        const userId = req.user.id;
        return await this.pointsService.redeemPoints(userId);
    }
}
