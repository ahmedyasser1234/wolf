import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class InvoicingService {
    async generateInvoice(order: any): Promise<string> {
        const invoicesDir = join(process.cwd(), 'uploads', 'invoices');
        if (!existsSync(invoicesDir)) {
            mkdirSync(invoicesDir, { recursive: true });
        }

        const fileName = `invoice-${order.orderNumber}.pdf`;
        const filePath = join(invoicesDir, fileName);
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        return new Promise((resolve, reject) => {
            const stream = createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('WOLF TECHNO', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`فاتورة رقم: ${order.orderNumber}`, { align: 'right' });
            doc.text(`التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}`, { align: 'right' });
            doc.moveDown();

            // Customer Info
            doc.text(`العميل: ${order.shippingAddress?.name || order.customer?.name || 'غير معروف'}`, { align: 'right' });
            doc.text(`العنوان: ${order.shippingAddress?.address || ''}`, { align: 'right' });
            doc.moveDown();

            // Table Header
            let y = 250;
            doc.font('Helvetica-Bold');
            doc.text('المنتج', 400, y);
            doc.text('الكمية', 300, y);
            doc.text('السعر', 200, y);
            doc.text('الإجمالي', 100, y);
            doc.font('Helvetica');

            // Items
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    y += 30;
                    doc.text(item.productNameAr || item.productNameEn || 'منتج', 400, y);
                    doc.text(item.quantity.toString(), 300, y);
                    doc.text(`${item.price} ر.س`, 200, y);
                    doc.text(`${item.total} ر.س`, 100, y);
                });
            }

            // Calculations
            y += 50;
            doc.text(`المجموع الفرعي: ${order.subtotal} ر.س`, 100, y, { align: 'left' });
            y += 20;
            doc.text(`الخصم: ${order.discount} ر.س`, 100, y, { align: 'left' });
            y += 20;
            doc.text(`تكلفة الشحن: ${order.shippingCost} ر.س`, 100, y, { align: 'left' });
            y += 30;
            doc.fontSize(16).text(`الإجمالي الكلي: ${order.total} ر.س`, 100, y, { align: 'left' });

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }
}
