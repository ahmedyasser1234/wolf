import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Package, Clock, CheckCircle, Truck, ArrowRight, MapPin, CreditCard, ShoppingBag, Download, AlertCircle, UserCheck, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { downloadInvoice } from "@/lib/downloadInvoice";

const ORDER_STATUSES: Record<string, { labelAr: string; labelEn: string; icon: any; color: string; step: number }> = {
    pending: { labelAr: "قيد الانتظار", labelEn: "Pending", icon: Clock, color: "orange", step: 1 },
    preparing_shipment: { labelAr: "جاري التجهيز للشحن", labelEn: "Preparing Shipment", icon: Package, color: "fuchsia", step: 2 },
    shipped: { labelAr: "في الطريق", labelEn: "Shipped", icon: Truck, color: "purple", step: 3 },
    delivered: { labelAr: "مكتمل", labelEn: "Delivered", icon: CheckCircle, color: "green", step: 4 },
    cancelled: { labelAr: "ملغى", labelEn: "Cancelled", icon: XCircle, color: "red", step: -1 },
};

export default function OrderDetails() {
    const { id } = useParams();
    const { t, language, formatPrice } = useLanguage();
    const queryClient = useQueryClient();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: async () => await endpoints.orders.get(Number(id)),
        enabled: !!id,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => await endpoints.orders.updateStatus(Number(id), status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            toast.success(language === 'ar' ? "تم تحديث حالة الطلب بنجاح" : "Order status updated successfully");
        },
        onError: () => toast.error(language === 'ar' ? "حدث خطأ أثناء تحديث الحالة" : "An error occurred while updating status"),
    });

    const handlePrintInvoice = () => {
        const printContent = invoiceRef.current;
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore event listeners
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">{language === 'ar' ? "جاري تحميل تفاصيل الطلب..." : "Loading order details..."}</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold mb-4">{language === 'ar' ? "الطلب غير موجود" : "Order not found"}</p>
                    <Link href="/orders">
                        <Button variant="outline">{language === 'ar' ? "العودة للطلبات" : "Back to Orders"}</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const statusKey = (order.status || '').toLowerCase();
    const currentStatus = ORDER_STATUSES[statusKey] || ORDER_STATUSES.pending;
    const isCancelled = order.status === 'cancelled';

    return (
        <div className={`min-h-screen bg-black ${language === 'ar' ? 'text-right' : 'text-left'} pb-20 max-w-full overflow-x-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* ... header ... */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid lg:grid-cols-3 gap-6 sm:gap-8 w-full overflow-hidden">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Order Tracker */}
                    <Card className="border-0 shadow-2xl overflow-hidden bg-gray-950 w-full mx-auto ring-1 ring-gray-900 rounded-3xl">
                        <CardHeader className="border-b border-gray-900 py-6 px-5 sm:px-8 bg-black/40">
                            <CardTitle className="text-xl sm:text-2xl font-black flex items-center gap-4 text-white uppercase tracking-tight">
                                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                                <span className="truncate">{language === 'ar' ? 'تتبع مسار الطلب' : 'Order Tracking'}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 sm:p-10 md:p-14 overflow-hidden">
                            {isCancelled ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                                    <h3 className="text-xl font-black text-white">{language === 'ar' ? 'تم إلغاء الطلب' : 'Order Cancelled'}</h3>
                                    <p className="text-gray-400 mt-2">{language === 'ar' ? 'نعتذر، ولكن تم إلغاء هذا الطلب.' : 'We apologize, but this order has been cancelled.'}</p>
                                </div>
                            ) : (
                                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-4 w-full">
                                    {/* Vertical/Horizontal Connector Line */}
                                    <div className={`absolute ${language === 'ar' ? 'right-[24px] md:right-auto md:left-0' : 'left-[24px] md:left-0'} top-[40px] md:top-1/2 md:-translate-y-1/2 w-[2px] md:w-full h-[calc(100%-80px)] md:h-[2px] bg-gray-800/60 z-0`} />
                                    
                                    {Object.entries(ORDER_STATUSES)
                                        .filter(([key]) => key !== 'cancelled')
                                        .sort((a, b) => a[1].step - b[1].step)
                                        .map(([key, status]) => {
                                            const isActive = currentStatus.step >= status.step;
                                            const isCurrent = currentStatus.step === status.step;
                                            const Icon = status.icon;

                                            return (
                                                <div key={key} className="flex md:flex-col items-center gap-8 md:gap-6 group relative z-10 w-full md:w-auto">
                                                    <div className={`
                                                                    w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-700
                                                                    ${isActive ? 'bg-primary text-black shadow-2xl shadow-primary/30 scale-110' : 'bg-gray-900 text-gray-600 border-2 border-gray-800'}
                                                                    ${isCurrent ? 'ring-8 ring-primary/10 animate-pulse' : ''}
                                                                `}>
                                                        <Icon className="w-6 h-6 sm:w-10 sm:h-10" />
                                                    </div>
                                                    <div className={`flex flex-col md:items-center ${language === 'ar' ? 'text-right md:text-center' : 'text-left md:text-center'} min-w-0 flex-1 md:flex-none`}>
                                                        <span className={`text-base sm:text-lg font-black transition-colors duration-500 tracking-tight ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                                            {language === 'ar' ? status.labelAr : status.labelEn}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="text-[10px] sm:text-xs text-primary font-bold animate-pulse mt-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 inline-block">
                                                                {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="border-0 shadow-2xl overflow-hidden bg-gray-950 w-full mx-auto ring-1 ring-gray-900 rounded-3xl">
                        <CardHeader className="border-b border-gray-900 py-6 px-5 sm:px-8 bg-black/40">
                            <CardTitle className="text-xl sm:text-2xl font-black flex items-center gap-4 text-white">
                                <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                                {language === 'ar' ? 'المنتجات المطلوبة' : 'Order Items'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-900">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-6 sm:p-8 flex items-center gap-6 hover:bg-white/5 transition-colors group">
                                        <div className="relative shrink-0">
                                            <img
                                                src={(item.product?.images && item.product.images[0]) || (item.product?.image) || "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=200&h=200&fit=crop"}
                                                alt={language === 'ar' ? item.product?.nameAr : item.product?.nameEn}
                                                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-black ring-4 ring-white shadow-lg">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div className="grow min-w-0">
                                            <h4 className="text-lg sm:text-xl font-black text-white mb-1 truncate">
                                                {language === 'ar' ? item.product?.nameAr : item.product?.nameEn}
                                            </h4>
                                            <p className="text-sm text-gray-400 font-bold mb-3">
                                                {language === 'ar' ? item.vendor?.storeNameAr : item.vendor?.storeNameEn}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.size && (
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold border border-gray-200 uppercase">
                                                        {language === 'ar' ? 'المقاس:' : 'Size:'} {item.size}
                                                    </span>
                                                )}
                                                {item.color && (
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold border border-gray-200">
                                                        {language === 'ar' ? 'اللون:' : 'Color:'} {item.color}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-lg sm:text-2xl font-black text-primary">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-gray-400 font-bold">
                                                {formatPrice(item.price)} × {item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">

                    {/* Invoice Summary */}
                    <Card className="border-0 shadow-2xl bg-gray-950 ring-1 ring-gray-900" ref={invoiceRef}>
                        <CardHeader className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900">
                            <CardTitle className="text-base sm:text-lg text-white">{language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                                {user?.role === 'admin' && order.kycData && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            // ... KYC logic ...
                                            const kyc = order.kycData;
                                            const content = `
KYC DATA EXPORT - ORDER #${order.orderNumber}
-------------------------------------------
...
`.trim();
                                            // ... rest of KYC logic ...
                                            const blob = new Blob([content], { type: 'text/plain' });
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', `KYC_Order_${order.orderNumber}.txt`);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                            toast.success(language === 'ar' ? "تم تحميل بيانات التحقق بنجاح" : "KYC data downloaded successfully");
                                        }}
                                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 font-bold gap-2 flex-1 sm:flex-none"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="text-xs">{language === 'ar' ? 'تحميل التحقق' : 'Download KYC'}</span>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadInvoice(order, language, t)}
                                    className="h-8 px-3 text-foreground border-gray-300 dark:border-gray-700 hover:bg-white/10 dark:hover:bg-gray-800 font-bold gap-2 flex-1 sm:flex-none"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-xs">{language === 'ar' ? 'الفاتورة' : 'Invoice'}</span>
                                </Button>
                                {order.status !== 'cancelled' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (window.confirm(language === 'ar' ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')) {
                                                updateStatusMutation.mutate('cancelled');
                                            }
                                        }}
                                        disabled={updateStatusMutation.isPending}
                                        className="h-8 px-3 font-bold gap-2 flex-1 sm:flex-none"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-xs">{language === 'ar' ? 'إلغاء' : 'Cancel'}</span>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between text-gray-400 text-sm sm:text-base">
                                <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span className="font-bold text-white">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm sm:text-base">
                                <span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                                <span className="font-bold text-white">{formatPrice(order.shippingCost)}</span>
                            </div>
                            {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-primary bg-primary/10 p-2 rounded-lg text-sm sm:text-base">
                                    <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                                    <span className="font-bold">- {formatPrice(order.discount)}</span>
                                </div>
                            )}
                            {Number(order.tax) > 0 && (
                                <div className="flex justify-between text-gray-400 text-sm sm:text-base">
                                    <span>{language === 'ar' ? 'الضريبة (15%)' : 'Tax (15%)'}</span>
                                    <span className="font-bold text-white">{formatPrice(order.tax)}</span>
                                </div>
                            )}
                            {Number(order.walletAmountUsed) > 0 && (
                                <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg mt-2 text-sm sm:text-base">
                                    <span>{language === 'ar' ? 'تم الدفع عبر المحفظة' : 'Paid via Wallet'}</span>
                                    <span>{formatPrice(order.walletAmountUsed)}</span>
                                </div>
                            )}
                            <div className="border-t border-dashed border-gray-800 my-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-base sm:text-lg text-white">{language === 'ar' ? 'الإجمالي النهائي' : 'Final Total'}</span>
                                    <span className="font-black text-lg sm:text-xl text-primary">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="border-0 shadow-2xl bg-gray-950 ring-1 ring-gray-900">
                        <CardHeader className="py-4 border-b border-gray-900">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                {language === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className={`text-xs sm:text-sm text-gray-400 space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <p className="font-bold text-white">{order.shippingAddress?.name}</p>
                                <p>{order.shippingAddress?.address}</p>
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
                                <p className="font-mono text-white">{order.shippingAddress?.phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="border-0 shadow-2xl bg-gray-950 ring-1 ring-gray-900">
                        <CardHeader className="py-4 border-b border-gray-900">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-white">
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 bg-white/5 p-2 sm:p-3 rounded-lg">
                                {order.paymentMethod === 'cod' ? (
                                    <span className="text-xs sm:text-sm font-bold text-white">{language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
                                ) : order.paymentMethod === 'installments' ? (
                                    <>
                                        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                        <span className="text-xs sm:text-sm font-bold text-white">{language === 'ar' ? 'نظام التقسيط' : 'Installment System'}</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                        <span className="text-xs sm:text-sm font-bold text-white">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</span>
                                    </>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{language === 'ar' ? 'تاريخ الطلب:' : 'Order Date:'}</span>
                                    </div>
                                    <span className="font-bold">{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium' })}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] sm:text-xs text-gray-500 font-bold">{language === 'ar' ? 'حالة الدفع:' : 'Payment:'}</span>
                                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {order.paymentStatus === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') : (language === 'ar' ? 'قيد الانتظار' : 'Pending')}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
