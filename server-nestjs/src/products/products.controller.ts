import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseInterceptors, UploadedFiles, Patch, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    @UseInterceptors(AnyFilesInterceptor())
    async create(
        @Body() body: any,
        @UploadedFiles(new FileValidationPipe(50 * 1024 * 1024)) files: Express.Multer.File[]
    ) {
        console.log("📥 [Products Controller] Create Request Received");
        console.log("   - Body:", JSON.stringify(body, null, 2));
        console.log("   - Files Info:", files?.map(f => ({ fieldname: f.fieldname, name: f.originalname, size: f.size })));
        return this.productsService.create(body, files);
    }

    @Get()
    async findAll(
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('vendorId') vendorId?: string,
        @Query('collectionId') collectionId?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.productsService.findAll(
            search,
            categoryId ? parseInt(categoryId) : undefined,
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0,
            vendorId ? parseInt(vendorId) : undefined,
            collectionId ? parseInt(collectionId) : undefined,
        );
    }

    @Get('featured')
    async findFeatured(@Query('limit') limit?: string) {
        return this.productsService.findFeatured(limit ? parseInt(limit) : 12);
    }

    @Get('categories')
    async getCategories() {
        return this.productsService.getCategories();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    @UseInterceptors(AnyFilesInterceptor())
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @UploadedFiles(new FileValidationPipe(10 * 1024 * 1024)) files: Express.Multer.File[]
    ) {
        return this.productsService.update(id, body, files);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.remove(id);
    }

    // ==================== Product Colors Endpoints ====================

    @Post(':id/colors')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    async addColor(
        @Param('id', ParseIntPipe) productId: number,
        @Body() colorData: { colorName: string; colorCode: string; images: string[] }
    ) {
        return this.productsService.addProductColor(productId, colorData);
    }

    @Get(':id/colors')
    async getColors(@Param('id', ParseIntPipe) productId: number) {
        return this.productsService.getProductColors(productId);
    }

    @Patch('colors/:colorId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    async updateColor(
        @Param('colorId', ParseIntPipe) colorId: number,
        @Body() colorData: { colorName?: string; colorCode?: string; images?: string[] }
    ) {
        return this.productsService.updateProductColor(colorId, colorData);
    }

    @Delete('colors/:colorId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    async removeColor(@Param('colorId', ParseIntPipe) colorId: number) {
        return this.productsService.removeProductColor(colorId);
    }
}
