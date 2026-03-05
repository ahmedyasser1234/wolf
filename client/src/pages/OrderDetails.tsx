import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Package, Clock, CheckCircle, Truck, ArrowRight, MapPin, CreditCard, ShoppingBag, Download, AlertCircle, UserCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const ORDER_STATUSES: Record<string, { labelAr: string; labelEn: string; icon: any; color: string; step: number }> = {
    pending: { labelAr: "قيد الانتظار", labelEn: "Pending", icon: Clock, color: "yellow", step: 1 },
    confirmed: { labelAr: "تم التأكيد", labelEn: "Confirmed", icon: CheckCircle, color: "blue", step: 2 },
    shipped: { labelAr: "تم الشحن", labelEn: "Shipped", icon: Truck, color: "purple", step: 3 },
    delivered: { labelAr: "تم التسليم", labelEn: "Delivered", icon: CheckCircle, color: "green", step: 4 },
    cancelled: { labelAr: "ملغى", labelEn: "Cancelled", icon: AlertCircle, color: "red", step: 0 },
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
        <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'text-right' : 'text-left'} pb-20`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/orders">
                                <Button variant="ghost" size="icon">
                                    <ArrowRight className={`w-5 h-5 ${language === 'ar' ? '' : 'rotate-180'}`} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{language === 'ar' ? 'طلب' : 'Order'} #{order.orderNumber}</h1>
                                <p className="text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100" onClick={handlePrintInvoice}>
                                <Download className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                {language === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
                            </Button>
                            {order.status === 'shipped' && user?.role === 'customer' && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 animate-pulse"
                                    onClick={() => updateStatusMutation.mutate('delivered')}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    <CheckCircle className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                    {language === 'ar' ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Status Tracker */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8">
                            {isCancelled ? (
                                <div className="flex items-center justify-center text-red-600 gap-2 p-4 bg-red-50 rounded-xl">
                                    <AlertCircle className="w-6 h-6" />
                                    <span className="font-bold text-lg">هذا الطلب ملغى</span>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {order.status === 'shipped' && (
                                        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                                            <div className="bg-blue-500 text-white p-2 rounded-full shrink-0">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div className="text-right">
                                                <h4 className="font-bold text-blue-900 mb-1">
                                                    {language === 'ar' ? "تأكيد جودة منتجك" : "Confirm Your Product Quality"}
                                                </h4>
                                                <p className="text-sm text-blue-700 leading-relaxed">
                                                    {user?.role === 'customer'
                                                        ? (language === 'ar'
                                                            ? "بمجرد استلامك للمنتج والتأكد من جودته، يرجى الضغط على زر 'تأكيد الاستلام' لإخفاء الطلب من قائمة الشحن وتحويل المستحقات للتاجر."
                                                            : "Once you receive the product and verify its quality, please click 'Confirm Delivery' to complete the order and release funds to the vendor.")
                                                        : (language === 'ar'
                                                            ? "الطلب الآن بانتظار تأكيد الاستلام من قبل العميل. لا يمكن للتاجر تغيير الحالة إلى 'تم التسليم' لضمان حقوق العميل."
                                                            : "The order is awaiting delivery confirmation from the customer. Vendors cannot change the status to 'Delivered' to ensure customer rights.")
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="relative pt-8 pb-4">
                                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />
                                        <div
                                            className="absolute top-1/2 right-0 h-1.5 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                            style={{ width: `${((currentStatus.step - 1) / 3) * 100}%` }}
                                        />
                                        <div className="relative z-10 flex justify-between">
                                            {['pending', 'confirmed', 'shipped', 'delivered'].map((statusKey) => {
                                                const s = ORDER_STATUSES[statusKey];
                                                const isCompleted = s.step <= currentStatus.step;
                                                const isCurrent = s.step === currentStatus.step;

                                                return (
                                                    <div key={statusKey} className="flex flex-col items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isCompleted ? 'bg-green-500 border-green-100 text-white scale-110 shadow-lg shadow-green-100' : 'bg-white border-gray-200 text-gray-400'
                                                            }`}>
                                                            <s.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-sm font-bold transition-colors ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {language === 'ar' ? s.labelAr : s.labelEn}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items List */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 -primary" />
                                {language === 'ar' ? 'المنتجات' : 'Products'} ({order.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-gray-100">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="py-4 flex gap-4">
                                    <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <img
                                            src={item.productImage?.[0] || '/placeholder.png'}
                                            alt={language === 'ar' ? item.productNameAr : item.productNameEn}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-1">
                                                    {language === 'ar' ? item.productNameAr : item.productNameEn}
                                                </h3>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    {language === 'ar' ? item.storeNameAr : item.storeNameEn}
                                                </p>
                                                {item.size && (
                                                    <div className="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                                                        {language === 'ar' ? 'المقاس' : 'Size'}: {item.size}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`${language === 'ar' ? 'text-left' : 'text-right'}`}>
                                                <p className="font-bold text-gray-900">
                                                    {formatPrice(item.price)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {language === 'ar' ? 'الكمية' : 'Quantity'}: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`mt-2 flex ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                                            <span className="font-black -primary">
                                                {language === 'ar' ? 'الإجمالي' : 'Total'}: {formatPrice(item.total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">

                    {/* Invoice Summary */}
                    <Card className="border-0 shadow-sm" ref={invoiceRef}>
                        {/* Invoice Header for Print only - Hidden by default css but here assumes simple print */}
                        <div className="hidden print:block mb-8 text-center border-b pb-4">
                            <h2 className="text-2xl font-bold">{language === 'ar' ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}</h2>
                            <p>{language === 'ar' ? 'رقم الطلب' : 'Order Number'}: {order.orderNumber}</p>
                        </div>

                        <CardHeader>
                            <CardTitle>{language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-gray-600">
                                <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                                <span>{formatPrice(order.shippingCost)}</span>
                            </div>
                            {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-primary bg-primary/10 p-2 rounded-lg">
                                    <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                                    <span>- {formatPrice(order.discount)}</span>
                                </div>
                            )}
                            {Number(order.tax) > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>{language === 'ar' ? 'الضريبة (15%)' : 'Tax (15%)'}</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                            )}
                            {Number(order.walletAmountUsed) > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg mt-2">
                                    <span>{language === 'ar' ? 'تم الدفع عبر المحفظة' : 'Paid via Wallet'}</span>
                                    <span>{formatPrice(order.walletAmountUsed)}</span>
                                </div>
                            )}
                            <div className="border-t border-dashed border-gray-200 my-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg text-gray-900">{language === 'ar' ? 'الإجمالي النهائي' : 'Final Total'}</span>
                                    <span className="font-black text-xl -primary">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                {language === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-sm text-gray-600 space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <p className="font-bold text-gray-900">{order.shippingAddress?.name}</p>
                                <p>{order.shippingAddress?.address}</p>
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
                                <p>{order.shippingAddress?.phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                {order.paymentMethod === 'cod' ? (
                                    <>
                                        <span className="text-sm font-bold">{language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
                                    </>
                                ) : order.paymentMethod === 'installments' ? (
                                    <>
                                        <UserCheck className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-bold">{language === 'ar' ? 'نظام التقسيط' : 'Installment System'}</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        <span className="text-sm font-bold">{language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'} ({order.paymentMethod})</span>
                                    </>
                                )}
                            </div>
                            {order.paymentMethod === 'installments' && order.installmentPlanId && (
                                <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-xs font-bold text-primary uppercase mb-2">{language === 'ar' ? 'تفاصيل التقسيط' : 'Installment Details'}</p>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">{language === 'ar' ? 'رقم الخطة:' : 'Plan ID:'} #{order.installmentPlanId}</p>
                                        <p className="text-xs text-gray-500">{language === 'ar' ? 'تم اختيار التقسيط عند الطلب وسيتم مراجعة المستندات.' : 'Installment plan selected. Documents are under review.'}</p>
                                    </div>
                                </div>
                            )}
                            <div className={`mt-2 text-xs font-bold px-2 py-1 rounded inline-block ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {order.paymentStatus === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') : (language === 'ar' ? 'غير مدفوع' : 'Unpaid')}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-bold">{language === 'ar' ? 'تاريخ الطلب:' : 'Order Date:'}</span>
                                    <span>{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {order.updatedAt && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-bold">{language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'}</span>
                                        <span>{new Date(order.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
