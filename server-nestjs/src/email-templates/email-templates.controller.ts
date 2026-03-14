import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';

@Controller('admin/email-templates')
export class EmailTemplatesController {
    constructor(private readonly emailTemplatesService: EmailTemplatesService) { }

    @Get()
    async findAll() {
        return this.emailTemplatesService.findAll();
    }

    @Get('seed')
    async seed() {
        return this.emailTemplatesService.seedTemplates();
    }

    @Get(':type')
    async findOne(@Param('type') type: string) {
        return this.emailTemplatesService.findByType(type);
    }

    @Put(':type')
    async update(@Param('type') type: string, @Body() data: any) {
        return this.emailTemplatesService.updateTemplate(type, data);
    }
}
