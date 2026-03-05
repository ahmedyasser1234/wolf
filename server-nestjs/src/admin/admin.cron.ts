import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdminService } from './admin.service';
import { CloudinaryService } from '../media/cloudinary.provider';
import { NotificationsService } from '../notifications/notifications.service';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminCronService {
    private readonly logger = new Logger(AdminCronService.name);

    constructor(
        private readonly adminService: AdminService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly notificationsService: NotificationsService,
        private readonly databaseService: DatabaseService
    ) { }

    // Run at 11:59 PM every day
    @Cron('59 23 * * *')
    async exportDailyCustomers() {
        this.logger.log('Starting daily customer data export...');

        try {
            // 1. Generate the Excel buffer
            const buffer = await this.adminService.exportCustomers();

            // 2. Upload to Cloudinary as a raw file
            // We pass a buffer, so we use upload_stream from Cloudinary.
            // The existing CloudinaryService might only support paths. Let's check or use a custom upload.
            // Assuming CloudinaryService has a method to upload buffers, or we wrap it.
            // Let's implement a direct buffer upload here to be safe, since it's a raw file.

            const uploadResult = await new Promise((resolve, reject) => {
                const cloudinaryRoot = require('cloudinary').v2;
                const uploadStream = cloudinaryRoot.uploader.upload_stream(
                    {
                        resource_type: 'raw',
                        folder: 'exports',
                        public_id: `customers_export_${new Date().toISOString().split('T')[0]}`,
                        format: 'xlsx'
                    },
                    (error: any, result: any) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                // create a readable stream from the buffer and pipe it
                const stream = require('stream');
                const bufferStream = new stream.PassThrough();
                bufferStream.end(buffer);
                bufferStream.pipe(uploadStream);
            }) as any;

            this.logger.log(`Excel file uploaded to Cloudinary: ${uploadResult.secure_url}`);

            // 3. Find main admin(s) to notify
            const mainAdmins = await this.databaseService.db
                .select()
                .from(users)
                .where(eq(users.role, 'admin'));

            // 4. Notify all admins
            for (const admin of mainAdmins) {
                await this.notificationsService.notify(
                    admin.id,
                    'export_ready',
                    'تم تجهيز تقرير العملاء اليومي 📊',
                    `تقرير العملاء المحدث لهذا اليوم متاح الآن للتحميل. [اضغط هنا للتحميل](${uploadResult.secure_url})`,
                    null
                );
            }

            this.logger.log('Daily customer export completed and admins notified successfully.');

        } catch (error) {
            this.logger.error('Failed to execute daily customer export', error);
        }
    }
}
