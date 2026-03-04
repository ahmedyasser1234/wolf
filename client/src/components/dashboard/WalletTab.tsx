import { useLanguage } from "@/lib/i18n";
import { endpoints } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    CreditCard,
    History
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletTab() {
    const { t, language, formatPrice } = useLanguage();

    const { data, isLoading } = useQuery({
        queryKey: ['vendor', 'wallet'],
        queryFn: () => endpoints.wallets.getMyWallet(),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-40 rounded-3xl" />
                    <Skeleton className="h-40 rounded-3xl" />
                </div>
                <Skeleton className="h-80 rounded-3xl" />
            </div>
        );
    }

    const { wallet, transactions } = data || { wallet: null, transactions: [] };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 flex items-center gap-3">
                        <div className="w-1.5 h-6 sm:w-2 h-8 bg-emerald-500 rounded-full" />
                        {language === 'ar' ? 'المحفظة المالية' : 'Financial Wallet'}
                    </h2>
                    <p className="text-gray-400 font-bold">
                        {language === 'ar' ? 'تتبع أرباحك وعمليات السحب الخاصة بك' : 'Track your earnings and withdrawals'}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/30 rounded-2xl border border-emerald-800">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-black text-emerald-400 capitalize">
                        {language === 'ar' ? 'محدثة الآن' : 'Updated now'}
                    </span>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-[1.5rem] md:rounded-[32px] border-emerald-800 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-none overflow-hidden relative group">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500" />
                    <CardContent className="p-8 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <TrendingUp className="w-6 h-6 text-emerald-200 opacity-50" />
                        </div>
                        <p className="text-emerald-100 font-bold text-sm mb-1 uppercase tracking-widest">
                            {language === 'ar' ? 'الرصيد المتاح للسحب' : 'Available Balance'}
                        </p>
                        <h3 className="text-3xl sm:text-4xl font-black mb-4 tabular-nums">
                            {formatPrice(wallet?.availableBalance || 0)}
                        </h3>
                        <div className="flex gap-3">
                            <button className="flex-1 h-12 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20">
                                {language === 'ar' ? 'طلب سحب' : 'Request Payout'}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] md:rounded-[32px] border-gray-800 bg-background shadow-none overflow-hidden relative group">
                    <CardContent className="p-8 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                <Clock className="w-7 h-7 text-blue-400" />
                            </div>
                            <ArrowUpRight className="w-6 h-6 text-blue-300 opacity-50" />
                        </div>
                        <p className="text-gray-500 font-bold text-sm mb-1 uppercase tracking-widest">
                            {language === 'ar' ? 'أرباح معلقة (تحت المراجعة)' : 'Pending Balance'}
                        </p>
                        <h3 className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                            {formatPrice(wallet?.pendingBalance || 0)}
                        </h3>
                        <p className="text-xs text-gray-500 font-bold mt-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {language === 'ar' ? 'تصبح الأرباح متاحة بعد تأكيد العميل للاستلام' : 'Earnings become available after customer confirms delivery'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card className="rounded-[1.5rem] md:rounded-[40px] border-gray-800 bg-background/80 backdrop-blur-xl shadow-none overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-white rounded-full" />
                        {language === 'ar' ? 'سجل العمليات' : 'Transaction History'}
                    </h3>
                    <History className="w-6 h-6 text-gray-600" />
                </div>
                <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'العملية' : 'Transaction'}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-bold italic">
                                            {language === 'ar' ? 'لا توجد عمليات مسجلة حتى الآن' : 'No transactions recorded yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-gray-800/80 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                                                        }`}>
                                                        {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-sm leading-tight">{tx.description}</p>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">ID: #{tx.relatedId || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-lg font-black tabular-nums ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                                                    }`}>
                                                    {tx.type === 'credit' ? '+' : '-'}{formatPrice(Math.abs(tx.amount))}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase ${tx.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
                                                    tx.status === 'pending' ? 'bg-blue-900/30 text-blue-400' :
                                                        'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {tx.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                    {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                                                    {tx.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                                    {language === 'ar' ? (
                                                        tx.status === 'completed' ? 'مكتملة' :
                                                            tx.status === 'pending' ? 'معلقة' : 'فشلت'
                                                    ) : tx.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-gray-500 text-sm">
                                                    {new Date(tx.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-0 text-right">
                        {transactions.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-400 font-bold italic">
                                {language === 'ar' ? 'لا توجد عمليات مسجلة حتى الآن' : 'No transactions recorded yet'}
                            </div>
                        ) : (
                            transactions.map((tx: any) => (
                                <div key={tx.id} className="p-5 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                                            }`}>
                                            {tx.type === 'credit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-black text-white text-sm leading-snug mb-1">{tx.description}</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">ID: #{tx.relatedId || 'N/A'}</p>
                                                </div>
                                                <span className={`text-lg font-black tabular-nums whitespace-nowrap ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                                                    }`}>
                                                    {tx.type === 'credit' ? '+' : '-'}{formatPrice(Math.abs(tx.amount))}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-gray-500 text-xs flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(tx.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                                </p>
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${tx.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
                                                    tx.status === 'pending' ? 'bg-blue-900/30 text-blue-400' :
                                                        'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {tx.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                    {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                                                    {tx.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                                    {language === 'ar' ? (
                                                        tx.status === 'completed' ? 'مكتملة' :
                                                            tx.status === 'pending' ? 'معلقة' : 'فشلت'
                                                    ) : tx.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
