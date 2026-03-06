import { useQuery } from "@tanstack/react-query";
import { X, Printer, MapPin, Phone, Mail, User, Package, Calendar, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import { endpoints } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface OrderDetailsViewProps {
    orderId: number;
    onClose: () => void;
}

export default function OrderDetailsView({ orderId, onClose }: OrderDetailsViewProps) {
    const { t, language } = useLanguage();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => await endpoints.orders.get(orderId),
        enabled: !!orderId,
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadFullOrderData = (order: any) => {
        const customerName = order.customer?.name || order.shippingAddress?.name || 'Guest';
        const customerPhone = order.customer?.phone || order.shippingAddress?.phone || 'N/A';
        const customerEmail = order.customer?.email || 'N/A';
        const isAr = language === 'ar';

        const htmlContent = `
<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <title>Order Report #${order.orderNumber}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; margin: 0; padding: 40px; }
        .container { max-width: 800px; margin: auto; background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #e91e63; font-size: 28px; }
        .header .order-no { font-weight: bold; color: #888; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #e91e63; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .field { margin-bottom: 10px; }
        .label { font-size: 12px; color: #888; font-weight: bold; text-transform: uppercase; display: block; }
        .value { font-size: 16px; font-weight: bold; }
        .kyc-images { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
        .kyc-item { border: 1px solid #eee; padding: 10px; border-radius: 10px; text-align: center; }
        .kyc-item img { max-width: 100%; height: auto; border-radius: 5px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #f8f9fa; text-align: ${isAr ? 'right' : 'left'}; padding: 12px; font-size: 13px; color: #888; border-bottom: 2px solid #eee; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .product-img { width: 50px; height: 60px; object-fit: cover; border-radius: 5px; display: block; }
        .total-row { background: #fdf2f5; font-weight: bold; font-size: 18px; color: #e91e63; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #aaa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${isAr ? 'تقرير الطلب' : 'Order Report'}</h1>
            <div class="order-no">#${order.orderNumber}</div>
        </div>

        <div class="section">
            <div class="section-title">${isAr ? 'بيانات العميل' : 'Customer Details'}</div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'الاسم' : 'Name'}</span>
                    <span class="value">${customerName}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'الهاتف' : 'Phone'}</span>
                    <span class="value">${customerPhone}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'البريد' : 'Email'}</span>
                    <span class="value">${customerEmail}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'تاريخ الطلب' : 'Order Date'}</span>
                    <span class="value">${new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                </div>
            </div>
        </div>

        ${order.kycData ? `
        <div class="section">
            <div class="section-title">${isAr ? 'بيانات التحقق (KYC)' : 'Verification (KYC)'}</div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'رقم الهوية' : 'ID Number'}</span>
                    <span class="value">${order.kycData.idNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'رقم الباسبور' : 'Passport Number'}</span>
                    <span class="value">${order.kycData.passportNumber || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'تاريخ الميلاد' : 'DOB'}</span>
                    <span class="value">${order.kycData.dob || 'N/A'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'عنوان السكن' : 'Residential Address'}</span>
                    <span class="value">${order.kycData.residentialAddress || 'N/A'}</span>
                </div>
            </div>
            
            <div class="kyc-images">
                ${(order.kycData.faceId || order.kycData.faceImage) ? `
                <div class="kyc-item">
                    <span class="label">${isAr ? 'صورة الوجه' : 'Face ID'}</span>
                    <img src="${order.kycData.faceId || order.kycData.faceImage}" alt="Face ID">
                </div>` : ''}
                
                ${(order.kycData.residencyDoc || order.kycData.idImage) ? `
                <div class="kyc-item">
                    <span class="label">${isAr ? 'الهوية / الإقامة' : 'ID / Residency'}</span>
                    <img src="${order.kycData.residencyDoc || order.kycData.idImage}" alt="ID Document">
                </div>` : ''}
                
                ${(order.kycData.passportDoc || order.kycData.passportImage) ? `
                <div class="kyc-item" style="grid-column: span 2;">
                    <span class="label">${isAr ? 'الجواز / الملف الإضافي' : 'Passport / Extra'}</span>
                    <img src="${order.kycData.passportDoc || order.kycData.passportImage}" alt="Passport">
                </div>` : ''}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">${isAr ? 'المنتجات المطلوبة' : 'Ordered Products'}</div>
            <table>
                <thead>
                    <tr>
                        <th>${isAr ? 'الصورة' : 'Img'}</th>
                        <th>${isAr ? 'المنتج' : 'Product'}</th>
                        <th>${isAr ? 'الكمية' : 'Qty'}</th>
                        <th>${isAr ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items?.map((item: any) => `
                    <tr>
                        <td>
                            <img class="product-img" src="${item.product?.images?.[0] || item.productImage?.[0] || ''}" alt="P">
                        </td>
                        <td>
                            <div style="font-weight:bold">${isAr ? item.product?.nameAr : item.product?.nameEn}</div>
                            <div style="font-size:11px; color:#888">${Number(item.price).toFixed(2)} ${t('currency')}</div>
                        </td>
                        <td>${item.quantity}</td>
                        <td style="font-weight:bold">${Number(item.total).toFixed(2)} ${t('currency')}</td>
                    </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="3" style="text-align:${isAr ? 'left' : 'right'}">${isAr ? 'الإجمالي' : 'Grand Total'}</td>
                        <td>${Number(order.total).toFixed(2)} ${t('currency')}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${order.installmentPlan ? `
        <div class="section">
            <div class="section-title">${isAr ? 'خطة التقسيط' : 'Installment Plan'}</div>
            <div class="grid">
                <div class="field">
                    <span class="label">${isAr ? 'الخطة' : 'Plan'}</span>
                    <span class="value">${order.installmentPlan.name}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'المدة' : 'Duration'}</span>
                    <span class="value">${order.installmentPlan.months} ${isAr ? 'شهر' : 'Months'}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'المقدم المدفوع' : 'Amount Paid'}</span>
                    <span class="value">${Number(order.depositAmount).toFixed(2)} ${t('currency')}</span>
                </div>
                <div class="field">
                    <span class="label">${isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
                    <span class="value">${order.depositPaymentMethod || 'N/A'}</span>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            Wolf Techno / Fustan - ${new Date().getFullYear()} &copy;
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

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
                    <p className="font-bold text-slate-600">
                        {language === 'ar' ? "جاري تحميل تفاصيل الطلب..." : "Loading order details..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const STATUS_COLORS: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700",
        preparing_shipment: "bg-fuchsia-100 text-fuchsia-700",
        shipped: "bg-purple-100 text-purple-700",
        delivered: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
        rejected: "bg-red-100 text-red-700",
    };

    const STATUS_LABELS: Record<string, string> = {
        pending: language === 'ar' ? "قيد الانتظار" : "Pending",
        preparing_shipment: language === 'ar' ? "جاري التجهيز للشحن" : "Preparing Shipment",
        shipped: language === 'ar' ? "تم الشحن" : "Shipped",
        delivered: language === 'ar' ? "تم التسليم" : "Delivered",
        cancelled: language === 'ar' ? "ملغى" : "Cancelled",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[1.5rem] md:rounded-[32px] shadow-2xl bg-white border-0 flex flex-col">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full hover:bg-slate-100 print:hidden shrink-0"
                        >
                            <X className="w-6 h-6 text-slate-500" />
                        </Button>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                                {language === 'ar' ? "تفاصيل الطلب" : "Order Details"}
                                <span className="text-base sm:text-lg text-slate-400 font-bold">#{order.orderNumber}</span>
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1">
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded w-fit">
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span>{language === 'ar' ? "تاريخ الطلب:" : "Order Date:"}</span>
                                    {format(new Date(order.createdAt), "dd MMM yyyy, h:mm a", { locale: language === 'ar' ? ar : undefined })}
                                </p>
                                {order.updatedAt && (
                                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded w-fit">
                                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span>{language === 'ar' ? "آخر تحديث:" : "Last Updated:"}</span>
                                        {format(new Date(order.updatedAt), "dd MMM yyyy, h:mm a", { locale: language === 'ar' ? ar : undefined })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <Badge className={cn("px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-black rounded-xl", STATUS_COLORS[order.status] || "bg-slate-100 text-slate-700")}>
                            {STATUS_LABELS[order.status] || order.status}
                        </Badge>
                        <Button onClick={handleDownloadFullOrderData} variant="outline" size="sm" className="sm:h-10 border-emerald-200 text-emerald-600 rounded-xl gap-2 font-bold hover:bg-emerald-50 print:hidden">
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">{language === 'ar' ? "تنزيل البيانات" : "Download Data"}</span>
                        </Button>
                        <Button onClick={handlePrint} variant="outline" size="sm" className="sm:h-10 border-slate-200 text-slate-900 rounded-xl gap-2 font-bold hover:bg-slate-50 print:hidden">
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">{language === 'ar' ? "طباعة الفاتورة" : "Print Invoice"}</span>
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
                    <div className="space-y-6 max-w-5xl mx-auto print:p-0">
                        {/* Customer & Shipping Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="pb-3 border-b border-slate-50">
                                    <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-800">
                                        <User className="w-5 h-5 text-purple-600" />
                                        {language === 'ar' ? "بيانات العميل" : "Customer Info"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-black">
                                            {order.customer?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900">{order.customer?.name || "Guest"}</p>
                                            <p className="text-xs text-slate-400 font-bold">{language === 'ar' ? "عميل مسجل" : "Registered Customer"}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        {order.customer?.email && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                {order.customer.email}
                                            </div>
                                        )}
                                        {order.customer?.phone && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <span dir="ltr">{order.customer.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="pb-3 border-b border-slate-50">
                                    <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-800">
                                        <MapPin className="w-5 h-5 text-pink-600" />
                                        {language === 'ar' ? "عنوان التوصيل" : "Shipping Address"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    {order.shippingAddress ? (
                                        <>
                                            <p className="font-black text-slate-900">{order.shippingAddress.name}</p>
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed">
                                                {order.shippingAddress.address}
                                                <br />
                                                {order.shippingAddress.city}, {order.shippingAddress.country}
                                            </p>
                                            {order.shippingAddress.phone && (
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 pt-2">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    <span dir="ltr">{order.shippingAddress.phone}</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-slate-400 font-bold italic">{language === 'ar' ? "لا يوجد عنوان مسجل" : "No address provided"}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Items */}
                        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="pb-3 border-b border-slate-50">
                                <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-800">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    {language === 'ar' ? "محتويات الطلب" : "Order Items"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "المنتج" : "Product"}</th>
                                                <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "المواصفات" : "Specs"}</th>
                                                <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "الكمية" : "Qty"}</th>
                                                <th className="py-4 px-6 text-left text-xs font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "الإجمالي" : "Total"}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {order.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50/30">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                                {item.product?.images?.[0] && (
                                                                    <img src={item.product.images[0]} alt="product" className="w-full h-full object-cover" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-800 text-sm mb-1">
                                                                    {language === 'ar' ? item.product?.nameAr : item.product?.nameEn}
                                                                </p>
                                                                <p className="text-xs font-bold text-slate-400">
                                                                    {Number(item.price).toFixed(2)} {t('currency')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {item.size ? (
                                                            <Badge variant="outline" className="border-slate-200 font-bold text-slate-600">
                                                                {item.size}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 text-center font-black text-slate-900">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="py-4 px-6 text-left font-black text-slate-900">
                                                        {Number(item.total).toFixed(2)} {t('currency')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50/80 border-t border-slate-100">
                                            <tr>
                                                <td colSpan={3} className="py-4 px-6 text-right font-black text-slate-500">{language === 'ar' ? "المجموع الفرعي" : "Subtotal"}</td>
                                                <td className="py-4 px-6 text-left font-black text-slate-900">{Number(order.subtotal).toFixed(2)} {t('currency')}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="py-4 px-6 text-right font-black text-slate-500">{language === 'ar' ? "الشحن" : "Shipping"}</td>
                                                <td className="py-4 px-6 text-left font-black text-slate-900">{Number(order.shippingCost).toFixed(2)} {t('currency')}</td>
                                            </tr>
                                            {Number(order.discount) > 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-4 px-6 text-right font-black text-red-500">{language === 'ar' ? "الخصم" : "Discount"}</td>
                                                    <td className="py-4 px-6 text-left font-black text-red-500">-{Number(order.discount).toFixed(2)} {t('currency')}</td>
                                                </tr>
                                            )}
                                            <tr className="bg-slate-100/50">
                                                <td colSpan={3} className="py-6 px-6 text-right font-black text-slate-900 text-lg">{language === 'ar' ? "الإجمالي الكلي" : "Grand Total"}</td>
                                                <td className="py-6 px-6 text-left font-black text-pink-600 text-xl">{Number(order.total).toFixed(2)} {t('currency')}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Info */}
                        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="pb-3 border-b border-slate-50">
                                <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-800">
                                    <CreditCard className="w-5 h-5 text-emerald-600" />
                                    {language === 'ar' ? "معلومات الدفع" : "Payment Info"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-6">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? "طريقة الدفع" : "Payment Method"}</span>
                                        <span className="font-black text-slate-900">
                                            {language === 'ar' ? ({
                                                'card': 'بطاقة ائتمان',
                                                'cash': 'دفع عند الاستلام',
                                                'installments': 'تقسيط Fustan',
                                                'wallet': 'المحفظة الإلكترونية',
                                                'gift_card': 'بطاقة هدية',
                                            } as any)[order.paymentMethod] || order.paymentMethod : ({
                                                'card': 'Credit Card',
                                                'cash': 'Cash on Delivery',
                                                'installments': 'Fustan Installments',
                                                'wallet': 'Wallet',
                                                'gift_card': 'Gift Card',
                                            } as any)[order.paymentMethod] || order.paymentMethod}
                                        </span>
                                    </div>
                                    {/* Installment plan info if applicable */}
                                    {order.paymentMethod === 'installments' && order.installmentPlan && (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? "خطة التقسيط" : "Installment Plan"}</span>
                                            <span className="font-black text-slate-900 text-sm">
                                                {language === 'ar' ? order.installmentPlan.name : order.installmentPlan.name} — {order.installmentPlan.months} {language === 'ar' ? 'شهر' : 'months'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? "حالة الدفع" : "Payment Status"}</span>
                                        <Badge className={cn(
                                            "capitalize font-bold",
                                            order.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                                                order.paymentStatus === 'pending_kyc_review' ? "bg-amber-100 text-amber-700" :
                                                    order.paymentStatus === 'failed' || order.paymentStatus === 'rejected' ? "bg-red-100 text-red-700" :
                                                        order.paymentStatus === 'refunded' ? "bg-blue-100 text-blue-700" :
                                                            "bg-slate-100 text-slate-700"
                                        )}>
                                            {language === 'ar' ? ({
                                                'pending': 'قيد الانتظار',
                                                'paid': 'تم الدفع',
                                                'pending_kyc_review': 'مراجعة الأوراق',
                                                'failed': 'فشل الدفع',
                                                'rejected': 'مرفوض',
                                                'refunded': 'مُستردّ',
                                                'on_delivery': 'يُدفع عند الاستلام',
                                            } as any)[order.paymentStatus] || order.paymentStatus : ({
                                                'pending': 'Pending',
                                                'paid': 'Paid',
                                                'pending_kyc_review': 'KYC Under Review',
                                                'failed': 'Failed',
                                                'rejected': 'Rejected',
                                                'refunded': 'Refunded',
                                                'on_delivery': 'Pay on Delivery',
                                            } as any)[order.paymentStatus] || order.paymentStatus}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Deposit Information */}
                                {Number(order.depositAmount) > 0 && (
                                    <div className="pt-4 border-t border-slate-50">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? "طريقة دفع المقدم" : "Deposit Method"}</span>
                                                <span className="font-black text-slate-900">
                                                    {({
                                                        'card': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                                                        'wallet': language === 'ar' ? 'المحفظة' : 'Wallet',
                                                        'gift_card': language === 'ar' ? 'كارت هدية' : 'Gift Card',
                                                        'stripe': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                                                    } as any)[order.depositPaymentMethod] || order.depositPaymentMethod}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? "مبلغ المقدم" : "Deposit Amount"}</span>
                                                <span className="font-black text-emerald-600 text-lg">
                                                    {Number(order.depositAmount).toFixed(2)} {t('currency')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* KYC Documents */}
                                {order.kycData && (
                                    <div className="pt-4 border-t border-slate-50">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">{language === 'ar' ? "مستندات العميل (KYC)" : "Customer Documents (KYC)"}</span>
                                        <div className="grid grid-cols-3 gap-3">
                                            {order.kycData.faceId && (
                                                <a href={order.kycData.faceId} target="_blank" rel="noopener noreferrer" className="block p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">{language === 'ar' ? "صورة الوجه" : "Face ID"}</span>
                                                    <span className="text-[10px] font-black text-pink-600">{language === 'ar' ? "عرض" : "View"}</span>
                                                </a>
                                            )}
                                            {order.kycData.residencyDoc && (
                                                <a href={order.kycData.residencyDoc} target="_blank" rel="noopener noreferrer" className="block p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">{language === 'ar' ? "إثبات سكن" : "Residency"}</span>
                                                    <span className="text-[10px] font-black text-pink-600">{language === 'ar' ? "عرض" : "View"}</span>
                                                </a>
                                            )}
                                            {order.passportDoc && (
                                                <a href={order.passportDoc} target="_blank" rel="noopener noreferrer" className="block p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-center">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">{language === 'ar' ? "الجواز/الهوية" : "Passport/ID"}</span>
                                                    <span className="text-[10px] font-black text-pink-600">{language === 'ar' ? "عرض" : "View"}</span>
                                                </a>
                                            )}
                                        </div>

                                        {/* Manual KYC Data */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                            {order.kycData.idNumber && (
                                                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{language === 'ar' ? "رقم الهوية" : "ID Number"}</span>
                                                    <span className="text-xs font-black text-slate-900">{order.kycData.idNumber}</span>
                                                </div>
                                            )}
                                            {order.kycData.passportNumber && (
                                                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{language === 'ar' ? "رقم الجواز" : "Passport Number"}</span>
                                                    <span className="text-xs font-black text-slate-900">{order.kycData.passportNumber}</span>
                                                </div>
                                            )}
                                            {order.kycData.dob && (
                                                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{language === 'ar' ? "تاريخ الميلاد" : "Date of Birth"}</span>
                                                    <span className="text-xs font-black text-slate-900">{order.kycData.dob}</span>
                                                </div>
                                            )}
                                            {order.kycData.residentialAddress && (
                                                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 sm:col-span-2">
                                                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{language === 'ar' ? "عنوان السكن" : "Residential Address"}</span>
                                                    <span className="text-xs font-black text-slate-900">{order.kycData.residentialAddress}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>

                {/* Print Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .fixed {
                            position: static;
                            background: white;
                            padding: 0;
                        }
                        .fixed * {
                            visibility: visible;
                        }
                        button {
                            display: none !important;
                        }
                        /* Hide scrollbars */
                        ::-webkit-scrollbar {
                            display: none;
                        }
                        /* Ensure full width */
                        .max-w-4xl {
                            max-width: 100% !important;
                            box-shadow: none !important;
                            border: none !important;
                        }
                        .max-h-[90vh] {
                            max-height: none !important;
                        }
                    }
                `}} />
            </Card>
        </div>
    );
}
