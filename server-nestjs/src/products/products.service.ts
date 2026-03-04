import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { products, categories, vendors, collections, productColors } from '../database/schema';
import { eq, and, like, desc, or, SQL } from 'drizzle-orm';
import { CloudinaryService } from '../media/cloudinary.provider';

@Injectable()
export class ProductsService {
    constructor(
        private databaseService: DatabaseService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async create(data: any, files: Express.Multer.File[]) {
        console.log("⚙️ [Products Service] Processing Create Product...");
        try {
            const imageUrls: string[] = [];
            const collectionId = data.collectionId ? parseInt(data.collectionId) : null;

            console.log(`⚙️ [Products Service] Params: Collection=${collectionId}`);

            if (!collectionId || isNaN(collectionId)) {
                console.error("❌ [Products Service] Missing or Invalid Collection ID:", data.collectionId);
                throw new BadRequestException('Product must belong to a valid collection');
            }

            if (!collectionId) {
                console.error("❌ [Products Service] Missing Collection ID");
                throw new BadRequestException('Collection is required');
            }

            // Verify collection and get categoryId
            const collection = await this.databaseService.db.query.collections.findFirst({
                where: eq(collections.id, collectionId),
            });

            if (!collection) {
                console.error(`❌ [Products Service] Collection not found: ID ${collectionId}`);
                throw new BadRequestException('Invalid collection ID');
            }

            console.log("✅ [Products Service] Collection found:", collection.nameAr || collection.nameEn);

            // Upload main product images
            const mainFiles = files?.filter(f => f.fieldname === 'images') || [];
            if (mainFiles.length > 0) {
                console.log(`📸 [Products Service] Uploading ${mainFiles.length} main images...`);
                const uploadPromises = mainFiles.map(file => this.cloudinary.uploadFile(file));
                const results = await Promise.all(uploadPromises);

                results.forEach(result => {
                    if ('secure_url' in result) {
                        imageUrls.push(result.secure_url);
                    }
                });
            }

            // Upload AI-Ready Image
            let aiQualifiedImageUrl: string | null = null;
            const aiFile = files?.find(f => f.fieldname === 'aiQualifiedImage');
            if (aiFile) {
                console.log("✨ [Products Service] Uploading AI image...");
                const result = await this.cloudinary.uploadFile(aiFile);
                if ('secure_url' in result) {
                    aiQualifiedImageUrl = result.secure_url;
                }
            }

            const slug = data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

            console.log("🧪 [Products Service] Parsing arrays...");
            const sizesArr = typeof data.sizes === 'string' ? JSON.parse(data.sizes) : data.sizes;
            const tagsArr = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags;
            const colorVariantsArr = typeof data.colorVariants === 'string' ? JSON.parse(data.colorVariants) : data.colorVariants;

            let totalStock = 0;
            if (Array.isArray(sizesArr)) {
                totalStock = sizesArr.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
            }

            // Price is exactly what the admin sets
            const finalPrice = parseFloat(data.price);
            const vendorOriginalPrice = parseFloat(data.originalPrice || finalPrice.toString());

            console.log("💰 [Products Service] Price Configuration:", { finalPrice, vendorOriginalPrice });

            return await this.databaseService.db.transaction(async (tx) => {
                console.log("🚀 [Products Service] Starting DB Transaction...");
                const [newProduct] = await tx.insert(products).values({
                    ...data,
                    sku: data.sku,
                    tags: tagsArr,
                    cutType: data.cutType,
                    bodyShape: data.bodyShape,
                    impression: data.impression,
                    occasion: data.occasion,
                    slug,
                    collectionId,
                    categoryId: collection.categoryId,
                    images: imageUrls,
                    aiQualifiedImage: aiQualifiedImageUrl,
                    discount: parseFloat(data.discount || '0'),
                    price: finalPrice,
                    originalPrice: vendorOriginalPrice,
                    stock: totalStock,
                    sizes: sizesArr,
                }).returning();

                // Handle Color Variants
                if (Array.isArray(colorVariantsArr) && colorVariantsArr.length > 0) {
                    console.log(`🎨 [Products Service] Processing ${colorVariantsArr.length} color variants...`);
                    for (const variant of colorVariantsArr) {
                        const variantImages: string[] = [];

                        if (variant.imageFieldPrefix) {
                            const variantFiles = files.filter(f => f.fieldname.startsWith(variant.imageFieldPrefix));
                            if (variantFiles.length > 0) {
                                const uploadPromises = variantFiles.map(file => this.cloudinary.uploadFile(file));
                                const results = await Promise.all(uploadPromises);

                                results.forEach(result => {
                                    if ('secure_url' in result) {
                                        variantImages.push(result.secure_url);
                                    }
                                });
                            }
                        }

                        await tx.insert(productColors).values({
                            productId: newProduct.id,
                            colorName: variant.colorName,
                            colorCode: variant.colorCode,
                            images: variantImages,
                        });
                    }
                }

                console.log("✅ [Products Service] Successfully created product with ID:", newProduct.id);
                return newProduct;
            });
        } catch (error) {
            console.error("🔥 [Products Service] Fatal Error during Create:", error);
            if (error instanceof SyntaxError) {
                console.error("   - JSON Parsing Error. Data received:", { sizes: data.sizes, tags: data.tags, variants: data.colorVariants });
            }
            throw error;
        }
    }

    async findAll(query?: string, categoryId?: number, limit = 20, offset = 0, vendorId?: number, collectionId?: number) {
        const conditions: SQL[] = [];

        // Default to showing only active products unless a specific vendor is requested (dashboard context)
        if (!vendorId) {
            conditions.push(eq(products.isActive, true));
        } else {
            conditions.push(eq(products.vendorId, vendorId));
        }

        if (query) {
            conditions.push(or(
                like(products.nameAr, `%${query}%`),
                like(products.nameEn, `%${query}%`)
            )!);
        }

        if (categoryId) {
            conditions.push(eq(products.categoryId, categoryId));
        }

        if (collectionId) {
            conditions.push(eq(products.collectionId, collectionId));
        }

        const foundProducts = await this.databaseService.db
            .select()
            .from(products)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(products.createdAt));

        // Fetch colors for these products
        const productIds = foundProducts.map(p => p.id);

        if (productIds.length > 0) {
            // Check if inArray is imported, if not use Promise.all or import it
            // Assuming we can use db.query or select from productColors
            const colorsMap = new Map<number, any[]>();

            // We need to import 'inArray' from drizzle-orm if not present.  
            // Since I cannot easily add top-level imports in this tool block without risking context,
            // I will use a loop if strict imports are an issue, BUT 'inArray' is standard. 
            // Let's assume I need to handle imports separately or use a safe approach.
            // Safer approach without risking missing 'inArray' import if not already there (it is NOT in line 4):
            // I will fetch colors for each product or fetch all.

            const allColors = await this.databaseService.db
                .select()
                .from(productColors)
                .where(or(...productIds.map(id => eq(productColors.productId, id))));

            allColors.forEach(c => {
                if (!colorsMap.has(c.productId)) {
                    colorsMap.set(c.productId, []);
                }
                colorsMap.get(c.productId)?.push(c);
            });

            return foundProducts.map(p => ({
                ...p,
                colors: colorsMap.get(p.id) || []
            }));
        }

        return foundProducts;
    }

