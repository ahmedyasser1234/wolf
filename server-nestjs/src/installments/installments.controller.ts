import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { InstallmentsService } from './installments.service';

@Controller('installments')
export class InstallmentsController {
    constructor(private readonly installmentsService: InstallmentsService) { }

    @Get()
    async findAll() {
        return this.installmentsService.findAll();
    }

    @Get('active')
    async findActive(@Query('collectionId') collectionId?: string) {
        return this.installmentsService.findActive(collectionId ? +collectionId : undefined);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.installmentsService.findOne(id);
    }

    @Post()
    async create(@Body() data: any) {
        return this.installmentsService.create(data);
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
        return this.installmentsService.update(id, data);
    }

    @Get('payments/admin')
    async getPaymentsForAdmin(
        @Query('date') date: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        return this.installmentsService.getPaymentsForAdmin(
            date,
            status,
            page ? +page : 1,
            limit ? +limit : 10
        );
    }

    @Get('payments/customer/:customerId')
    async getPaymentsForCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
        return this.installmentsService.getPaymentsForCustomer(customerId);
    }

    @Post('payments/:id/pay')
    async payInstallment(
        @Param('id', ParseIntPipe) id: number,
        @Body('customerId') customerId: number,
        @Body('paymentMethod') paymentMethod: string
    ) {
        return this.installmentsService.payInstallment(id, customerId, paymentMethod);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.installmentsService.delete(id);
    }
}
