import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, Delete, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('categories')
export class CategoriesController {
    constructor(private categoriesService: CategoriesService) { }

    @Get()
    async findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @UseInterceptors(AnyFilesInterceptor())
    async create(
        @Body() body: any,
        @UploadedFiles(new FileValidationPipe()) files: Express.Multer.File[]
    ) {
        console.log("📥 [Categories Controller] POST /categories - Request Received");
        console.log("   - Payload Keys:", Object.keys(body));
        console.log("   - Files Count:", files?.length || 0);
        if (files && files.length > 0) {
            console.log("   - Files Map:", files.map(f => ({ field: f.fieldname, name: f.originalname, size: f.size })));
        }
        return this.categoriesService.create(body, files);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @UseInterceptors(AnyFilesInterceptor())
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @UploadedFiles(new FileValidationPipe()) files: Express.Multer.File[]
    ) {
        return this.categoriesService.update(id, body, files);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.remove(id);
    }
}
