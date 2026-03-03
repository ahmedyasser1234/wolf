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

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.installmentsService.delete(id);
    }
}
