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
                    {/* ... tracker and items ... */}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">

                    {/* Invoice Summary */}
                    <Card className="border-0 shadow-sm" ref={invoiceRef}>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base sm:text-lg">{language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}</CardTitle>
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
