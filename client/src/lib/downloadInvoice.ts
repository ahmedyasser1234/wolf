export const downloadInvoice = (order: any, language: string, t: any) => {
    const customerName = order.customer?.name || order.shippingAddress?.name || 'Guest';
    const customerPhone = order.customer?.phone || order.shippingAddress?.phone || 'N/A';
    const customerEmail = order.customer?.email || 'N/A';
    const isAr = language === 'ar';

    const resolveUrl = (rawUrl: any) => {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        const url = rawUrl.trim();
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        
        const origin = window.location.origin;
        const hostname = window.location.hostname;
        
        let baseUrl = '';
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            baseUrl = `${window.location.protocol}//localhost:5000`;
        } else {
            baseUrl = `${origin}/api`;
        }
        
        const separator = url.startsWith('/') ? '' : '/';
        return `${baseUrl}${separator}${url}`;
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <title>Order Invoice #${order.orderNumber || ''}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
        
        :root {
            --primary: #e91e63;
            --primary-dark: #c2185b;
            --bg: #f8fafc;
            --card: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }

        body { 
            font-family: ${isAr ? "'Tajawal', sans-serif" : "'Inter', sans-serif"}; 
            background: var(--bg); 
            color: var(--text-main); 
            margin: 0; 
            padding: 40px; 
            -webkit-print-color-adjust: exact;
        }

        .container { 
            max-width: 850px; 
            margin: auto; 
            background: var(--card); 
            padding: 50px; 
            border-radius: 24px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.05); 
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, var(--primary), #fbc02d);
        }

        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 40px; 
        }

        .header h1 { 
            margin: 0; 
            color: var(--primary); 
            font-size: 32px; 
            font-weight: 900;
        }

        .header .order-no { 
            font-size: 14px;
            font-weight: bold; 
            color: var(--text-muted); 
            background: #f1f5f9;
            padding: 6px 12px;
            border-radius: 8px;
        }

        .section { margin-bottom: 35px; }

        .section-title { 
            font-size: 18px; 
            font-weight: 900; 
            color: var(--primary); 
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .section-title::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        
        .field { margin-bottom: 12px; }
        .label { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 700; color: var(--text-main); }

        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 10px; }
        
        th { 
            background: #f8fafc; 
            text-align: ${isAr ? 'right' : 'left'}; 
            padding: 14px; 
            font-size: 12px; 
            font-weight: 900;
            color: var(--text-muted); 
            border-bottom: 2px solid var(--border);
        }

        td { 
            padding: 16px 14px; 
            border-bottom: 1px solid var(--border); 
            font-size: 14px; 
            vertical-align: middle;
        }

        .product-cell { display: flex; align-items: center; gap: 15px; }
        .product-img { width: 45px; height: 55px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .product-info { font-weight: 700; color: var(--text-main); }

        .summary-table { margin-top: 25px; width: 100%; }
        .summary-row { display: flex; justify-content: flex-end; gap: 30px; padding: 8px 0; }
        .summary-label { color: var(--text-muted); font-weight: 700; min-width: 150px; text-align: ${isAr ? 'left' : 'right'}; }
        .summary-value { color: var(--text-main); font-weight: 700; min-width: 100px; text-align: ${isAr ? 'right' : 'left'}; }
        
        .total-row { 
            margin-top: 15px;
            padding: 15px 25px;
            background: #fff5f8;
            border-radius: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 30px;
            border: 1px solid #ffe4ed;
        }
        .total-label { color: var(--primary); font-weight: 900; font-size: 18px; min-width: 150px; text-align: ${isAr ? 'left' : 'right'}; }
        .total-value { color: var(--primary); font-weight: 900; font-size: 22px; min-width: 100px; text-align: ${isAr ? 'right' : 'left'}; }

        .discount-badge { color: #dc2626; background: #fee2e2; padding: 2px 8px; border-radius: 5px; font-size: 12px; }

        .footer { 
            text-align: center; 
            margin-top: 60px; 
            padding-top: 20px;
            border-top: 1px solid var(--border);
            font-size: 12px; 
            color: var(--text-muted);
            font-weight: 700;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            font-weight: 900;
            color: rgba(233, 30, 99, 0.03);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="watermark">FUSTAN STORE</div>
        
        <div class="header">
            <div>
                <h1>${isAr ? 'فاتورة الطلب' : 'TAX INVOICE'}</h1>
                <div style="color: var(--text-muted); font-weight: bold; margin-top: 5px;">${isAr ? 'شكراً لتسوقك معنا' : 'Thank you for shopping with us'}</div>
            </div>
            <div class="order-no">${order.orderNumber || ''}#</div>
        </div>

        <div class="section">
            <div class="section-title">${isAr ? 'بيانات العميل' : 'Customer Information'}</div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'الاسم بالكامل' : 'Full Name'}</span>
                    <span class="value">${customerName}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'رقم الهاتف' : 'Phone Number'}</span>
                    <span class="value" dir="ltr">${customerPhone}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                    <span class="value">${customerEmail}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'تاريخ الطلب' : 'Ordered At'}</span> 
                    <span class="value">${order.createdAt ? new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
                </div>
            </div>
            <div style="margin-top:20px;">
                <div class="field">
                    <span class="label">${isAr ? 'عنوان التوصيل' : 'Delivery Address'}</span>
                    <span class="value">${order.shippingAddress?.address || ''} - ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.country || ''}</span>      
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">${isAr ? 'تفاصيل المنتجات' : 'Product Details'}</div>
            <table>
                <thead>
                    <tr>
                        <th>${isAr ? 'الصورة' : 'Preview'}</th>
                        <th>${isAr ? 'المنتج' : 'Item'}</th>
                        <th>${isAr ? 'السعر' : 'Price'}</th>
                        <th>${isAr ? 'الكمية' : 'Qty'}</th>
                        <th>${isAr ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${(order.items || []).map((item: any) => `
                    <tr>
                        <td>
                            <img class="product-img" src="${resolveUrl(item.product?.images?.[0] || item.productImage?.[0] || item.product?.image || '')}">
                        </td>
                        <td>
                            <div class="product-info">${isAr ? (item.product?.nameAr || item.productNameAr || 'منتج') : (item.product?.nameEn || item.productNameEn || 'Product')}</div>
                            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                                ${item.size ? `${isAr ? 'المقاس' : 'Size'}: ${item.size}` : ''}
                                ${item.color ? ` | ${isAr ? 'اللون' : 'Color'}: ${item.color}` : ''}
                            </div>
                        </td>
                        <td>${Number(item.price || 0).toFixed(2)} ${t('currency')}</td>
                        <td>${item.quantity || 0}</td>
                        <td style="font-weight:bold">${Number(item.total || ((item.price || 0) * (item.quantity || 0))).toFixed(2)} ${t('currency')}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary-table">
                <div class="summary-row">
                    <div class="summary-label">${isAr ? 'المجموع الفرعي' : 'Subtotal'}</div>
                    <div class="summary-value">${Number(order.subtotal || 0).toFixed(2)} ${t('currency')}</div>
                </div>
                ${Number(order.shippingCost || 0) > 0 ? `
                <div class="summary-row">
                    <div class="summary-label">${isAr ? 'رسوم الشحن' : 'Shipping Fee'}</div>
                    <div class="summary-value">${Number(order.shippingCost).toFixed(2)} ${t('currency')}</div>
                </div>
                ` : ''}
                ${Number(order.discount || 0) > 0 ? `
                <div class="summary-row">
                    <div class="summary-label" style="color:#dc2626">${isAr ? 'إجمالي الخصم' : 'Total Discount'}</div>
                    <div class="summary-value" style="color:#dc2626">-${Number(order.discount).toFixed(2)} ${t('currency')}</div>
                </div>
                ` : ''}
                <div class="total-row">
                    <div class="total-label">${isAr ? 'الإجمالي النهائي' : 'GRAND TOTAL'}</div>
                    <div class="total-value">${Number(order.total || 0).toFixed(2)} ${t('currency')}</div>
                </div>
            </div>
        </div>

        ${order.installmentPlan ? `
        <div class="section">
            <div class="section-title">${isAr ? 'بيانات التقسيط' : 'Installment Info'}</div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'النظام المختار' : 'Plan Name'}</span>
                    <span class="value">${order.installmentPlan.name || ''}</span>    
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'فترة السداد' : 'Duration'}</span>
                    <span class="value">${order.installmentPlan.months || ''} ${isAr ? 'شهر' : 'Months'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'المقدم المدفوع' : 'Down Payment'}</span>
                    <span class="value">${Number(order.depositAmount || 0).toFixed(2)} ${t('currency')}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'حالة الدفع' : 'Payment Status'}</span>
                    <span class="value" style="color: ${order.paymentStatus === 'paid' ? '#059669' : '#d97706'}">
                        ${order.paymentStatus === 'paid' ? (isAr ? 'مدفوع بالكامل' : 'Fully Paid') : (isAr ? 'في انتظار السداد' : 'Awaiting Payment')}
                    </span> 
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            Wolf Techno / Fustan Store - ${new Date().getFullYear()} &copy;
            <br>
            <span style="font-size:10px; opacity:0.7;">${isAr ? 'هذه الفاتورة صدرت إلكترونياً ولا تحتاج لختم' : 'This is an electronically generated document.'}</span>
        </div>
    </div>
</body>
</html>
  `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${order.orderNumber || 'order'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
