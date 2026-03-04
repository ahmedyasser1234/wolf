import { useQuery, useMutation } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, Package, Store, Sparkles, Brain,
    ArrowUpRight, ArrowDownRight, Activity, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function AdminAnalyticsTab() {
    const { t } = useLanguage();
    const [aiInsights, setAiInsights] = useState<any>(null);

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['admin', 'reports', 'analytics'],
        queryFn: endpoints.admin.reports.getAnalytics,
    });

    const aiMutation = useMutation({
        mutationFn: endpoints.ai.analyzeAnalytics,
        onSuccess: (data) => {
            setAiInsights(data);
            toast.success("تم توليد الرؤى الذكية بنجاح");
        },
        onError: () => {
            toast.error("فشل في توليد الرؤى الذكية");
        }
    });

    if (isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 -primary animate-spin" />
                <p className="text-gray-400 font-medium">جاري تحليل بيانات المنصة...</p>
            </div>
        );
    }

    const formatCompactNumber = (number: number) => {
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(number);
    };

    const salesHistory = analytics?.salesHistory || [];
    const categoryDistribution = analytics?.categoryDistribution || [];
    const topVendors = analytics?.topVendors || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with AI Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Activity className="text-primary" />
                        {t('advancedAnalytics')}
                    </h2>
                    <p className="text-gray-400 mt-1 font-medium">{t('platformPerformance')}</p>
                </div>
                <Button
                    onClick={() => aiMutation.mutate(analytics)}
                    disabled={aiMutation.isPending}
                    className="bg-gradient-to-r -primary to-indigo-600 hover:-primary hover:to-indigo-700 text-white font-bold px-6 py-6 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 group"
                >
                    {aiMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    )}
                    {t('generateAiInsights')}
                </Button>
            </div>

            {/* AI Insights Panel */}
            <AnimatePresence>
                {aiInsights && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r -primary to-indigo-500 rounded-3xl blur opacity-25"></div>
                        <Card className="relative border-0 bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-gray-800">
                            <CardHeader className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-b border-white/10">
                                <CardTitle className="flex items-center gap-2 text-indigo-300">
                                    <Brain className="w-6 h-6 text-indigo-600" />
                                    {t('aiInsightsTitle')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-black text-lg text-white border-r-4 -primary pr-3">{t('executiveSummary')}</h4>
                                        <p className="text-gray-300 leading-relaxed font-bold text-right">
                                            {aiInsights.summary}
                                        </p>
                                        <div className="p-4 bg-indigo-900/30 rounded-21 border border-indigo-800 mt-4">
                                            <h5 className="text-indigo-300 font-black mb-2 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                {t('trendPrediction')}
                                            </h5>
                                            <p className="text-indigo-200 text-sm font-bold">{aiInsights.trendPrediction}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-black text-lg text-white border-r-4 border-indigo-500 pr-3">{t('strategicRecommendations')}</h4>
                                        <ul className="space-y-3">
                                            {(aiInsights.insights || []).map((insight: string, idx: number) => (
                                                <motion.li
                                                    key={idx}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex items-start gap-3 bg-gray-800 p-3 rounded-xl border border-gray-700"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-gray-700 shadow-sm flex items-center justify-center text-xs font-black text-gray-400 shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-gray-300 font-bold text-sm">{insight}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Sales Trend Chart */}
                <Card className="border-0 shadow-xl shadow-purple-900/5 rounded-3xl overflow-hidden bg-background border border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800">
                        <div>
                            <CardTitle className="text-xl font-black text-white">{t('salesGrowth')}</CardTitle>
                            <p className="text-sm text-gray-400 font-medium">{t('totalRevenueLast6Months')}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 -primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 h-[280px] sm:h-[350px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesHistory}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontWeight: 'bold' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontWeight: 'bold' }}
                                    tickFormatter={(value) => `${formatCompactNumber(value)} ${t('currency')}`}
                                    width={80}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', textAlign: 'right' }}
                                    cursor={{ stroke: '#e11d48', strokeWidth: 2 }}
                                    formatter={(value: number) => [`${value.toLocaleString()} ${t('currency')}`, t('revenue')]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#e11d48"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Distribution Chart */}
                <Card className="border-0 shadow-xl shadow-purple-900/5 rounded-3xl overflow-hidden bg-background border border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800">
                        <div>
                            <CardTitle className="text-xl font-black text-white">{t('categoryDistribution')}</CardTitle>
                            <p className="text-sm text-gray-400 font-medium">{t('productsPerCategory')}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 h-[280px] sm:h-[350px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', textAlign: 'right' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Vendors Performance Chart */}
                <Card className="border-0 shadow-xl shadow-purple-900/5 rounded-3xl overflow-hidden bg-background lg:col-span-2 border border-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800">
                        <div>
                            <CardTitle className="text-xl font-black text-white">{t('topPerformingStores')}</CardTitle>
                            <p className="text-sm text-gray-400 font-medium">{t('vendorsByRevenue')}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <Store className="w-6 h-6 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 h-[300px] sm:h-[400px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topVendors} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1f2937" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#f3f4f6', fontWeight: '900', fontSize: '14px' }}
                                    width={150}
                                />
                                <Tooltip
                                    cursor={{ fill: '#1f2937' }}
                                    contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', textAlign: 'right' }}
                                    formatter={(value: number) => [`${value.toLocaleString()} ${t('currency')}`, t('sales')]}
                                />
                                <Bar
                                    dataKey="revenue"
                                    radius={[0, 12, 12, 0]}
                                    barSize={40}
                                >
                                    {topVendors.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
