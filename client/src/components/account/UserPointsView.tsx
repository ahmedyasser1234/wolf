import { useLanguage } from "@/lib/i18n";
import { endpoints } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
    Award,
    Gift,
    History,
    TrendingUp,
    Star,
    ArrowDownCircle,
    ArrowUpCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserPointsView() {
    const { t, language } = useLanguage();

    const { data, isLoading } = useQuery({
        queryKey: ['user', 'points'],
        queryFn: () => endpoints.points.getMyPoints(),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 rounded-[40px]" />
                <Skeleton className="h-80 rounded-[40px]" />
            </div>
        );
    }

    const { points, history } = data || { points: 0, history: [] };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Points Card */}
            <Card className="rounded-[40px] border-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full -ml-20 -mb-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />

                <CardContent className="p-10 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 rounded-[28px] flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl">
                                <Award className="w-10 h-10 text-yellow-300" />
                            </div>
                            <div className="text-right">
                                <p className="text-purple-100 font-bold text-sm mb-1 uppercase tracking-[0.2em]">
                                    {language === 'ar' ? 'رصيد نقاطك الحالي' : 'Current Points Balance'}
                                </p>
                                <h3 className="text-5xl font-black tabular-nums flex items-baseline gap-2">
                                    {points.toLocaleString()}
                                    <span className="text-xl font-bold text-purple-200">{language === 'ar' ? 'نقطة' : 'Pts'}</span>
                                </h3>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 text-center">
                                <p className="text-[10px] font-black text-purple-200 uppercase mb-1">{language === 'ar' ? 'المستوى القادم' : 'Next Reward'}</p>
                                <p className="font-black flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-pink-300" />
                                    {language === 'ar' ? 'خصم 50 د.إ' : '50 AED Off'}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 text-center">
                                <p className="text-[10px] font-black text-purple-200 uppercase mb-1">{language === 'ar' ? 'حالة الحساب' : 'Account Status'}</p>
                                <p className="font-black flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-300" />
                                    {language === 'ar' ? 'بلاتيني' : 'Platinum'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Points History */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-purple-600 rounded-full" />
                        {language === 'ar' ? 'سجل النقاط' : 'Points History'}
                    </h3>
                    <History className="w-6 h-6 text-slate-300" />
                </div>

                <div className="grid gap-4">
                    {history.length === 0 ? (
                        <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-xl shadow-slate-100/50">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold italic">
                                {language === 'ar' ? 'ابدئي التسوق الآن واكسبي أول نقاطك!' : 'Start shopping now to earn your first points!'}
                            </p>
                        </div>
                    ) : (
                        history.map((tx: any) => (
                            <div
                                key={tx.id}
                                className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-lg shadow-slate-50 hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${tx.type === 'earn'
                                            ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                                            : 'bg-red-50 text-red-600 group-hover:bg-red-100'
                                            }`}>
                                            {tx.type === 'earn' ? <ArrowDownCircle className="w-7 h-7" /> : <ArrowUpCircle className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-lg leading-tight uppercase group-hover:text-purple-600 transition-colors">
                                                {tx.description}
                                            </h4>
                                            <p className="text-sm font-bold text-slate-400 mt-1">
                                                {new Date(tx.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black tabular-nums ${tx.type === 'earn' ? 'text-emerald-500' : 'text-red-500'
                                            }`}>
                                            {tx.type === 'earn' ? '+' : ''}{tx.amount}
                                        </span>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-1">
                                            {language === 'ar' ? 'نقطة' : 'Points'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
