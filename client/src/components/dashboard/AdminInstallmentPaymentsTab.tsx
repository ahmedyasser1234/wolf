import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Calendar,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Hash,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    Eye,
    ScanFace,
    FileText,
    CreditCard as IdCard,
    MapPin,
    Phone,
    Mail
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInstallmentPaymentsTab() {
    const { language, t } = useLanguage();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['admin', 'installment-payments', date, status, page],
        queryFn: () => endpoints.installments.getPaymentsAdmin({
            date,
            status: status === "all" ? undefined : status,
            page,
            limit: 10
        }),
    });

    const payments = data?.data || [];
    const meta = data?.meta || { total: 0, totalPages: 1 };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                        <CheckCircle2 size={12} /> {language === 'ar' ? 'تم الدفع' : 'Paid'}
                    </div>
                );
            case 'overdue':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-500/20 text-[10px] font-black uppercase">
                        <XCircle size={12} /> {language === 'ar' ? 'متأخر' : 'Overdue'}
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/30 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase">
                        <Clock size={12} /> {language === 'ar' ? 'معلق' : 'Pending'}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{language === 'ar' ? 'متابعة الأقساط اليومية' : 'Daily Installment Tracking'}</h2>
                    <p className="text-gray-500 text-xs font-bold mt-1">
                        {language === 'ar' ? 'إدارة وتحصيل الأقساط المستحقة لليوم' : 'Manage and track maturing installments for today'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border border-gray-800 rounded-[1.5rem] bg-gray-950/50 shadow-none overflow-hidden">
                <CardContent className="p-4 sm:p-6 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                        <div className="relative">
                            <Calendar className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-gray-900 border-gray-800 text-white font-bold h-11 rounded-xl`}
                            />
                        </div>
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                            <SelectTrigger className="bg-gray-900 border-gray-800 text-white font-bold h-11 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                                <SelectItem value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</SelectItem>
                                <SelectItem value="paid">{language === 'ar' ? 'تم الدفع' : 'Paid'}</SelectItem>
                                <SelectItem value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isFetching && <Loader2 className="animate-spin text-purple-600 w-5 h-5 ml-auto" />}
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] bg-background shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-900/50">
                                <th className="py-4 px-6 font-black text-white text-[11px] uppercase tracking-wider">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                                <th className="py-4 px-6 font-black text-white text-[11px] uppercase tracking-wider">{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                                <th className="py-4 px-6 font-black text-white text-[11px] uppercase tracking-wider">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                <th className="py-4 px-6 font-black text-white text-[11px] uppercase tracking-wider">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                <th className="py-4 px-6 font-black text-white text-[11px] uppercase tracking-wider text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                <th className="py-4 px-6 font-black text-white text-[11px] uppercase tracking-wider text-end">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-800/50">
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-32 bg-gray-800 rounded-lg" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-20 bg-gray-800 rounded-lg" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-16 bg-gray-800 rounded-lg" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-24 bg-gray-800 rounded-lg" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-6 w-20 mx-auto bg-gray-800 rounded-full" /></td>
                                        <td className="py-4 px-6 text-end"><Skeleton className="h-8 w-8 ml-auto bg-gray-800 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500 font-bold italic">
                                        {language === 'ar' ? 'لا توجد أقساط مستحقة لهذا اليوم.' : 'No installments due for this day.'}
                                    </td>
                                </tr>
                            ) : (
                                payments.map((item: any) => (
                                    <tr key={item.payment.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-400 font-black text-[10px]">
                                                    {item.customer.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white leading-none mb-1">{item.customer.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold">{item.customer.phone || item.customer.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 shadow-sm px-2 py-1 bg-gray-900 rounded-lg w-fit">
                                                <Hash size={12} className="text-gray-600" />
                                                {item.order.orderNumber}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-purple-400 whitespace-nowrap">
                                            {Number(item.payment.amount).toFixed(2)} {t('currency')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-600" />
                                                {new Date(item.payment.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-center">
                                                {getStatusBadge(item.payment.status)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedPayment(item)}
                                                className="text-[10px] font-black uppercase text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                                            >
                                                {language === 'ar' ? 'تفاصيل العميل' : 'View User'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-4 bg-gray-950/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="bg-gray-900 text-white hover:bg-gray-800"
                        >
                            <ChevronLeft size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                        </Button>
                        <span className="text-xs font-black text-white">
                            {language === 'ar' ? `صفحة ${page} من ${meta.totalPages}` : `Page ${page} of ${meta.totalPages}`}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="bg-gray-900 text-white hover:bg-gray-800"
                        >
                            <ChevronRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                        </Button>
                    </div>
                )}
            </Card>

            {/* Customer Details Modal */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-gray-950 border border-gray-800 rounded-[2rem] p-6 sm:p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedPayment(null)}
                            className="absolute top-6 left-6 sm:top-8 sm:left-8 w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Header */}
                        <div className="text-center mb-10 mt-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-purple-500/20">
                                {selectedPayment.customer.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <h2 className="text-2xl font-black text-white mb-1">{selectedPayment.customer.name}</h2>
                            <p className="text-purple-400 font-bold text-sm tracking-wider uppercase">
                                {language === 'ar' ? 'بيانات العميل والتحقق' : 'Customer & Verification Details'}
                            </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Mail size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                                    <p className="text-white font-bold text-xs truncate">{selectedPayment.customer.email}</p>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</p>
                                    <p className="text-white font-bold text-xs">{selectedPayment.customer.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors flex items-center gap-4 sm:col-span-2">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                                    <p className="text-white font-bold text-xs">{selectedPayment.customer.address || selectedPayment.order.shippingAddress?.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* KYC Section */}
                        {selectedPayment.order.kycData ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <ScanFace className="text-purple-400" size={20} />
                                    <h3 className="text-lg font-black text-white">{language === 'ar' ? 'بيانات التحقق (KYC)' : 'Verification Data (KYC)'}</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'رقم الهوية' : 'ID Number'}</p>
                                        <p className="text-white font-black">{selectedPayment.order.kycData.idNumber || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</p>
                                        <p className="text-white font-black">{selectedPayment.order.kycData.passportNumber || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p>
                                        <p className="text-white font-black">{selectedPayment.order.kycData.dob || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'العنوان المسجل' : 'Residential Address'}</p>
                                        <p className="text-white font-black text-xs">{selectedPayment.order.kycData.residentialAddress || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Documents Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(selectedPayment.order.kycData.faceIdImage || selectedPayment.order.kycData.faceId || selectedPayment.order.kycData.faceImage) && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <ScanFace size={12} /> {language === 'ar' ? 'صورة الوجه' : 'Face ID'}
                                            </p>
                                            <div
                                                className="aspect-video rounded-2xl bg-gray-900 border-2 border-gray-800 overflow-hidden group cursor-zoom-in"
                                                onClick={() => window.open(selectedPayment.order.kycData.faceIdImage || selectedPayment.order.kycData.faceId || selectedPayment.order.kycData.faceImage, '_blank')}
                                            >
                                                <img
                                                    src={selectedPayment.order.kycData.faceIdImage || selectedPayment.order.kycData.faceId || selectedPayment.order.kycData.faceImage}
                                                    alt="Face ID"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(selectedPayment.order.kycData.idFrontImage || selectedPayment.order.kycData.residencyImage || selectedPayment.order.kycData.residencyDoc || selectedPayment.order.kycData.idImage) && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <IdCard size={12} /> {language === 'ar' ? 'وجه الهوية' : 'ID Front'}
                                            </p>
                                            <div
                                                className="aspect-video rounded-2xl bg-gray-900 border-2 border-gray-800 overflow-hidden group cursor-zoom-in"
                                                onClick={() => window.open(selectedPayment.order.kycData.idFrontImage || selectedPayment.order.kycData.residencyImage || selectedPayment.order.kycData.residencyDoc || selectedPayment.order.kycData.idImage, '_blank')}
                                            >
                                                <img
                                                    src={selectedPayment.order.kycData.idFrontImage || selectedPayment.order.kycData.residencyImage || selectedPayment.order.kycData.residencyDoc || selectedPayment.order.kycData.idImage}
                                                    alt="ID Front"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedPayment.order.kycData.idBackImage && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <IdCard size={12} /> {language === 'ar' ? 'ظهر الهوية' : 'ID Back'}
                                            </p>
                                            <div
                                                className="aspect-video rounded-2xl bg-gray-900 border-2 border-gray-800 overflow-hidden group cursor-zoom-in"
                                                onClick={() => window.open(selectedPayment.order.kycData.idBackImage, '_blank')}
                                            >
                                                <img
                                                    src={selectedPayment.order.kycData.idBackImage}
                                                    alt="ID Back"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(selectedPayment.order.kycData.passportImage || selectedPayment.order.kycData.passportDoc) && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={12} /> {language === 'ar' ? 'جواز السفر / أخرى' : 'Passport / Extra'}
                                            </p>
                                            <div
                                                className="aspect-video rounded-2xl bg-gray-900 border-2 border-gray-800 overflow-hidden group cursor-zoom-in"
                                                onClick={() => window.open(selectedPayment.order.kycData.passportImage || selectedPayment.order.kycData.passportDoc, '_blank')}
                                            >
                                                <img
                                                    src={selectedPayment.order.kycData.passportImage || selectedPayment.order.kycData.passportDoc}
                                                    alt="Passport"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-900/50 p-10 rounded-2xl border border-dashed border-gray-800 text-center">
                                <FileText className="mx-auto w-10 h-10 text-gray-700 mb-4" />
                                <p className="text-gray-500 font-bold italic">
                                    {language === 'ar' ? 'لا توجد بيانات تحقق مرفوعة لهذا العميل.' : 'No verification data uploaded for this customer.'}
                                </p>
                            </div>
                        )}

                        <div className="mt-10">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedPayment(null)}
                                className="w-full h-14 rounded-2xl border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900 shadow-lg"
                            >
                                {language === 'ar' ? 'إغلاق النافذة' : 'Close Window'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
