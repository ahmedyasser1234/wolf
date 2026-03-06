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
        <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'text-right' : 'text-left'} pb-20 overflow-x-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* ... header ... */}

            <div className="container mx-auto px-4 py-6 sm:py-8 grid lg:grid-cols-3 gap-6 sm:gap-8">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Tracker */}
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="bg-white border-b border-gray-50 py-6">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Clock className="w-6 h-6 text-primary" />
                                {language === 'ar' ? 'تتبع مسار الطلب' : 'Order Tracking'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 sm:p-12">
                            {isCancelled ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                                        <XCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-black text-red-600 mb-2">{language === 'ar' ? 'تم إلغاء الطلب' : 'Order Cancelled'}</h3>
                                    <p className="text-gray-500 font-bold">{language === 'ar' ? 'عذراً، هذا الطلب ملغى ولا يمكن تتبعه.' : 'Sorry, this order is cancelled and cannot be tracked.'}</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Progress Line */}
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 hidden md:block">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-in-out"
                                            style={{ width: `${Math.max(0, (currentStatus.step - 1) / 3 * 100)}%` }}
                                        />
                                    </div>

                                    {/* Vertical line for mobile */}
                                    <div className="absolute top-0 right-6 w-1 h-full bg-gray-100 md:hidden">
                                        <div
                                            className="w-full bg-primary transition-all duration-1000 ease-in-out"
                                            style={{ height: `${Math.max(0, (currentStatus.step - 1) / 3 * 100)}%` }}
                                        />
                                    </div>

                                    <div className="relative flex flex-col md:flex-row justify-between items-end md:items-center gap-12 md:gap-4">
                                        {Object.entries(ORDER_STATUSES)
                                            .filter(([key]) => key !== 'cancelled')
                                            .sort((a, b) => a[1].step - b[1].step)
                                            .map(([key, status], index) => {
                                                const isActive = currentStatus.step >= status.step;
                                                const isCurrent = currentStatus.step === status.step;
                                                const Icon = status.icon;

                                                return (
                                                    <div key={key} className="flex md:flex-col items-center gap-6 md:gap-4 group relative w-full md:w-auto">
                                                        <div className={`
                                                            w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 z-10
                                                            ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-110' : 'bg-white text-gray-300 border-2 border-gray-100'}
                                                            ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}
                                                        `}>
                                                            <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                                                        </div>
                                                        <div className={`flex flex-col md:items-center ${language === 'ar' ? 'text-right md:text-center' : 'text-left md:text-center'} flex-1 md:flex-none`}>
                                                            <span className={`text-sm sm:text-base font-black transition-colors duration-500 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                                {language === 'ar' ? status.labelAr : status.labelEn}
                                                            </span>
                                                            {isCurrent && (
                                                                <span className="text-[10px] sm:text-xs text-primary font-bold animate-bounce mt-1">
                                                                    {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="bg-white border-b border-gray-50 py-6">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <ShoppingBag className="w-6 h-6 text-primary" />
                                {language === 'ar' ? 'المنتجات المطلوبة' : 'Order Items'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-6 sm:p-8 flex items-center gap-6 hover:bg-gray-50 transition-colors group">
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
                                            <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-1 truncate">
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
                    <Card className="border-0 shadow-sm" ref={invoiceRef}>
                        <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base sm:text-lg">{language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}</CardTitle>
                            {user?.role === 'admin' && order.kycData && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const kyc = order.kycData;
                                        const content = `
KYC DATA EXPORT - ORDER #${order.orderNumber}
-------------------------------------------
CUSTOMER INFORMATION:
Name: ${order.customer?.name || 'N/A'}
Email: ${order.customer?.email || 'N/A'}
Phone: ${order.customer?.phone || 'N/A'}

ORDER INFORMATION:
Order ID: ${order.id}
Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleString()}

VERIFICATION DATA (KYC):
ID Number: ${kyc.idNumber || 'N/A'}
Passport Number: ${kyc.passportNumber || 'N/A'}
Date of Birth: ${kyc.dob || 'N/A'}
Residential Address: ${kyc.residentialAddress || 'N/A'}

DOCUMENTS (CLICK TO VIEW):
Face ID Image: ${kyc.faceIdImage || 'N/A'}
ID Card Image: ${kyc.residencyImage || 'N/A'}
Passport Image: ${kyc.passportImage || 'N/A'}

-------------------------------------------
Generated at: ${new Date().toLocaleString()}
                                        `.trim();

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
                                    className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 font-bold gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-xs">{language === 'ar' ? 'تحميل بيانات التحقق' : 'Download KYC'}</span>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span className="font-bold">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                <span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                                <span className="font-bold">{formatPrice(order.shippingCost)}</span>
                            </div>
                            {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-primary bg-primary/5 p-2 rounded-lg text-sm sm:text-base">
                                    <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                                    <span className="font-bold">- {formatPrice(order.discount)}</span>
                                </div>
                            )}
                            {Number(order.tax) > 0 && (
                                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                    <span>{language === 'ar' ? 'الضريبة (15%)' : 'Tax (15%)'}</span>
                                    <span className="font-bold">{formatPrice(order.tax)}</span>
                                </div>
                            )}
                            {Number(order.walletAmountUsed) > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg mt-2 text-sm sm:text-base">
                                    <span>{language === 'ar' ? 'تم الدفع عبر المحفظة' : 'Paid via Wallet'}</span>
                                    <span>{formatPrice(order.walletAmountUsed)}</span>
                                </div>
                            )}
                            <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-base sm:text-lg text-gray-900">{language === 'ar' ? 'الإجمالي النهائي' : 'Final Total'}</span>
                                    <span className="font-black text-lg sm:text-xl text-primary">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                {language === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xs sm:text-sm text-gray-600 space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <p className="font-bold text-gray-900">{order.shippingAddress?.name}</p>
                                <p>{order.shippingAddress?.address}</p>
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
                                <p className="font-mono">{order.shippingAddress?.phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg">
                                {order.paymentMethod === 'cod' ? (
                                    <span className="text-xs sm:text-sm font-bold text-gray-900">{language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
                                ) : order.paymentMethod === 'installments' ? (
                                    <>
                                        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                        <span className="text-xs sm:text-sm font-bold text-gray-900">{language === 'ar' ? 'نظام التقسيط' : 'Installment System'}</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900" />
                                        <span className="text-xs sm:text-sm font-bold text-gray-900">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</span>
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
