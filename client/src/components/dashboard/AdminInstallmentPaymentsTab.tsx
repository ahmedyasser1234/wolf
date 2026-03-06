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
    Loader2
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
                                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-purple-400 hover:bg-purple-900/20 hover:text-purple-300">
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
        </div>
    );
}
