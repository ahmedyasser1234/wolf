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
        @Body() createCollectionDto: { nameAr: string; nameEn: string; vendorId: string; categoryId: string; description?: string; downPaymentPercentage?: string },
        @UploadedFile(new FileValidationPipe()) image?: Express.Multer.File
    ) {
        console.log("Controller Received Request:", { body: createCollectionDto, file: image ? 'File Present' : 'No File' });
        return this.collectionsService.create({
            ...createCollectionDto,
            vendorId: Number(createCollectionDto.vendorId),
            categoryId: Number(createCollectionDto.categoryId),
            downPaymentPercentage: Number(createCollectionDto.downPaymentPercentage || 0),
            image
        });
    }

    @Get()
    findAll(@Query('vendorId') vendorId?: string) {
        return this.collectionsService.findAll(vendorId ? +vendorId : undefined);
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
