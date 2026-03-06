import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Package, ShoppingCart, Eye, CheckCircle, XCircle, FileText, ScanFace, CreditCard, Search, Filter, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import OrderDetailsView from "./OrderDetailsView";

interface OrdersTabProps {
    vendorId: number;
    onCustomerClick: (customer: any) => void;
}

export default function OrdersTab({ vendorId, onCustomerClick }: OrdersTabProps) {
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [kycModalOrder, setKycModalOrder] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data: ordersData, isLoading, isFetching } = useQuery({
        queryKey: ['admin', 'orders', page, searchQuery, dateFrom, dateTo, filterStatus],
        queryFn: async () => {
            const response = await api.get('/admin/orders', {
                params: {
                    page,
                    limit: 10,
                    search: searchQuery,
                    dateFrom,
                    dateTo,
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    isInstallmentOnly: false
                }
            });
            return response.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
            return (await api.patch(`/orders/${orderId}/status`, { status })).data;
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم تحديث حالة الطلب" : "Order status updated");
            queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
        },
        onError: () => {
            toast.error(language === 'ar' ? "فشل تحديث الحالة" : "Failed to update status");
        }
    });

    const kycReviewMutation = useMutation({
        mutationFn: async ({ orderId, action, reason }: { orderId: number; action: 'approve' | 'reject'; reason?: string }) => {
            return (await api.post(`/orders/${orderId}/kyc-review`, { action, reason })).data;
        },
        onSuccess: (_, vars) => {
            toast.success(vars.action === 'approve'
                ? (language === 'ar' ? 'تمت الموافقة على الطلب' : 'Request approved')
                : (language === 'ar' ? 'تم رفض الطلب' : 'Request rejected'));
            setKycModalOrder(null);
            setRejectReason('');
            queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
        },
        onError: () => toast.error(language === 'ar' ? 'فشلت العملية' : 'Operation failed'),
    });

    const handleDownloadFullOrderData = (order: any) => {
        const customerName = order.customer?.name || order.shippingAddress?.name || 'Guest';
        const customerPhone = order.customer?.phone || order.shippingAddress?.phone || 'N/A';
        const customerEmail = order.customer?.email || 'N/A';

        let content = `========================================\n`;
        content += `${language === 'ar' ? 'بيانات الطلب رقم' : 'Order Details #'}: ${order.orderNumber}\n`;
        content += `========================================\n\n`;

        content += `${language === 'ar' ? 'بيانات العميل' : 'Customer Info'}:\n`;
        content += `-----------------\n`;
        content += `${language === 'ar' ? 'الاسم' : 'Name'}: ${customerName}\n`;
        content += `${language === 'ar' ? 'الهاتف' : 'Phone'}: ${customerPhone}\n`;
        content += `${language === 'ar' ? 'البريد' : 'Email'}: ${customerEmail}\n\n`;

        if (order.kycData) {
            content += `${language === 'ar' ? 'بيانات التحقق (KYC)' : 'Verification (KYC)'}:\n`;
            content += `-----------------\n`;
            content += `${language === 'ar' ? 'رقم الهوية' : 'ID Number'}: ${order.kycData.idNumber || 'N/A'}\n`;
            content += `${language === 'ar' ? 'رقم الباسبور' : 'Passport Number'}: ${order.kycData.passportNumber || 'N/A'}\n`;
            content += `${language === 'ar' ? 'تاريخ الميلاد' : 'DOB'}: ${order.kycData.dob || 'N/A'}\n`;
            content += `${language === 'ar' ? 'عنوان السكن' : 'Address'}: ${order.kycData.residentialAddress || 'N/A'}\n\n`;

            content += `${language === 'ar' ? 'روابط المستندات' : 'Document Links'}:\n`;
            if (order.kycData.faceId || order.kycData.faceImage) {
                content += `- ${language === 'ar' ? 'صورة الوجه' : 'Face Image'}: ${order.kycData.faceId || order.kycData.faceImage}\n`;
            }
            if (order.kycData.residencyDoc || order.kycData.idImage) {
                content += `- ${language === 'ar' ? 'صورة الهوية' : 'ID Image'}: ${order.kycData.residencyDoc || order.kycData.idImage}\n`;
            }
            if (order.kycData.passportDoc || order.kycData.passportImage) {
                content += `- ${language === 'ar' ? 'صورة الباسبور' : 'Passport Image'}: ${order.kycData.passportDoc || order.kycData.passportImage}\n`;
            }
            content += `\n`;
        }

        if (order.installmentPlan) {
            content += `${language === 'ar' ? 'خطة التقسيط' : 'Installment Plan'}:\n`;
            content += `-----------------\n`;
            content += `${language === 'ar' ? 'الخطة' : 'Plan'}: ${order.installmentPlan.name}\n`;
            content += `${language === 'ar' ? 'المدة' : 'Duration'}: ${order.installmentPlan.months} ${language === 'ar' ? 'شهر' : 'Months'}\n`;
            content += `${language === 'ar' ? 'نسبة المقدم' : 'Downpayment %'}: ${order.installmentPlan.downPaymentPercentage}%\n`;
            if (order.depositAmount) {
                content += `${language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}: ${Number(order.depositAmount).toFixed(2)} ${t('currency')}\n`;
            }
            content += `\n`;
        }

        content += `${language === 'ar' ? 'المنتجات المطلوبة' : 'Products Ordered'}:\n`;
        content += `-----------------\n`;
        order.items?.forEach((item: any, idx: number) => {
            content += `${idx + 1}. ${language === 'ar' ? item.product?.nameAr : item.product?.nameEn}\n`;
            content += `   ${language === 'ar' ? 'الكمية' : 'Qty'}: ${item.quantity}\n`;
            content += `   ${language === 'ar' ? 'السعر' : 'Price'}: ${Number(item.price).toFixed(2)} ${t('currency')}\n`;
            const img = item.product?.images?.[0] || item.productImage?.[0];
            if (img) content += `   ${language === 'ar' ? 'رابط الصورة' : 'Image Link'}: ${img}\n`;
            content += `\n`;
        });

        content += `-----------------\n`;
        content += `${language === 'ar' ? 'الإجمالي' : 'Total'}: ${Number(order.total).toFixed(2)} ${t('currency')}\n`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `order_${order.orderNumber}_data.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(language === 'ar' ? "تم تنزيل بيانات الطلب" : "Order data downloaded");
    };

    const orders = ordersData?.orders || [];
    const totalPages = ordersData?.totalPages || 0;
    const total = ordersData?.total || 0;

    const STATUS_LABELS: Record<string, { label: string, color: string }> = {
        pending_kyc_review: { label: language === 'ar' ? "مراجعة أوراق" : "KYC Review", color: "bg-amber-900/30 text-amber-500 shadow-none border border-amber-800/30" },
        pending_payment: { label: language === 'ar' ? "بانتظار الدفع" : "Awaiting Payment", color: "bg-blue-900/30 text-blue-400 shadow-none border border-blue-800/30" },
        pending: { label: language === 'ar' ? "قيد الانتظار" : "Pending", color: "bg-slate-900/30 text-slate-500 shadow-none border border-slate-800/30" },
        preparing_shipment: { label: language === 'ar' ? "جاري التجهيز للشحن" : "Preparing Shipment", color: "bg-fuchsia-900/30 text-fuchsia-400 shadow-none border border-fuchsia-800/30" },
        shipped: { label: language === 'ar' ? "تم الشحن" : "Shipped", color: "bg-purple-900/30 text-purple-400 shadow-none border border-purple-800/30" },
        delivered: { label: language === 'ar' ? "تم التسليم" : "Delivered", color: "bg-blue-900/30 text-blue-400 shadow-none border border-blue-800/30" },
        cancelled: { label: language === 'ar' ? "ملغى" : "Cancelled", color: "bg-red-900/30 text-red-500 shadow-none border border-red-800/30" },
    };

    if (isLoading) return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
            </div>
            <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden border border-gray-800 shadow-none rounded-[40px] bg-background">
                        <div className="bg-gray-900 px-8 py-6 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <Skeleton className="h-12 w-48 rounded-2xl" />
                        </div>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full rounded-2xl" />
                                <Skeleton className="h-20 w-full rounded-2xl" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">{language === 'ar' ? "إدارة الطلبات" : "Order Management"}</h2>
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base">{language === 'ar' ? "تابع وحمل وأدر طلبات عملائك بكل سهولة" : "Track and manage your customer orders easily"}</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2 block">
                        {language === 'ar' ? 'بحث (رقم الطلب، اسم العميل)' : 'Search (Order ID, Customer Name)'}
                    </label>
                    <div className="relative">
                        <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
                        <input
                            type="text"
                            placeholder={language === 'ar' ? "ابحث هنا..." : "Search here..."}
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className={`w-full bg-gray-950 border border-gray-800 rounded-xl py-3 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors`}
                        />
                    </div>
                </div>

                <div className="w-full md:w-1/4">
                    <label className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2 block">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                    </label>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                        <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
                        {Object.entries(STATUS_LABELS).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>

                <div className="w-full md:w-1/5">
                    <label className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2 block">
                        {language === 'ar' ? 'من تاريخ' : 'From Date'}
                    </label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                    />
                </div>

                <div className="w-full md:w-1/5">
                    <label className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2 block">
                        {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                    </label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                    />
                </div>

                <div className="w-full md:w-auto flex-shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); setFilterStatus('all'); setPage(1); }}
                        className="w-full h-12 text-gray-400 hover:text-white"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'مسح' : 'Clear'}
                    </Button>
                </div>
            </div>

            {orders.length === 0 ? (
                <Card className="border border-gray-800 shadow-none rounded-[40px] p-16 text-center bg-background">
                    <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">{language === 'ar' ? "لا توجد طلبات حتى الآن" : "No orders yet"}</h3>
                    <p className="text-white font-bold max-w-xs mx-auto">
                        {language === 'ar' ? "بمجرد أن يبدأ العملاء في طلب منتجاتك، ستظهر هنا" : "Once customers start ordering your products, they will appear here"}
                    </p>
                </Card>
            ) : (
                <div className="space-y-8">
                    {orders.map((order: any) => (
                        <Card key={order.id} className="overflow-hidden border border-gray-800 shadow-none rounded-[1.5rem] md:rounded-[2.5rem] bg-background group hover:scale-[1.01] transition-transform duration-300">
                            <div className="bg-gray-900/50 px-4 sm:px-8 py-5 sm:py-6 border-b border-gray-800">
                                {/* Top Row: Order Number + Date */}
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{language === 'ar' ? "رقم الطلب" : "Order Number"}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-xl text-white">#{order.orderNumber}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded-full text-white hover:text-white hover:bg-gray-800"
                                                    onClick={() => setSelectedOrderId(order.id)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-gray-800"
                                                    onClick={() => handleDownloadFullOrderData(order)}
                                                    title={language === 'ar' ? 'تنزيل كافة البيانات' : 'Download All Data'}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-gray-800" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{language === 'ar' ? "التاريخ" : "Date"}</span>
                                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-white" />
                                                {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Customer + Status */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <button
                                        className="flex items-center gap-3 md:gap-4 bg-gray-900 px-3 md:px-5 py-2 md:py-3 rounded-2xl border border-gray-800 shadow-none hover:bg-gray-800 transition-all duration-300 group/customer"
                                        onClick={() => onCustomerClick({ ...order.customer, shippingAddress: order.shippingAddress })}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center group-hover/customer:scale-110 transition-transform shrink-0">
                                            <span className="text-xs font-black text-purple-400">{(order.customer?.name?.[0] || 'G').toUpperCase()}</span>
                                        </div>
                                        <div className={`flex flex-col ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                            <span className="text-[10px] font-black text-white">{language === 'ar' ? "العميل" : "Customer"}</span>
                                            <span className="text-sm font-black text-white leading-tight">
                                                {order.customer?.name || order.shippingAddress?.name || (language === 'ar' ? "ضيف" : "Guest")}
                                            </span>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-3">
                                        {/* KYC Review Badge + Button */}
                                        {(order.paymentStatus === 'pending_kyc_review' || (order.paymentMethod === 'installments' && order.paymentStatus === 'awaiting_deposit_payment')) && (
                                            <Button
                                                size="sm"
                                                onClick={() => setKycModalOrder(order)}
                                                className="bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl px-5 h-10 flex gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {language === 'ar' ? 'مراجعة التقسيط' : 'Review KYC'}
                                            </Button>
                                        )}
                                        <div className="relative">
                                            <div className={cn(
                                                "text-[10px] font-black px-4 py-1.5 rounded-full border mb-1 text-center",
                                                STATUS_LABELS[order.status]?.color || "bg-gray-800 text-white"
                                            )}>
                                                {language === 'ar' ? 'حالة الطلب' : 'Order Status'}
                                            </div>
                                            <select
                                                className={cn(
                                                    "text-base md:text-xs font-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border-none outline-none cursor-pointer appearance-none transition-all duration-300 hover:opacity-80 w-fit",
                                                    STATUS_LABELS[order.status]?.color || "bg-gray-800 text-white"
                                                )}
                                                value={order.status}
                                                onChange={(e) => updateStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                {Object.entries(STATUS_LABELS).map(([key, config]) => {
                                                    const isLocked = (current: string, target: string) => {
                                                        const stepMap: Record<string, number> = {
                                                            'pending': 1,
                                                            'preparing_shipment': 2,
                                                            'shipped': 3,
                                                            'delivered': 4,
                                                            'cancelled': 5
                                                        };
                                                        const currentLevel = stepMap[current] || 0;
                                                        const targetLevel = stepMap[target] || 0;
                                                        if (target === 'cancelled') return current === 'delivered' || !!order?.installmentPlanId;
                                                        return targetLevel <= currentLevel;
                                                    };

                                                    return (
                                                        <option
                                                            key={key}
                                                            value={key}
                                                            className="bg-gray-900 text-white font-bold"
                                                            disabled={isLocked(order.status, key)}
                                                        >
                                                            {config.label} {updateStatusMutation.isPending && key === order.status ? "..." : ""}
                                                            {isLocked(order.status, key) ? " (🔒)" : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                        <thead className="hidden md:table-header-group bg-gray-900 border-b border-gray-800">
                                            <tr>
                                                <th className={`py-5 px-8 font-black text-white text-[10px] uppercase tracking-wider w-[45%] ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                    {language === 'ar' ? "المنتج" : "Product"}
                                                </th>
                                                <th className="text-center py-5 px-4 font-black text-white text-[10px] uppercase tracking-wider w-[15%]">
                                                    {language === 'ar' ? "المقاس" : "Size"}
                                                </th>
                                                <th className="text-center py-5 px-4 font-black text-white text-[10px] uppercase tracking-wider w-[15%]">
                                                    {language === 'ar' ? "الكمية" : "Qty"}
                                                </th>
                                                <th className={`py-5 px-8 font-black text-white text-[10px] uppercase tracking-wider w-[25%] ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                                                    {language === 'ar' ? "السعر" : "Price"}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800 block md:table-row-group">
                                            {order.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="block md:table-row hover:bg-gray-800/30 transition-colors p-4 md:p-0 border-b md:border-none border-gray-800 last:border-0 relative">
                                                    <td className="block md:table-cell py-2 md:py-6 px-0 md:px-8">
                                                        {/* Mobile Label */}
                                                        <span className="md:hidden text-[10px] font-black text-white uppercase tracking-widest block mb-2">{language === 'ar' ? "المنتج" : "Product"}</span>
                                                        <div className={`flex items-center gap-4 md:gap-6 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}>
                                                            <div className="w-16 h-20 rounded-2xl bg-gray-900 flex-shrink-0 overflow-hidden shadow-sm border border-gray-800">
                                                                {item.product?.images?.[0] ? (
                                                                    <img src={item.product.images[0]} className="w-full h-full object-cover" alt="product" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Package className="w-6 h-6 text-gray-800" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                                <p className="font-black text-white text-base md:text-lg leading-tight mb-1">
                                                                    {language === 'ar' ? item.product?.nameAr : item.product?.nameEn}
                                                                </p>
                                                                <p className="text-xs font-bold text-white">
                                                                    {Number(item.price).toFixed(2)} {t('currency')} {language === 'ar' ? 'للقطعة' : 'per item'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="block md:table-cell py-2 md:py-6 px-0 md:px-4 text-start md:text-center flex justify-between md:table-cell items-center border-b border-dashed border-gray-800 md:border-none">
                                                        <span className="md:hidden text-[10px] font-black text-white uppercase tracking-widest">{language === 'ar' ? "المقاس" : "Size"}</span>
                                                        {item.size ? (
                                                            <span className="inline-flex bg-gray-800 text-white px-3 py-1 rounded-xl text-xs font-black ring-4 ring-gray-900">
                                                                {item.size}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-700 font-bold">-</span>
                                                        )}
                                                    </td>
                                                    <td className="block md:table-cell py-2 md:py-6 px-0 md:px-4 text-start md:text-center flex justify-between md:table-cell items-center border-b border-dashed border-gray-800 md:border-none">
                                                        <span className="md:hidden text-[10px] font-black text-white uppercase tracking-widest">{language === 'ar' ? "الكمية" : "Qty"}</span>
                                                        <span className="font-black text-white">{item.quantity}</span>
                                                    </td>
                                                    <td className={`block md:table-cell py-2 md:py-6 px-0 md:px-8 ${language === 'ar' ? 'text-left' : 'text-right'} flex justify-between md:table-cell items-center`}>
                                                        <span className="md:hidden text-[10px] font-black text-white uppercase tracking-widest">{language === 'ar' ? "السعر" : "Price"}</span>
                                                        <span className="font-black text-lg text-[#e91e63]">
                                                            {(item.price * item.quantity).toFixed(2)} {t('currency')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-900/50 block md:table-footer-group">
                                            <tr className="block md:table-row">
                                                <td colSpan={2} className={`block md:table-cell py-4 md:py-8 px-4 md:px-8 ${language === 'ar' ? 'text-right' : 'text-left'} border-b md:border-none border-gray-800`}>
                                                    <div className="flex justify-between md:block items-center">
                                                        <span className="font-black text-white text-sm">{language === 'ar' ? "إجمالي الطلب" : "Order Total"}</span>
                                                        <p className="md:hidden font-black text-xl text-white">
                                                            {Number(order.total).toFixed(2)} <span className="text-sm">{t('currency')}</span>
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] text-white font-bold mt-1 italic hidden md:block">{language === 'ar' ? "* شامل ضريبة القيمة المضافة والشحن" : "* Incl. VAT & Shipping"}</p>
                                                </td>
                                                <td colSpan={2} className={`hidden md:table-cell py-8 px-8 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                                                    <span className="font-black text-3xl text-white">
                                                        {Number(order.total).toFixed(2)} <span className="text-sm">{t('currency')}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8 pb-10">
                    <Button
                        variant="outline"
                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={page === 1 || isFetching}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 rounded-xl px-6"
                    >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                    </Button>
                    <div className="flex flex-col items-center">
                        <span className="text-gray-400 font-bold">
                            {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                            {total} {language === 'ar' ? 'طلب إجمالي' : 'Total Orders'}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={page === totalPages || isFetching}
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 rounded-xl px-6"
                    >
                        {language === 'ar' ? 'التالي' : 'Next'}
                    </Button>
                </div>
            )}
            {
                selectedOrderId && (
                    <OrderDetailsView orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
                )
            }

            {/* KYC Review Modal */}
            {
                kycModalOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
                        <div className="bg-gray-950 border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] p-5 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white">{language === 'ar' ? 'مراجعة طلب التقسيط' : 'Installment Review'}</h2>
                                <span className="text-sm font-bold text-amber-400 bg-amber-900/30 px-4 py-1.5 rounded-full">#{kycModalOrder.orderNumber}</span>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-gray-900 p-5 rounded-2xl mb-6 border border-gray-800">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{language === 'ar' ? 'بيانات العميل' : 'Customer Info'}</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-400 font-black">
                                        {(kycModalOrder.customer?.name?.[0] || 'G').toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{kycModalOrder.customer?.name || kycModalOrder.shippingAddress?.name || 'Guest'}</p>
                                        <p className="text-gray-400 text-xs">{kycModalOrder.customer?.email}</p>
                                        <p className="text-gray-400 text-xs">{kycModalOrder.customer?.phone || kycModalOrder.shippingAddress?.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ordered Products & Plan Info */}
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{language === 'ar' ? 'المنتجات المطلوبة' : 'Ordered Products'}</p>
                                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                        {kycModalOrder.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-800/40 rounded-xl">
                                                <img
                                                    src={item.product?.images?.[0] || item.productImage?.[0] || ''}
                                                    alt="Product"
                                                    className="w-10 h-10 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-white font-bold text-[11px] truncate">
                                                        {language === 'ar' ? item.product?.nameAr : item.product?.nameEn}
                                                    </p>
                                                    <p className="text-gray-500 text-[9px] font-black uppercase tracking-tight">
                                                        {item.quantity} × {Number(item.price).toFixed(2)} {t('currency')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {kycModalOrder.installmentPlan && (
                                    <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{language === 'ar' ? 'خطة التقسيط' : 'Installment Plan'}</p>
                                        <div className="space-y-1">
                                            <p className="text-white font-black text-sm">{kycModalOrder.installmentPlan.name}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                <span className="text-amber-400">{kycModalOrder.installmentPlan.months} {language === 'ar' ? 'شهر' : 'Months'}</span>
                                                <span className="text-gray-600">|</span>
                                                <span className="text-emerald-400">{kycModalOrder.installmentPlan.downPaymentPercentage}% {language === 'ar' ? 'مقدم' : 'Down'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Deposit Info */}
                            {kycModalOrder.depositAmount && (
                                <div className="bg-emerald-900/20 p-5 rounded-2xl mb-6 border border-emerald-500/20">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            {language === 'ar' ? 'المقدم المدفوع' : 'Downpayment Paid'}
                                        </div>
                                        <div className="text-xl font-black text-emerald-400">
                                            {Number(kycModalOrder.depositAmount).toFixed(2)} {t('currency')}
                                        </div>
                                    </div>
                                    <div className="text-xs text-emerald-500/70 font-bold mt-1">
                                        {language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'} {({
                                            'card': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                                            'wallet': language === 'ar' ? 'المحفظة' : 'Wallet',
                                            'gift_card': language === 'ar' ? 'كارت هدية' : 'Gift Card',
                                        } as any)[kycModalOrder.depositPaymentMethod] || kycModalOrder.depositPaymentMethod}
                                    </div>
                                </div>
                            )}

                            {/* KYC Documents */}
                            {kycModalOrder.kycData && (
                                <div className="space-y-4 mb-6">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'المستندات المرفوعة' : 'Uploaded Documents'}</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {(kycModalOrder.kycData.faceId || kycModalOrder.kycData.faceImage) && (
                                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ScanFace className="w-4 h-4 text-blue-400" />
                                                    <span className="text-[10px] font-black text-white">{language === 'ar' ? 'صورة الوجه' : 'Face Image'}</span>
                                                </div>
                                                <img
                                                    src={kycModalOrder.kycData.faceId || kycModalOrder.kycData.faceImage}
                                                    alt="Face"
                                                    className="w-full h-32 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                    onClick={() => window.open(kycModalOrder.kycData.faceId || kycModalOrder.kycData.faceImage, '_blank')}
                                                />
                                            </div>
                                        )}

                                        {(kycModalOrder.kycData.residencyDoc || kycModalOrder.kycData.idImage) && (
                                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CreditCard className="w-4 h-4 text-green-400" />
                                                    <span className="text-[10px] font-black text-white">{language === 'ar' ? 'الهوية / الإقامة' : 'ID / Residency'}</span>
                                                </div>
                                                <img
                                                    src={kycModalOrder.kycData.residencyDoc || kycModalOrder.kycData.idImage}
                                                    alt="ID"
                                                    className="w-full h-32 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                    onClick={() => window.open(kycModalOrder.kycData.residencyDoc || kycModalOrder.kycData.idImage, '_blank')}
                                                />
                                            </div>
                                        )}

                                        {(kycModalOrder.kycData.passportDoc || kycModalOrder.kycData.passportImage) && (
                                            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FileText className="w-4 h-4 text-purple-400" />
                                                    <span className="text-[10px] font-black text-white">{language === 'ar' ? 'الجواز' : 'Passport'}</span>
                                                </div>
                                                <img
                                                    src={kycModalOrder.kycData.passportDoc || kycModalOrder.kycData.passportImage}
                                                    alt="Passport"
                                                    className="w-full h-32 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                    onClick={() => window.open(kycModalOrder.kycData.passportDoc || kycModalOrder.kycData.passportImage, '_blank')}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual KYC Data */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                        {kycModalOrder.kycData.idNumber && (
                                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'رقم الهوية' : 'ID Number'}</p>
                                                <p className="text-white font-black">{kycModalOrder.kycData.idNumber}</p>
                                            </div>
                                        )}
                                        {kycModalOrder.kycData.passportNumber && (
                                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</p>
                                                <p className="text-white font-black">{kycModalOrder.kycData.passportNumber}</p>
                                            </div>
                                        )}
                                        {kycModalOrder.kycData.dob && (
                                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p>
                                                <p className="text-white font-black">{kycModalOrder.kycData.dob}</p>
                                            </div>
                                        )}
                                        {kycModalOrder.kycData.residentialAddress && (
                                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50 sm:col-span-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'عنوان السكن' : 'Residential Address'}</p>
                                                <p className="text-white font-black">{kycModalOrder.kycData.residentialAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reject Reason */}
                            <div className="mb-6">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">{language === 'ar' ? 'سبب الرفض (اختياري)' : 'Reject Reason (optional)'}</label>
                                <Textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder={language === 'ar' ? 'اكتب سبب الرفض إن وجد...' : 'Write rejection reason if any...'}
                                    className="bg-gray-900 border-gray-800 text-white rounded-2xl min-h-[80px]"
                                />
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => kycReviewMutation.mutate({ orderId: kycModalOrder.id, action: 'reject', reason: rejectReason })}
                                    disabled={kycReviewMutation.isPending}
                                    className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 font-black text-white flex gap-2"
                                >
                                    {kycReviewMutation.isPending ? <Loader2 className="animate-spin" /> : <XCircle className="w-5 h-5" />}
                                    {language === 'ar' ? 'رفض الطلب' : 'Reject'}
                                </Button>
                                <Button
                                    onClick={() => kycReviewMutation.mutate({ orderId: kycModalOrder.id, action: 'approve' })}
                                    disabled={kycReviewMutation.isPending}
                                    className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black text-white flex gap-2"
                                >
                                    {kycReviewMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    {language === 'ar' ? 'الموافقة على الطلب' : 'Approve'}
                                </Button>
                            </div>

                            <Button variant="ghost" onClick={() => { setKycModalOrder(null); setRejectReason(''); }} className="w-full mt-4 text-gray-400 hover:text-white">
                                {language === 'ar' ? 'إغلاق' : 'Close'}
                            </Button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
