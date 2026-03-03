import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp, Package, ShoppingCart, Loader2, ArrowLeft, ArrowRight, Eye, User, Clock, Check, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
    dashboard: any;
    onCategoryClick: (id: number) => void;
    onProductClick: (id: number) => void;
    onOrderClick: (customer: any) => void;
}

export default function OverviewTab({ dashboard, onCategoryClick, onProductClick, onOrderClick }: OverviewTabProps) {
    const { t, language } = useLanguage();

    const stats = [
        { label: language === 'ar' ? "إجمالي المبيعات" : "Total Revenue", value: `${dashboard?.stats?.totalRevenue || 0} ${t('currency')}`, icon: TrendingUp, color: "text-[#e91e63]", bg: "bg-pink-900/30" },
        { label: language === 'ar' ? "الطلبات النشطة" : "Active Orders", value: dashboard?.stats?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-900/30" },
        { label: language === 'ar' ? "إجمالي المنتجات" : "Total Products", value: dashboard?.stats?.totalProducts || 0, icon: Package, color: "text-purple-400", bg: "bg-purple-900/30" },
        { label: language === 'ar' ? "تقييم المتجر" : "Store Rating", value: dashboard?.stats?.rating || "0.0", icon: Zap, color: "text-amber-400", bg: "bg-amber-900/30" },
    ];

    // Fetch real analytics data
    const { data: analyticsData } = useQuery({
        queryKey: ['vendor', 'analytics'],
        queryFn: () => endpoints.admin.reports.getAnalytics(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!dashboard,
    });

    if (!dashboard) return (
        <div className="space-y-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-xl shadow-purple-900/5 rounded-[40px] bg-background border border-gray-800 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <Skeleton className="w-14 h-14 rounded-3xl" />
                            <Skeleton className="h-2 w-8" />
                        </div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-8 border-0 shadow-xl shadow-purple-900/5 rounded-[40px] bg-background border border-gray-800 h-[400px]">
                    <Skeleton className="w-full h-full rounded-[40px]" />
                </Card>
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-0 shadow-xl shadow-purple-900/5 rounded-[40px] bg-slate-900 h-[300px]">
                        <Skeleton className="w-full h-full rounded-[40px] opacity-20" />
                    </Card>
                </div>
            </div>
        </div>
    );
    const chartData = analyticsData || [];

    const recentOrders = dashboard.recentOrders || [];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border-0 shadow-xl shadow-purple-900/5 rounded-[40px] overflow-hidden group hover:scale-105 transition-all duration-500 bg-background border border-gray-800">
                        <CardContent className={`p-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                            <div className={`flex items-center justify-between mb-6 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}>
                                <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:rotate-12", stat.bg)}>
                                    <stat.icon className={cn("w-7 h-7", stat.color)} />
                                </div>
                                <div className="h-2 w-8 bg-gray-800 rounded-full" />
                            </div>
                            <p className="text-gray-500 font-bold text-sm mb-1 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Revenue Chart */}
                <Card className="lg:col-span-8 border-0 shadow-xl shadow-purple-900/5 rounded-[40px] bg-background border border-gray-800 overflow-hidden">
                    <div className={`p-10 border-b border-gray-800 flex items-center justify-between ${language === 'ar' ? 'flex-row' : 'flex-row'}`}>
                        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                            <h3 className="text-2xl font-black text-white mb-1">{language === 'ar' ? "تحليل نمو المبيعات" : "Revenue Analytics"}</h3>
                            <p className="text-sm font-bold text-gray-400">{language === 'ar' ? "أداء متجرك خلال الـ 6 أشهر الماضية" : "Store performance over the last 6 months"}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-900/30 px-4 py-2 rounded-2xl">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-black text-emerald-400">+12.5%</span>
                        </div>
                    </div>
                    <div className="p-10 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e91e63" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#e91e63" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0A0A0A',
                                        borderRadius: '16px',
                                        border: '1px solid #1f2937',
                                        boxShadow: 'none',
                                        fontFamily: 'inherit',
                                        fontWeight: 900,
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#e91e63"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Quick Actions / Activity */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-[40px] bg-slate-900 text-white p-10 relative overflow-hidden">
                        <Zap className={`absolute ${language === 'ar' ? '-left-10' : '-right-10'} -bottom-10 w-48 h-48 text-white/5 ${language === 'ar' ? 'rotate-12' : '-rotate-12'}`} />
                        <h4 className={`text-xl font-black mb-8 relative z-10 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'ar' ? "إجراءات سريعة" : "Lightning Actions"}</h4>
                        <div className="space-y-4 relative z-10">
                            {[
                                { label: language === 'ar' ? "إضافة فستان جديد" : "Post New Dress", icon: Plus, action: () => (window.location.search = "?tab=products") },
                                { label: language === 'ar' ? "إنشاء كود خصم" : "Create Coupon", icon: Check, action: () => (window.location.search = "?tab=coupons") },
                                { label: language === 'ar' ? "تحديث المتجر" : "Update Profile", icon: User, action: () => (window.location.search = "?tab=settings") },
                            ].map((btn, i) => (
                                <Button key={i} onClick={btn.action} className={`w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-white/10 font-bold justify-start px-6 gap-4 text-white transition-all ${language === 'ar' ? 'hover:-translate-x-2' : 'hover:translate-x-2'}`}>
                                    <btn.icon className="w-5 h-5 text-purple-400" />
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-0 shadow-xl shadow-purple-900/5 rounded-[40px] bg-background border border-gray-800 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-black text-white">{language === 'ar' ? "تنبيهات هامة" : "Alerts"}</h4>
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-900/30 rounded-2xl border border-amber-800 flex gap-4">
                                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                <p className="text-xs font-bold text-amber-200 leading-relaxed">
                                    {language === 'ar' ? "لديك 3 طلبات لم يتم تأكيدها بعد. يرجى مراجعتها فوراً." : "You have 3 unconfirmed orders. Please review them."}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-2xl font-black text-white">{language === 'ar' ? "آخر الطلبات" : "Recent Activity"}</h3>
                    <Button variant="link" onClick={() => (window.location.search = "?tab=orders")} className="text-[#e91e63] font-black underline underline-offset-8">
                        {language === 'ar' ? "عرض الكل" : "View Full Journal"}
                    </Button>
                </div>

                <Card className="border-0 shadow-xl shadow-purple-900/5 rounded-[40px] bg-background border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                            <thead className="bg-gray-800 border-b border-gray-700">
                                <tr>
                                    <th className={`py-6 px-10 text-[10px] font-black text-gray-400 uppercase tracking-widest ${language === 'ar' ? 'text-right' : 'text-left'}`}>{language === 'ar' ? "العميل" : "Customer"}</th>
                                    <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{language === 'ar' ? "المنتجات" : "Items"}</th>
                                    <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{language === 'ar' ? "الحالة" : "Status"}</th>
                                    <th className={`py-6 px-10 text-[10px] font-black text-gray-400 uppercase tracking-widest ${language === 'ar' ? 'text-left' : 'text-right'}`}>{language === 'ar' ? "المبلغ" : "Total"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-16 text-center text-gray-500 font-bold italic">
                                            {language === 'ar' ? "لا توجد طلبات حديثة حالياً" : "No recent activity recorded"}
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-gray-800/50 transition-colors group cursor-pointer" onClick={() => onOrderClick(order)}>
                                            <td className="py-6 px-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-black text-gray-400 text-xs">
                                                        {order.customer?.name?.[0] || 'G'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-sm">{order.customer?.name || (language === 'ar' ? "ضيف" : "Guest")}</p>
                                                        <p className="text-[10px] font-bold text-gray-500">#{order.orderNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-center font-bold text-white text-sm">
                                                {order.items?.length || 0} {language === 'ar' ? "قطع" : "Items"}
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    order.status === 'delivered' ? "bg-emerald-900/30 text-emerald-400" : "bg-amber-900/30 text-amber-400"
                                                )}>
                                                    {order.status === 'delivered' ? (language === 'ar' ? 'مسلم' : 'Delivered') : (language === 'ar' ? 'قيد التنفيذ' : 'Processing')}
                                                </span>
                                            </td>
                                            <td className={`py-6 px-10 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                                                <span className="font-black text-white">{order.total} <span className="text-[10px]">{t('currency')}</span></span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
