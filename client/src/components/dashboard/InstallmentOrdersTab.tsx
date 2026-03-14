import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, FileText, ScanFace, CreditCard, CheckCircle, XCircle, Clock, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstallmentOrdersTab() {
    const queryClient = useQueryClient();
    const { language, t } = useLanguage();
    const [kycModalOrder, setKycModalOrder] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'pending_review' | 'paid' | 'cancelled' | 'all'>('pending_review');
    const [page, setPage] = useState(1);

    const confirmPaymentMutation = useMutation({
        mutationFn: async (orderId: number) => {
            return (await api.post(`/orders/${orderId}/confirm-deposit`)).data;
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم تأكيد الدفع بنجاح' : 'Payment confirmed successfully');
            queryClient.invalidateQueries({ queryKey: ['admin', 'installment-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] });
        },
        onError: () => toast.error(language === 'ar' ? 'فشلت عملية التأكيد' : 'Confirmation failed'),
    });

    const { data: ordersResult, isLoading, isFetching } = useQuery({
        queryKey: ['admin', 'installment-orders', filterStatus, page],
        queryFn: async () => (await api.get('/admin/orders', {
            params: {
                limit: 10,
                isInstallmentOnly: true,
                status: filterStatus,
                page
            }
        })).data,
    });

    const kycReviewMutation = useMutation({
        mutationFn: async ({ orderId, action, reason }: { orderId: number; action: 'approve' | 'reject'; reason?: string }) => {
            return (await api.post(`/orders/${orderId}/kyc-review`, { action, reason })).data;
        },
        onSuccess: (_, vars) => {
            toast.success(vars.action === 'approve'
                ? (language === 'ar' ? 'تمت الموافقة على الطلب ✅' : 'Request approved ✅')
                : (language === 'ar' ? 'تم رفض الطلب' : 'Request rejected'));
            setKycModalOrder(null);
            setRejectReason('');
            queryClient.invalidateQueries({ queryKey: ['admin', 'installment-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] });
        },
        onError: () => toast.error(language === 'ar' ? 'فشلت العملية' : 'Operation failed'),
    });

    const handleDownloadFullOrderData = (order: any) => {
        const customerName = order.customer?.name || order.shippingAddress?.name || 'Guest';
        const customerPhone = order.customer?.phone || order.shippingAddress?.phone || 'N/A';
        const customerEmail = order.customer?.email || 'N/A';
        const isAr = language === 'ar';

        const resolveUrl = (rawUrl: any) => {
            if (!rawUrl || typeof rawUrl !== 'string') return '';
            const url = rawUrl.trim();
            if (url.startsWith('http') || url.startsWith('data:')) return url;
            
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const origin = window.location.origin;
            
            let baseUrl = '';
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                baseUrl = `${protocol}//localhost:5000`;
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
    <title>Order Report #${order.orderNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: #f0f2f5; color: #1a1a1a; margin: 0; padding: 40px; }
        .container { max-width: 900px; margin: auto; background: #fff; padding: 50px; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.08); position: relative; overflow: hidden; }
        .watermark { position: absolute; top: -50px; right: -50px; opacity: 0.03; width: 400px; z-index: 0; pointer-events: none; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f0f2f5; padding-bottom: 30px; margin-bottom: 40px; position: relative; z-index: 1; }
        .header-logo { font-size: 32px; font-weight: 900; color: #7c3aed; letter-spacing: -1px; }
        .header-info { text-align: ${isAr ? 'left' : 'right'}; }
        .section { margin-bottom: 40px; position: relative; z-index: 1; }
        .section-title { font-size: 20px; font-weight: 900; color: #1a1a1a; display: flex; align-items: center; gap: 10px; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #7c3aed; width: fit-content; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .field { background: #f8fafc; padding: 15px 20px; border-radius: 15px; border: 1px solid #e2e8f0; }
        .label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .value { font-size: 16px; font-weight: 700; color: #1a1a1a; }
        .kyc-images { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 20px; }
        .kyc-item { background: #fff; border: 2px solid #f1f5f9; padding: 15px; border-radius: 20px; text-align: center; transition: all 0.3s ease; }
        .kyc-item:hover { border-color: #7c3aed; }
        .kyc-item img { width: 100%; height: 250px; object-fit: cover; border-radius: 12px; margin-top: 15px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
        th { background: #f8fafc; text-align: ${isAr ? 'right' : 'left'}; padding: 18px; font-size: 13px; font-weight: 900; color: #64748b; }
        td { padding: 18px; border-top: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; }
        .product-img { width: 60px; height: 80px; object-fit: cover; border-radius: 10px; }
        .total-row { background: #7c3aed; color: #fff; font-weight: 900; }
        .total-row td { border: none; font-size: 20px; padding: 25px; }
        .footer { text-align: center; margin-top: 60px; padding-top: 30px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 700; }
        .badge { display: inline-block; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .badge-deposit { background: #dcfce7; color: #15803d; }
    </style>
</head>
<body>
    <div class="container">
        <svg class="watermark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="50" font-family="Cairo" font-size="20" fill="currentColor">FUSTAN</text>
        </svg>

        <div class="header">
            <div>
                <div class="header-logo">FUSTAN / WOLF TECHNO</div>
                <div style="font-weight: 700; color: #64748b; margin-top: 5px;">${isAr ? 'تقرير بيانات العميل والطلب' : 'Customer & Order Data Report'}</div>
            </div>
            <div class="header-info">
                <div style="font-size: 24px; font-weight: 900;">#${order.orderNumber}</div>
                <div style="font-weight: 700; color: #64748b; font-size: 14px;">${new Date(order.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                ${isAr ? '👤 بيانات العميل' : '👤 Customer Identity'}
            </div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'الاسم بالكامل' : 'Full Name'}</span>
                    <span class="value">${customerName}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'رقم الهاتف' : 'Phone Number'}</span>
                    <span class="value">${customerPhone}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                    <span class="value">${customerEmail}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'عنوان السكن' : 'Address'}</span>
                    <span class="value">${order.kycData?.residentialAddress || order.shippingAddress?.address || 'N/A'}</span>
                </div>
            </div>
        </div>

        ${order.kycData ? `
        <div class="section">
            <div class="section-title">
                ${isAr ? '🆔 بيانات التحقق (KYC)' : '🆔 Verification Data'}
            </div>
            <div class="grid" style="margin-bottom: 30px;">
                <div class="field">
                    <span class="label">${isAr ? 'رقم الهوية / الإقامة' : 'National ID'}</span>
                    <span class="value">${order.kycData.idNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'رقم الباسبور' : 'Passport Number'}</span>
                    <span class="value">${order.kycData.passportNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'تاريخ الميلاد' : 'Date of Birth'}</span>
                    <span class="value">${order.kycData.dob || 'N/A'}</span>
                </div>
            </div>
            
            <div class="kyc-images">
                ${(order.kycData.faceId || order.kycData.faceIdImage || order.kycData.faceImage) ? `
                <div class="kyc-item">
                    <span class="label">${isAr ? 'صورة الوجه' : 'Face Photo'}</span>
                    <img src="${resolveUrl(order.kycData.faceId || order.kycData.faceIdImage || order.kycData.faceImage)}" alt="Face ID">
                </div>` : ''}
                
                ${(order.kycData.idFrontImage || order.kycData.residencyDoc || order.kycData.residencyImage || order.kycData.idImage) ? `
                <div class="kyc-item">
                    <span class="label">${isAr ? 'وجه الهوية' : 'ID Front'}</span>
                    <img src="${resolveUrl(order.kycData.idFrontImage || order.kycData.residencyDoc || order.kycData.residencyImage || order.kycData.idImage)}" alt="ID Front">
                </div>` : ''}

                ${(order.kycData.idBackImage) ? `
                <div class="kyc-item">
                    <span class="label">${isAr ? 'ظهر الهوية' : 'ID Back'}</span>
                    <img src="${resolveUrl(order.kycData.idBackImage)}" alt="ID Back">
                </div>` : ''}
                
                ${(order.kycData.passportDoc || order.kycData.passportImage) ? `
                <div class="kyc-item" style="grid-column: span ${(order.kycData.idBackImage) ? 1 : 2};">
                    <span class="label">${isAr ? 'صورة الجواز / المستند الإضافي' : 'Passport / Extra Document'}</span>
                    <img src="${resolveUrl(order.kycData.passportDoc || order.kycData.passportImage)}" alt="Passport">
                </div>` : ''}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">
                ${isAr ? '🛍️ تفاصيل الطلب' : '🛍️ Order Details'}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>${isAr ? 'المنتج' : 'Product'}</th>
                        <th>${isAr ? 'البيانات' : 'Details'}</th>
                        <th>${isAr ? 'الكمية' : 'Qty'}</th>
                        <th>${isAr ? 'الإجمالي' : 'Subtotal'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items?.map((item: any) => `
                    <tr>
                        <td style="width: 80px;">
                            <img class="product-img" src="${resolveUrl(item.product?.images?.[0] || item.productImage?.[0] || '')}" alt="P">
                        </td>
                        <td>
                            <div style="font-weight: 900; font-size: 15px;">${isAr ? (item.product?.nameAr || item.productNameAr) : (item.product?.nameEn || item.productNameEn)}</div>
                            <div style="font-size: 12px; color: #64748b; font-weight: 700; margin-top: 4px;">
                                ${item.size ? `Size: ${item.size} | ` : ''}${Number(item.price).toFixed(2)} ${t('currency')}
                            </div>
                        </td>
                        <td style="font-weight: 900;">${item.quantity}</td>
                        <td style="font-weight: 900; color: #7c3aed;">${Number(item.total).toFixed(2)} ${t('currency')}</td>
                    </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="3" style="text-align: ${isAr ? 'left' : 'right'}; border-radius: ${isAr ? '0 20px 20px 0' : '20px 0 0 20px'};">
                            ${isAr ? 'الإجمالي الكلي للطلب' : 'Grand Total Price'}
                        </td>
                        <td style="border-radius: ${isAr ? '20px 0 0 20px' : '0 20px 20px 0'};">
                            ${Number(order.total).toFixed(2)} ${t('currency')}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${order.installmentPlan ? `
        <div class="section">
            <div class="section-title">
                ${isAr ? '💳 بيانات الدفع والتقسيط' : '💳 Payment & Installments'}
            </div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'خطة التقسيط المختارة' : 'Installment Plan'}</span>
                    <span class="value">${order.installmentPlan.name} (${order.installmentPlan.months} ${isAr ? 'أشهر' : 'Mo'})</span>
                </div>
                <div class="field" style="background: #ecfdf5; border-color: #10b981;">
                    <span class="label" style="color: #059669;">${isAr ? 'المقدم المدفوع (تأكيد)' : 'Downpayment (Paid)'}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="value" style="color: #047857;">${Number(order.depositAmount).toFixed(2)} ${t('currency')}</span>
                        <span class="badge badge-deposit">${isAr ? 'تم الدفع' : 'PAID'}</span>
                    </div>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'طريقة دفع المقدم' : 'Deposit Method'}</span>
                    <span class="value">${order.depositPaymentMethod || 'N/A'}</span>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <div style="margin-bottom: 5px;">هذا التقرير يحتوي على بيانات حساسة للعملاء - يرجى التعامل معه بحذر</div>
            FUSTAN E-COMMERCE SYSTEM &copy; ${new Date().getFullYear()} | WOLF TECHNO
        </div>
    </div>
</body>
</html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `order_${order.orderNumber}_report.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(isAr ? "تم تنزيل تقرير الطلب" : "Order report downloaded");
    };

    const installmentOrders = ordersResult?.orders || [];
    const totalPages = ordersResult?.totalPages || 1;
    const totalCount = ordersResult?.total || 0;

    const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
        pending_kyc_review: { label: language === 'ar' ? 'قيد المراجعة' : 'Under Review', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
        paid: { label: language === 'ar' ? 'مدفوع' : 'Paid', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
        failed: { label: language === 'ar' ? 'فشل' : 'Failed', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
        rejected: { label: language === 'ar' ? 'مرفوض' : 'Rejected', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
        pending: { label: language === 'ar' ? 'معلق' : 'Pending', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
        awaiting_deposit_payment: { label: language === 'ar' ? 'تم الدفع / قيد المراجعة' : 'Paid / Under Review', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    };

    if (isLoading) return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {[1, 2, 3].map(i => (
                <Card key={i} className="bg-background border border-gray-800 rounded-[2rem]">
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1">{language === 'ar' ? 'طلبات التقسيط' : 'Installment Requests'}</h2>
                    <p className="text-gray-400 font-bold text-xs sm:text-sm flex items-center gap-2">
                        {language === 'ar' ? `${totalCount} طلب متاح` : `${totalCount} request(s) found`}
                        {isFetching && !isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    {([
                        { key: 'pending_review', label: language === 'ar' ? 'قيد المراجعة' : 'Under Review' },
                        { key: 'paid', label: language === 'ar' ? 'مدفوع' : 'Paid' },
                        { key: 'cancelled', label: language === 'ar' ? 'ملغى' : 'Cancelled' },
                        { key: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                    ] as const).map(f => (
                        <button
                            key={f.key}
                            onClick={() => {
                                setFilterStatus(f.key);
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${filterStatus === f.key
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            {installmentOrders.length === 0 ? (
                <Card className="bg-background border border-gray-800 rounded-[2.5rem]">
                    <CardContent className="p-20 text-center">
                        <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">
                            {language === 'ar' ? 'لا توجد طلبات' : 'No requests found'}
                        </h3>
                        <p className="text-gray-500 font-bold">
                            {language === 'ar' ? 'لا توجد طلبات تقسيط في هذه الفئة' : 'No installment requests in this category'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-5">
                    {installmentOrders.map((order: any) => (
                        <Card key={order.id} className="bg-background border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:border-gray-600 transition-all group">
                            <CardContent className="p-0">
                                <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-5">
                                    {/* Left: Order Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <span className="text-xl font-black text-white">#{order.orderNumber}</span>
                                            <span className={`text-xs font-black px-3 py-1.5 rounded-full ${STATUS_CONFIG[order.paymentStatus]?.color || STATUS_CONFIG['pending']?.color}`}>
                                                {STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'العميل' : 'Customer'}</p>
                                                <p className="font-bold text-white">{order.customer?.name || order.shippingAddress?.name || (language === 'ar' ? 'ضيف' : 'Guest')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'إجمالي الطلب' : 'Order Total'}</p>
                                                <p className="font-bold text-primary">{Number(order.total).toFixed(2)} {t('currency')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'تاريخ الطلب' : 'Date'}</p>
                                                <p className="font-bold text-gray-300">{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'المنتجات' : 'Items'}</p>
                                                <p className="font-bold text-gray-300">{order.items?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex gap-3 flex-shrink-0">
                                        <div className="flex gap-2">
                                            {['pending_kyc_review', 'awaiting_deposit_payment'].includes(order.paymentStatus) && (
                                                <Button
                                                    onClick={() => setKycModalOrder(order)}
                                                    className="bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl px-6 h-12 gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {language === 'ar' ? 'مراجعة الطلب' : 'Review Request'}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDownloadFullOrderData(order)}
                                                className="w-12 h-12 rounded-2xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                title={language === 'ar' ? 'تنزيل كافة البيانات' : 'Download All Data'}
                                            >
                                                <Download className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8 pb-10">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isFetching}
                                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 rounded-xl px-6"
                            >
                                {language === 'ar' ? 'السابق' : 'Previous'}
                            </Button>
                            <span className="text-gray-400 font-bold">
                                {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || isFetching}
                                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 rounded-xl px-6"
                            >
                                {language === 'ar' ? 'التالي' : 'Next'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* KYC Review Modal */}
            {kycModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.88)' }}>
                    <div className="bg-gray-950 border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] p-5 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-1">{language === 'ar' ? 'مراجعة طلب التقسيط' : 'Installment KYC Review'}</h2>
                                    <span className="text-sm font-bold text-amber-400">#{kycModalOrder.orderNumber}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadFullOrderData(kycModalOrder)}
                                    className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    title={language === 'ar' ? 'تنزيل كافة البيانات' : 'Download All Data'}
                                >
                                    <Download className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-bold">{language === 'ar' ? 'حالة الطلب' : 'Order Status'}</p>
                                <p className="text-xl font-black text-primary">{({
                                    'pending_kyc_review': language === 'ar' ? 'مراجعة أوراق' : 'KYC Review',
                                    'pending_payment': language === 'ar' ? 'بانتظار الدفع' : 'Awaiting Payment',
                                    'paid': language === 'ar' ? 'مدفوع' : 'Paid',
                                } as any)[kycModalOrder.status] || kycModalOrder.status}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-gray-900 p-5 rounded-2xl mb-6 border border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{language === 'ar' ? 'بيانات العميل' : 'Customer Info'}</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-400 font-black text-lg">
                                    {(kycModalOrder.customer?.name?.[0] || kycModalOrder.shippingAddress?.name?.[0] || 'G').toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-black">{kycModalOrder.customer?.name || kycModalOrder.shippingAddress?.name || 'Guest'}</p>
                                    <p className="text-gray-400 text-sm">{kycModalOrder.customer?.email}</p>
                                    <p className="text-gray-400 text-sm">{kycModalOrder.customer?.phone || kycModalOrder.shippingAddress?.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items & Plan Info */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Products Info */}
                            <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex flex-col">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{language === 'ar' ? 'المنتجات المطلوبة' : 'Ordered Products'}</p>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                                    {kycModalOrder.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                            <img
                                                src={item.product?.images?.[0] || item.productImage?.[0] || ''}
                                                alt="Product"
                                                className="w-12 h-12 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-white font-bold text-xs truncate">
                                                    {language === 'ar'
                                                        ? (item.product?.nameAr || item.productNameAr)
                                                        : (item.product?.nameEn || item.productNameEn)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {item.size && (
                                                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-700 text-gray-400">{item.size}</span>
                                                    )}
                                                    <p className="text-gray-500 text-[10px] font-bold">
                                                        {item.quantity} × {Number(item.price).toFixed(2)} {t('currency')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!kycModalOrder.items || kycModalOrder.items.length === 0) && (
                                        <p className="text-gray-500 text-xs italic font-bold text-center py-4">{language === 'ar' ? 'لا توجد منتجات' : 'No items found'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Plan Info */}
                            {kycModalOrder.installmentPlan && (
                                <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{language === 'ar' ? 'خطة التقسيط' : 'Installment Plan'}</p>
                                    <div className="space-y-1">
                                        <p className="text-white font-black text-sm">
                                            {kycModalOrder.installmentPlan.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-amber-400 font-bold">{kycModalOrder.installmentPlan.months} {language === 'ar' ? 'شهر' : 'Months'}</span>
                                            <span className="text-gray-500">|</span>
                                            <span className="text-emerald-400 font-bold">{language === 'ar' ? 'مقدم' : 'Downpayment'}: {kycModalOrder.installmentPlan.downPaymentPercentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Deposit Info */}
                        {kycModalOrder.depositAmount && (
                            <div className="bg-emerald-900/20 p-5 rounded-2xl mb-6 border border-emerald-500/20">
                                <div className="flex justify-between items-center text-start">
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        {language === 'ar' ? 'المقدم المدفوع' : 'Downpayment Paid'}
                                    </div>
                                    <div className="text-xl font-black text-emerald-400">
                                        {Number(kycModalOrder.depositAmount).toFixed(2)} {t('currency')}
                                    </div>
                                </div>
                                <div className="text-xs text-emerald-500/70 font-bold mt-1 text-start">
                                    {language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'} {({
                                        'card': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                                        'wallet': language === 'ar' ? 'المحفظة' : 'Wallet',
                                        'gift_card': language === 'ar' ? 'كارت هدية' : 'Gift Card',
                                        'stripe': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                                    } as any)[kycModalOrder.depositPaymentMethod] || kycModalOrder.depositPaymentMethod}
                                </div>
                            </div>
                        )}

                        {/* KYC Documents */}
                        {kycModalOrder.kycData ? (
                            <div className="space-y-4 mb-6">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-start">{language === 'ar' ? 'المستندات المرفوعة' : 'Uploaded Documents'}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(kycModalOrder.kycData.faceIdImage || kycModalOrder.kycData.faceId || kycModalOrder.kycData.faceImage) && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ScanFace className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'صورة الوجه' : 'Face Image'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.faceIdImage || kycModalOrder.kycData.faceId || kycModalOrder.kycData.faceImage}
                                                alt="Face"
                                                className="w-full h-40 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => {
                                                    const url = kycModalOrder.kycData.faceIdImage || kycModalOrder.kycData.faceId || kycModalOrder.kycData.faceImage;
                                                    if (!url) return;
                                                    const fullUrl = (url.startsWith('http') || url.startsWith('data:')) 
                                                        ? url 
                                                        : `${window.location.origin}${window.location.hostname === 'localhost' ? ':5000' : '/api'}${url.startsWith('/') ? '' : '/'}${url}`;
                                                    window.open(fullUrl, '_blank');
                                                }}
                                            />
                                        </div>
                                    )}

                                    {(kycModalOrder.kycData.idFrontImage || kycModalOrder.kycData.residencyImage || kycModalOrder.kycData.residencyDoc || kycModalOrder.kycData.idImage) && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CreditCard className="w-4 h-4 text-green-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'وجه الهوية' : 'ID Front'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.idFrontImage || kycModalOrder.kycData.residencyImage || kycModalOrder.kycData.residencyDoc || kycModalOrder.kycData.idImage}
                                                alt="ID Front"
                                                className="w-full h-40 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => {
                                                    const url = kycModalOrder.kycData.idFrontImage || kycModalOrder.kycData.residencyImage || kycModalOrder.kycData.residencyDoc || kycModalOrder.kycData.idImage;
                                                    if (!url) return;
                                                    const fullUrl = (url.startsWith('http') || url.startsWith('data:')) 
                                                        ? url 
                                                        : `${window.location.origin}${window.location.hostname === 'localhost' ? ':5000' : '/api'}${url.startsWith('/') ? '' : '/'}${url}`;
                                                    window.open(fullUrl, '_blank');
                                                }}
                                            />
                                        </div>
                                    )}

                                    {kycModalOrder.kycData.idBackImage && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CreditCard className="w-4 h-4 text-emerald-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'ظهر الهوية' : 'ID Back'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.idBackImage}
                                                alt="ID Back"
                                                className="w-full h-40 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => {
                                                    const url = kycModalOrder.kycData.idBackImage;
                                                    if (!url) return;
                                                    const fullUrl = (url.startsWith('http') || url.startsWith('data:')) 
                                                        ? url 
                                                        : `${window.location.origin}${window.location.hostname === 'localhost' ? ':5000' : '/api'}${url.startsWith('/') ? '' : '/'}${url}`;
                                                    window.open(fullUrl, '_blank');
                                                }}
                                            />
                                        </div>
                                    )}

                                    {(kycModalOrder.kycData.passportImage || kycModalOrder.kycData.passportDoc) && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 sm:col-span-2">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'جواز السفر / ملف إضافي' : 'Passport / Extra Doc'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.passportImage || kycModalOrder.kycData.passportDoc}
                                                alt="Passport"
                                                className="w-full h-48 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => {
                                                    const url = kycModalOrder.kycData.passportImage || kycModalOrder.kycData.passportDoc;
                                                    if (!url) return;
                                                    const fullUrl = (url.startsWith('http') || url.startsWith('data:')) 
                                                        ? url 
                                                        : `${window.location.origin}${window.location.hostname === 'localhost' ? ':5000' : '/api'}${url.startsWith('/') ? '' : '/'}${url}`;
                                                    window.open(fullUrl, '_blank');
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Manual KYC Data */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    {kycModalOrder.kycData.idNumber && (
                                        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-start">{language === 'ar' ? 'رقم الهوية' : 'ID Number'}</p>
                                            <p className="text-white font-black text-start">{kycModalOrder.kycData.idNumber}</p>
                                        </div>
                                    )}
                                    {kycModalOrder.kycData.passportNumber && (
                                        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-start">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</p>
                                            <p className="text-white font-black text-start">{kycModalOrder.kycData.passportNumber}</p>
                                        </div>
                                    )}
                                    {kycModalOrder.kycData.dob && (
                                        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-start">{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p>
                                            <p className="text-white font-black text-start">{kycModalOrder.kycData.dob}</p>
                                        </div>
                                    )}
                                    {kycModalOrder.kycData.residentialAddress && (
                                        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50 sm:col-span-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-start">{language === 'ar' ? 'عنوان السكن' : 'Residential Address'}</p>
                                            <p className="text-white font-black text-start">{kycModalOrder.kycData.residentialAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-900 p-6 rounded-2xl mb-6 text-center border border-gray-800">
                                <p className="text-gray-400 font-bold">{language === 'ar' ? 'لا توجد مستندات مرفوعة' : 'No documents uploaded'}</p>
                            </div>
                        )}

                        {/* Reject Reason */}
                        <div className="mb-6">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                                {language === 'ar' ? 'سبب الرفض (اختياري - سيُرسل للعميل)' : 'Reject Reason (optional — sent to customer)'}
                            </label>
                            <Textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder={language === 'ar' ? 'اكتب سبب الرفض إن وجد...' : 'Write rejection reason if any...'}
                                className="bg-gray-900 border-gray-800 text-white rounded-2xl min-h-[80px] focus:border-gray-600"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Button
                                onClick={() => kycReviewMutation.mutate({ orderId: kycModalOrder.id, action: 'reject', reason: rejectReason })}
                                disabled={kycReviewMutation.isPending}
                                className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 font-black text-white gap-2 shadow-lg shadow-red-900/40"
                            >
                                {kycReviewMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                {language === 'ar' ? 'رفض الطلب' : 'Reject'}
                            </Button>
                            <Button
                                onClick={() => kycReviewMutation.mutate({ orderId: kycModalOrder.id, action: 'approve' })}
                                disabled={kycReviewMutation.isPending}
                                className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black text-white gap-2 shadow-lg shadow-emerald-900/40"
                            >
                                {kycReviewMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                {language === 'ar' ? 'الموافقة على الطلب' : 'Approve'}
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => { setKycModalOrder(null); setRejectReason(''); }}
                            className="w-full text-gray-500 hover:text-white"
                        >
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
