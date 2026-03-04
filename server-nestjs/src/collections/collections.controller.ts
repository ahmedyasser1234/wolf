import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CollectionsService } from './collections.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('collections')
export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    @UseInterceptors(FileInterceptor('image'))
    create(
        @Body() createCollectionDto: any,
        @UploadedFile(new FileValidationPipe()) image?: Express.Multer.File
    ) {
        console.log("📥 [Collections Controller] Create Request Received:", {
            body: { ...createCollectionDto, image: createCollectionDto.image ? 'Base64/Url' : 'None' },
            file: image ? 'File Present' : 'No File'
        });

        const categoryId = parseInt(createCollectionDto.categoryId);
        const downPaymentPercentage = parseFloat(createCollectionDto.downPaymentPercentage || '0');

        // Robust parsing results
        const validCategoryId = isNaN(categoryId) ? null : categoryId;
        const validDownPayment = isNaN(downPaymentPercentage) ? 0 : downPaymentPercentage;

        console.log("🔢 [Collections Controller] Parsed IDs:", { categoryId: validCategoryId, downPaymentPercentage: validDownPayment });

        return this.collectionsService.create({
            ...createCollectionDto,
            categoryId: validCategoryId,
            downPaymentPercentage: validDownPayment,
            image
        });
    }

    @Get()
    findAll() {
        return this.collectionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.collectionsService.findOne(+id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    @UseInterceptors(FileInterceptor('image'))
    update(
        @Param('id') id: string,
        @Body() updateCollectionDto: any,
        @UploadedFile(new FileValidationPipe()) image?: Express.Multer.File
    ) {
        if (updateCollectionDto.downPaymentPercentage !== undefined) {
            updateCollectionDto.downPaymentPercentage = Number(updateCollectionDto.downPaymentPercentage || 0);
        }
        return this.collectionsService.update(+id, {
            ...updateCollectionDto,
            image
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    remove(@Param('id') id: string) {
        return this.collectionsService.remove(+id);
    }
}