    async findOne(id: number) {
        const result = await this.databaseService.db
            .select({
                product: products,
                vendor: {
                    id: vendors.id,
                    storeNameAr: vendors.storeNameAr,
                    storeNameEn: vendors.storeNameEn,
                    storeSlug: vendors.storeSlug,
                    logo: vendors.logo,
                    rating: vendors.rating,
                    totalReviews: vendors.totalReviews,
                    shippingCost: vendors.shippingCost,
                    commissionRate: vendors.commissionRate, // Include commissionRate
                },
                collection: {
                    id: collections.id,
                    nameAr: collections.nameAr,
                    nameEn: collections.nameEn,
                    slug: collections.slug,
                },
                category: {
                    id: categories.id,
                    nameAr: categories.nameAr,
                    nameEn: categories.nameEn,
                    slug: categories.slug,
                },
            })
            .from(products)
            .leftJoin(vendors, eq(products.vendorId, vendors.id))
            .leftJoin(collections, eq(products.collectionId, collections.id))
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(eq(products.id, id))
            .limit(1);

        if (result.length === 0) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        const colors = await this.getProductColors(id);

        return {
            ...result[0],
            colors
        };
    }

    async findFeatured(limit = 12) {
        return await this.databaseService.db
            .select()
            .from(products)
            .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
            .limit(limit)
            .orderBy(desc(products.createdAt));
    }

    async getCategories() {
        return await this.databaseService.db
            .select()
            .from(categories)
            .where(eq(categories.isActive, true))
            .orderBy(desc(categories.displayOrder));
    }

