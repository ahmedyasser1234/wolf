import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, FileText, ScanFace, CreditCard, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
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
    const [filterStatus, setFilterStatus] = useState<'pending_kyc_review' | 'pending_payment' | 'paid' | 'all'>('pending_kyc_review');

    const { data: allOrders, isLoading } = useQuery({
        queryKey: ['admin', 'installment-orders'],
        queryFn: async () => (await api.get('/admin/orders')).data,
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
        },
        onError: () => toast.error(language === 'ar' ? 'فشلت العملية' : 'Operation failed'),
    });

    // Only show installment orders (those with an installmentPlanId)
    const installmentOrders = (allOrders || []).filter((o: any) => o.installmentPlanId);

    const filteredOrders = filterStatus === 'all'
        ? installmentOrders
        : installmentOrders.filter((o: any) => o.paymentStatus === filterStatus);

    const pendingCount = installmentOrders.filter((o: any) => o.paymentStatus === 'pending_kyc_review').length;

    const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
        pending_kyc_review: { label: language === 'ar' ? 'قيد المراجعة' : 'Under Review', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
        pending_payment: { label: language === 'ar' ? 'بانتظار الدفعة الأولى' : 'Awaiting Down Payment', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
        paid: { label: language === 'ar' ? 'مدفوع' : 'Paid', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
        failed: { label: language === 'ar' ? 'مرفوض' : 'Rejected', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
        pending: { label: language === 'ar' ? 'معلق' : 'Pending', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
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
                    <p className="text-gray-400 font-bold text-xs sm:text-sm">
                        {language === 'ar' ? `${pendingCount} طلب بانتظار المراجعة` : `${pendingCount} request(s) awaiting review`}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    {([
                        { key: 'pending_kyc_review', label: language === 'ar' ? 'قيد المراجعة' : 'Under Review' },
                        { key: 'pending_payment', label: language === 'ar' ? 'بانتظار الدفع' : 'Awaiting Payment' },
                        { key: 'paid', label: language === 'ar' ? 'مدفوع' : 'Paid' },
                        { key: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                    ] as const).map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilterStatus(f.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${filterStatus === f.key
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            {f.label}
                            {f.key === 'pending_kyc_review' && pendingCount > 0 && (
                                <span className="ms-2 bg-amber-500 text-black text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
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
                    {filteredOrders.map((order: any) => (
                        <Card key={order.id} className="bg-background border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:border-gray-600 transition-all group">
                            <CardContent className="p-0">
                                {/* KYC Pending Alert Banner */}
                                {order.paymentStatus === 'pending_kyc_review' && (
                                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                                        <span className="text-sm font-black text-amber-400">
                                            {language === 'ar' ? '⚡ هذا الطلب ينتظر مراجعتك وموافقتك' : '⚡ This request is awaiting your review and approval'}
                                        </span>
                                    </div>
                                )}

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
                                        {order.paymentStatus === 'pending_kyc_review' && (
                                            <Button
                                                onClick={() => setKycModalOrder(order)}
                                                className="bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl px-6 h-12 gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                {language === 'ar' ? 'مراجعة الطلب' : 'Review Request'}
                                            </Button>
                                        )}
                                        {order.paymentStatus === 'pending_payment' && (
                                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-2">
                                                <CreditCard className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-black text-blue-400">{language === 'ar' ? 'بانتظار دفع المقدم' : 'Awaiting down payment'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* KYC Review Modal */}
            {kycModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.88)' }}>
                    <div className="bg-gray-950 border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] p-5 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white mb-1">{language === 'ar' ? 'مراجعة طلب التقسيط' : 'Installment KYC Review'}</h2>
                                <span className="text-sm font-bold text-amber-400">#{kycModalOrder.orderNumber}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-bold">{language === 'ar' ? 'إجمالي الطلب' : 'Order Total'}</p>
                                <p className="text-xl font-black text-primary">{Number(kycModalOrder.total).toFixed(2)} {t('currency')}</p>
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

                        {/* Chosen Product & Plan Info */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Product Info */}
                            {kycModalOrder.items && kycModalOrder.items[0] && (
                                <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{language === 'ar' ? 'المنتج المختار' : 'Chosen Product'}</p>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={kycModalOrder.items[0].productImage}
                                            alt="Product"
                                            className="w-16 h-16 rounded-xl object-cover border border-gray-700"
                                        />
                                        <div>
                                            <p className="text-white font-bold text-sm line-clamp-1">
                                                {language === 'ar' ? kycModalOrder.items[0].productNameAr : kycModalOrder.items[0].productNameEn}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {kycModalOrder.items[0].quantity} × {Number(kycModalOrder.items[0].price).toFixed(2)} {t('currency')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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

                        {/* KYC Documents */}
                        {kycModalOrder.kycData ? (
                            <div className="space-y-4 mb-6">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'المستندات المرفوعة' : 'Uploaded Documents'}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(kycModalOrder.kycData.faceImage || kycModalOrder.kycData.faceIdImage) && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ScanFace className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'صورة الوجه' : 'Face Image'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.faceImage || kycModalOrder.kycData.faceIdImage}
                                                alt="Face"
                                                className="w-full h-40 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => window.open(kycModalOrder.kycData.faceImage || kycModalOrder.kycData.faceIdImage, '_blank')}
                                            />
                                        </div>
                                    )}

                                    {(kycModalOrder.kycData.idImage || kycModalOrder.kycData.residencyImage) && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CreditCard className="w-4 h-4 text-green-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'الهوية / الإقامة' : 'ID / Residency'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.idImage || kycModalOrder.kycData.residencyImage}
                                                alt="ID"
                                                className="w-full h-40 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => window.open(kycModalOrder.kycData.idImage || kycModalOrder.kycData.residencyImage, '_blank')}
                                            />
                                        </div>
                                    )}

                                    {kycModalOrder.kycData.passportImage && (
                                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 sm:col-span-2">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="w-4 h-4 text-purple-400" />
                                                <span className="text-xs font-black text-white">{language === 'ar' ? 'جواز السفر' : 'Passport'}</span>
                                            </div>
                                            <img
                                                src={kycModalOrder.kycData.passportImage}
                                                alt="Passport"
                                                className="w-full h-48 rounded-xl object-cover border-2 border-gray-700 cursor-zoom-in"
                                                onClick={() => window.open(kycModalOrder.kycData.passportImage, '_blank')}
                                            />
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
