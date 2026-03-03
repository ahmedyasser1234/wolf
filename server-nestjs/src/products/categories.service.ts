import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { categories } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CloudinaryService } from '../media/cloudinary.provider';

@Injectable()
export class CategoriesService {
    constructor(
        private databaseService: DatabaseService,
        private readonly cloudinary: CloudinaryService,
    ) { }

    async findAll() {
        return await this.databaseService.db
            .select()
            .from(categories)
            .where(eq(categories.isActive, true))
            .orderBy(desc(categories.displayOrder));
    }

    async findOne(id: number) {
        const result = await this.databaseService.db
            .select()
            .from(categories)
            .where(eq(categories.id, id))
            .limit(1);

        return result[0] || null;
    }

    async create(data: any, files: Express.Multer.File[]) {
        console.log("⚙️ [Categories Service] Processing Create Category...");
        console.log("   - Data Received:", JSON.stringify(data));

        let imageUrl = data.image || null;

        // Upload image if file is provided
        const imageFile = files?.find(f => f.fieldname === 'image');
        if (imageFile) {
            console.log("   - 📸 Image file detected, starting Cloudinary upload...");
            try {
                const result = await this.cloudinary.uploadFile(imageFile);
                if ('secure_url' in result) {
                    imageUrl = result.secure_url;
                    console.log("   - ✅ Image Uploaded Successfully:", imageUrl);
                } else {
                    console.warn("   - ⚠️ Cloudinary upload returned no secure_url:", result);
                }
            } catch (error) {
                console.error("   - ❌ Cloudinary Upload Failed:", error);
                throw new Error(`Cloudinary upload failed: ${error.message}`);
            }
        } else {
            console.log("   - ℹ️ No new image file provided, using URL if exists:", imageUrl);
        }

        // Improved Slug Generation
        let slug = (data.nameEn || data.nameAr || 'category').toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') // Allow Arabic chars
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');

        if (!slug || slug.length < 2) {
            slug = `cat-${Date.now()}`;
        }

        console.log("   - 🔗 Generated Slug:", slug);

        // Ensure uniqueness
        const existing = await this.databaseService.db.query.categories.findFirst({
            where: eq(categories.slug, slug)
        });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
            console.log("   - ⚠️ Slug conflict detected, revised to:", slug);
        }

        const displayOrder = parseInt(data.displayOrder?.toString() || '0');

        try {
            console.log("   - 💾 Attempting Database Insertion...");
            const insertValues = {
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                descriptionAr: data.descriptionAr || null,
                descriptionEn: data.descriptionEn || null,
                image: imageUrl,
                slug,
                displayOrder,
            };
            console.log("   - 📦 Insert Payload:", JSON.stringify(insertValues));

            const [newCategory] = await this.databaseService.db
                .insert(categories)
                .values(insertValues)
                .returning();

            console.log("✅ [Categories Service] Category Created successfully, ID:", newCategory.id);
            return newCategory;
        } catch (error) {
            console.error("❌ [Categories Service] Database Insert Failed:", error);
            // Provide more specific error if possible
            if (error.code === '23505') {
                throw new Error(`A category with this slug or name already exists (DB Error: ${error.detail})`);
            }
            throw error;
        }
    }

    async update(id: number, data: any, files: Express.Multer.File[]) {
        let imageUrl = data.image;

        // Upload image if file is provided
        const imageFile = files?.find(f => f.fieldname === 'image');
        if (imageFile) {
            const result = await this.cloudinary.uploadFile(imageFile);
            if ('secure_url' in result) {
                imageUrl = result.secure_url;
            }
        }

        const [updatedCategory] = await this.databaseService.db
            .update(categories)
            .set({
                ...data,
                image: imageUrl,
                updatedAt: new Date(),
            })
            .where(eq(categories.id, id))
            .returning();

        return updatedCategory;
    }

    async remove(id: number) {
        await this.databaseService.db
            .delete(categories)
            .where(eq(categories.id, id));

        return { success: true };
    }
}