    async update(id: number, data: any, files?: Express.Multer.File[]) {
        const result = await this.findOne(id);
        const product = result.product;

        let imageUrls = product.images || [];
        const mainFiles = files?.filter(f => f.fieldname === 'images') || [];
        if (mainFiles.length > 0) {
            const uploadPromises = mainFiles.map(file => this.cloudinary.uploadFile(file));
            const results = await Promise.all(uploadPromises);
            const newUrls = results
                .filter(res => 'secure_url' in res)
                .map(res => (res as any).secure_url);

            imageUrls = newUrls;
        }

        // Upload AI-Ready Image if provided
        let aiQualifiedImageUrl = product.aiQualifiedImage;
        const aiFile = files?.find(f => f.fieldname === 'aiQualifiedImage');
        if (aiFile) {
            const result = await this.cloudinary.uploadFile(aiFile);
            if ('secure_url' in result) {
                aiQualifiedImageUrl = result.secure_url;
            }
        }

        const sizesArr = typeof data.sizes === 'string' ? JSON.parse(data.sizes) : data.sizes;
        const tagsArr = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags;

        let totalStock = product.stock;
        if (Array.isArray(sizesArr)) {
            totalStock = sizesArr.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
        }

        if (data.collectionId) {
            const collectionId = parseInt(data.collectionId);
            const collection = await this.databaseService.db.query.collections.findFirst({
                where: eq(collections.id, collectionId),
            });
            if (!collection || !collection.categoryId) {
                throw new BadRequestException('Invalid collection or collection has no category');
            }
            // Update categoryId to match collection
            (data as any).categoryId = collection.categoryId;
        }

        const colorVariantsArr = typeof data.colorVariants === 'string' ? JSON.parse(data.colorVariants) : data.colorVariants;

        // Price is exactly what the admin sets
        const finalPrice = parseFloat(data.price);
        const vendorOriginalPrice = parseFloat(data.originalPrice || finalPrice.toString());

        return await this.databaseService.db.transaction(async (tx) => {
            const [updatedProduct] = await tx
                .update(products)
                .set({
                    ...data,
                    sku: data.sku,
                    tags: tagsArr,
                    cutType: data.cutType,
                    bodyShape: data.bodyShape,
                    impression: data.impression,
                    occasion: data.occasion,
                    images: imageUrls,
                    aiQualifiedImage: aiQualifiedImageUrl,
                    stock: totalStock,
                    sizes: sizesArr,
                    price: finalPrice,
                    originalPrice: vendorOriginalPrice,
                    updatedAt: new Date(),
                })
                .where(eq(products.id, id))
                .returning();

            // Handle Color Variants
            if (Array.isArray(colorVariantsArr)) {
                const existingColors = await this.getProductColors(id);
                const existingColorIds = existingColors.map(c => c.id);
                const updatedColorIds = colorVariantsArr.filter(v => v.id).map(v => v.id);

                // Delete removed colors
                const colorIdsToDelete = existingColorIds.filter(cid => !updatedColorIds.includes(cid));
                for (const cid of colorIdsToDelete) {
                    await tx.delete(productColors).where(eq(productColors.id, cid));
                }

                // Add or update colors
                for (const variant of colorVariantsArr) {
                    const variantImages: string[] = variant.existingImages || [];

                    // Upload new images if any
                    if (variant.imageFieldPrefix) {
                        const variantFiles = files?.filter(f => f.fieldname.startsWith(variant.imageFieldPrefix)) || [];
                        if (variantFiles.length > 0) {
                            const uploadPromises = variantFiles.map(file => this.cloudinary.uploadFile(file));
                            const results = await Promise.all(uploadPromises);

                            results.forEach(result => {
                                if ('secure_url' in result) {
                                    variantImages.push(result.secure_url);
                                }
                            });
                        }
                    }

                    if (variant.id) {
                        // Update existing color
                        await tx.update(productColors)
                            .set({
                                colorName: variant.colorName,
                                colorCode: variant.colorCode,
                                images: variantImages,
                            })
                            .where(eq(productColors.id, variant.id));
                    } else {
                        // Add new color
                        await tx.insert(productColors).values({
                            productId: id,
                            colorName: variant.colorName,
                            colorCode: variant.colorCode,
                            images: variantImages,
                        });
                    }
                }
            }

            return updatedProduct;
        });
    }

    async remove(id: number) {
        await this.databaseService.db.delete(products).where(eq(products.id, id));
        return { success: true };
    }

    // ==================== Product Colors Management ====================

    async addProductColor(productId: number, colorData: { colorName: string; colorCode: string; images: string[] }) {
        const [newColor] = await this.databaseService.db.insert(productColors).values({
            productId,
            colorName: colorData.colorName,
            colorCode: colorData.colorCode,
            images: colorData.images,
        }).returning();

        return newColor;
    }

    async getProductColors(productId: number) {

        return await this.databaseService.db.query.productColors.findMany({
            where: eq(productColors.productId, productId),
        });
    }

    async updateProductColor(colorId: number, colorData: { colorName?: string; colorCode?: string; images?: string[] }) {
        const [updatedColor] = await this.databaseService.db
            .update(productColors)
            .set(colorData)
            .where(eq(productColors.id, colorId))
            .returning();

        return updatedColor;
    }

    async removeProductColor(colorId: number) {

        await this.databaseService.db.delete(productColors).where(eq(productColors.id, colorId));
        return { success: true };
    }
}
