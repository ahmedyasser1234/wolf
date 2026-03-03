import { v2 as cloudinary } from 'cloudinary';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
    provide: CLOUDINARY,
    useFactory: (configService: ConfigService) => {
        const cloudName = configService.get('CLOUDINARY_CLOUD_NAME') || process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = configService.get('CLOUDINARY_API_KEY') || process.env.CLOUDINARY_API_KEY;
        const apiSecret = configService.get('CLOUDINARY_API_SECRET') || process.env.CLOUDINARY_API_SECRET;

        console.log("☁️ [Cloudinary Provider] Factory executing...");
        console.log("   - Cloud Name:", cloudName || "MISSING");
        console.log("   - API Key:", apiKey ? "OK (len=" + apiKey.length + ")" : "MISSING");
        console.log("   - API Secret:", apiSecret ? "OK" : "MISSING");

        const config = {
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        };

        const result = cloudinary.config(config);
        console.log("   - Cloudinary Config Result (cloud_name):", result.cloud_name || "FAIL");
        return result;
    },
    inject: [ConfigService],
};

@Injectable()
export class CloudinaryService {
    constructor(@Inject(CLOUDINARY) private cloudinaryInstance: any) {
        console.log("🚀 [Cloudinary Service] Constructor running.");
        const currentConfig = cloudinary.config();

        if (!currentConfig.api_key) {
            console.warn("⚠️ [Cloudinary Service] API Key still missing after injection. Attempting manual fallback from process.env...");
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });
            const finalCheck = cloudinary.config();
            console.log("   - Final Check (api_key):", finalCheck.api_key ? "NOW OK" : "STILL MISSING");
        } else {
            console.log("✅ [Cloudinary Service] Validation: API Key is present.");
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: 'fustan-products',
                    transformation: [
                        { width: 1200, height: 1200, crop: "limit" },
                        { quality: "auto" },
                        { fetch_format: "auto" }
                    ]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                }
            );

            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }
}
