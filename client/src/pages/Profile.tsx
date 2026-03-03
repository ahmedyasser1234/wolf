import { useAuth } from "@/_core/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import api, { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    User, ShoppingBag, Heart, LogOut, Settings, Bell, ChevronLeft,
    Loader2, Eye, EyeOff, Plus, Camera, Store, MapPin,
    Share2, Truck, Image as ImageIcon, X, Package, Award, ChevronRight,
    Wallet, CreditCard, History
} from "lucide-react";
import { Link, useLocation } from "wouter";
import UserPointsView from "@/components/account/UserPointsView";

export default function Profile() {
    const { user, loading, logout } = useAuth();
    const { language, formatPrice, t } = useLanguage();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);


    const { data: orders } = useQuery({
        queryKey: ["orders"],
        queryFn: () => endpoints.orders.list(),
        enabled: !!user,
    });

    const { data: wishlist } = useQuery({
        queryKey: ["wishlist"],
        queryFn: () => endpoints.wishlist.list(),
        enabled: !!user,
    });

    const { data: unreadNotifications } = useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: () => endpoints.notifications.getUnreadCount(),
        enabled: !!user,
    });

    const { data: adminVendors } = useQuery({
        queryKey: ['admin', 'vendors', 'count'],
        queryFn: async () => (await api.get('/admin/vendors')).data,
        enabled: !!user && user.role === 'admin',
    });

    const { data: adminProducts } = useQuery({
        queryKey: ['admin', 'products', 'count'],
        queryFn: async () => (await api.get('/admin/products')).data,
        enabled: !!user && user.role === 'admin',
    });

    const { data: walletData, refetch: refetchWallet } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => endpoints.wallets.getMyWallet(),
        enabled: !!user,
    });

    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [redeemCode, setRedeemCode] = useState("");

    const redeemMutation = useMutation({
        mutationFn: (code: string) => endpoints.wallets.redeem(code),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم شحن الرصيد بنجاح" : "Balance topped up successfully");
            refetchWallet();
            setIsWalletModalOpen(false);
            setRedeemCode("");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || (language === 'ar' ? "كود غير صالح" : "Invalid code"));
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        setLocation("/login");
        return null;
    }

    const orderStatusTranslations: Record<string, string> = {
        pending: language === 'ar' ? "قيد الانتظار" : "Pending",
        confirmed: language === 'ar' ? "تم التأكيد" : "Confirmed",
        shipped: language === 'ar' ? "جاري الشحن" : "Shipped",
        delivered: language === 'ar' ? "تم التوصيل" : "Delivered",
        cancelled: language === 'ar' ? "ملغي" : "Cancelled",
    };

    const stats = user.role === 'admin' ? [
        { label: language === 'ar' ? "المتاجر" : "Vendors", value: adminVendors?.length || 0, icon: Store, color: "text-primary", bg: "bg-primary/10" },
        { label: language === 'ar' ? "المنتجات" : "Products", value: adminProducts?.length || 0, icon: Package, color: "text-primary", bg: "bg-white/5" },
        { label: language === 'ar' ? "التنبيهات" : "Notifications", value: unreadNotifications?.count || 0, icon: Bell, color: "text-primary", bg: "bg-primary/10" },
    ] : [
        { label: language === 'ar' ? "الطلبات" : "Orders", value: orders?.length || 0, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
        { label: language === 'ar' ? "المفضلة" : "Wishlist", value: wishlist?.length || 0, icon: Heart, color: "text-primary", bg: "bg-white/5" },
        { label: language === 'ar' ? "النقاط" : "Points", value: user.points || 0, icon: Award, color: "text-primary", bg: "bg-primary/10" },
        { label: language === 'ar' ? "التنبيهات" : "Notifications", value: unreadNotifications?.count || 0, icon: Bell, color: "text-primary", bg: "bg-primary/10" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className={`mb-12 flex flex-col md:flex-row items-center gap-8 ${language === 'ar' ? 'md:text-right text-center' : 'md:text-left text-center'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={60} className="text-gray-400" />
                            )}
                        </div>
                        <div
                            onClick={() => setIsEditModalOpen(true)}
                            className={`absolute -bottom-2 ${language === 'ar' ? '-right-2' : '-left-2'} w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-50 text-gray-400 hover:text-primary cursor-pointer transition-colors z-10`}
                        >
                            {user.role === 'admin' ? <Settings size={20} /> : <Camera size={20} />}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">{user.name}</h1>
                        <p className="text-gray-500 text-lg font-medium">{user.email}</p>
                        <div className={`mt-6 flex flex-wrap justify-center md:justify-start gap-3`}>
                            <Button
                                variant="outline"
                                className="rounded-full h-12 px-6 font-bold border-gray-200 hover:bg-gray-100 transition-all"
                                onClick={() => logout()}
                            >
                                <LogOut size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                {t('logout')}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-all cursor-default text-center md:text-start"
                        >
                            <div className="order-2 md:order-1 mt-3 md:mt-0">
                                <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-xl md:text-3xl font-black text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 md:w-14 md:h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center order-1 md:order-2`}>
                                <stat.icon size={24} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Wallet Balance Card - Only for Customers */}
                {user.role === 'customer' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-12"
                    >
                        <Card className="rounded-[2.5rem] bg-slate-900 border-0 shadow-2xl overflow-hidden group">
                            <CardContent className="p-8 relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Wallet size={120} className="text-white" />
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="text-center md:text-start">
                                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mb-3">
                                            {language === 'ar' ? "رصيد المحفظة المتاح" : "Available Wallet Balance"}
                                        </p>
                                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                            {formatPrice(walletData?.wallet?.balance || 0)}
                                        </h2>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                        <Button
                                            onClick={() => setIsWalletModalOpen(true)}
                                            className="bg-white hover:bg-slate-100 text-slate-900 rounded-full h-14 px-8 font-black shadow-xl transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Plus size={20} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                                            {language === 'ar' ? "شحن الرصيد" : "Top Up Balance"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Sections */}
                <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Admin Workspace - Only for Admins */}
                    {user.role === 'admin' && (
                        <section>
                            <div className="flex items-center justify-between mb-6 px-4">
                                <h2 className="text-2xl font-black text-gray-900">{t('adminDashboard')}</h2>
                            </div>
                            <Card className="rounded-[2.5rem] border-0 shadow-sm overflow-hidden">
                                <CardContent className="p-8">
                                    <div className="text-center space-y-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                                            <Settings size={40} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 mb-2">
                                                {language === 'ar' ? "مرحباً بك في لوحة التحكم" : "Welcome to Admin Dashboard"}
                                            </h3>
                                            <p className="text-gray-500 font-medium">
                                                {language === 'ar' ? "إدارة المنتجات، الطلبات والمزيد" : "Manage products, orders and more"}
                                            </p>
                                        </div>
                                        <Link href="/admin-dashboard">
                                            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20">
                                                {language === 'ar' ? "الذهاب للوحة التحكم" : "Go to Admin Dashboard"}
                                                <ChevronLeft size={18} className={`${language === 'ar' ? 'mr-2' : 'ml-2'} ${language === 'en' ? 'rotate-180' : ''}`} />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    {/* Recent Orders Preview - Only for Non-Admins */}
                    {user.role !== 'admin' && (
                        <section>
                            <Link href="/orders">
                                <Button variant="link" className="text-primary font-black flex items-center gap-2">
                                    {language === 'ar' ? "عرض الكل" : "View All"}
                                    <ChevronLeft size={16} className={language === 'en' ? 'rotate-180' : ''} />
                                </Button>
                            </Link>
                            <Card className="rounded-[2.5rem] border-0 shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    {(!orders || orders.length === 0) ? (
                                        <div className="p-12 text-center text-gray-400 font-bold">
                                            {language === 'ar' ? "لا توجد طلبات سابقة" : "No previous orders"}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {orders.slice(0, 3).map((order: any) => {
                                                const statusKey = order.status?.toLowerCase();
                                                const translatedStatus = orderStatusTranslations[statusKey] || order.status;
                                                const statusColors: Record<string, string> = {
                                                    pending: "bg-amber-100 text-amber-600",
                                                    confirmed: "bg-green-100 text-green-600",
                                                    shipped: "bg-blue-100 text-blue-600",
                                                    delivered: "bg-purple-100 text-purple-600",
                                                    cancelled: "bg-white/5 text-primary",
                                                };

                                                return (
                                                    <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                        <div>
                                                            <p className="font-black text-gray-900">#{order.id}</p>
                                                            <p className="text-sm text-gray-500 font-bold">{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                                        </div>
                                                        <div className="text-left text-end">
                                                            <p className="font-black text-primary">{formatPrice(order.total)}</p>
                                                            <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[statusKey] || 'bg-gray-100 text-gray-600'}`}>
                                                                {translatedStatus}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    {/* Reward Points Section - Only for Customers */}
                    {user.role === 'customer' && (
                        <section>
                            <UserPointsView />
                        </section>
                    )}

                    {/* Quick Settings */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-6 px-4">{t('settings')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-white/5 hover:shadow-md transition-all h-24"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 text-primary rounded-2xl flex items-center justify-center">
                                        <User size={20} />
                                    </div>
                                    <div className="text-start">
                                        <p className="font-black text-gray-900 leading-none mb-1">{t('personalInfo')}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('updateNameEmail')}</p>
                                    </div>
                                </div>
                                <ChevronLeft size={16} className={`text-gray-300 group-hover:text-primary transition-all ${language === 'en' ? 'rotate-180' : ''}`} />
                            </div>
                            <div
                                onClick={() => setLocation("/notifications")}
                                className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-white/5 hover:shadow-md transition-all h-24"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <Bell size={20} />
                                    </div>
                                    <div className="text-start">
                                        <p className="font-black text-gray-900 leading-none mb-1">{language === 'ar' ? "تنبيهات النظام" : "System Notifications"}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{language === 'ar' ? "إدارة الإشعارات" : "Manage notifications"}</p>
                                    </div>
                                </div>
                                <ChevronLeft size={16} className={`text-gray-300 group-hover:text-primary transition-all ${language === 'en' ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {isEditModalOpen && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    user={user}
                    language={language}
                    queryClient={queryClient}
                />
            )}

            {/* Wallet Redemption Modal */}
            <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
                <DialogContent className="rounded-[2rem] bg-white border-0 shadow-2xl p-8 max-w-md w-[95vw]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader className="text-start mb-6">
                        <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <CreditCard size={20} />
                            </div>
                            {language === 'ar' ? "شحن رصيد المحفظة" : "Top Up Wallet Balance"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2 text-start">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                                {language === 'ar' ? "أدخل كود الجيفت كارد" : "Enter Gift Card Code"}
                            </label>
                            <Input
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                                placeholder="XXXX-XXXX-XXXX"
                                className="h-14 rounded-2xl bg-gray-50 border-0 font-black text-lg tracking-widest placeholder:tracking-normal placeholder:font-bold focus:ring-2 focus:ring-primary uppercase px-6"
                            />
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                {language === 'ar'
                                    ? "سيتم إضافة قيمة الكود مباشرة إلى رصيد حسابك المتاح للاستخدام في جميع المشتريات."
                                    : "The code value will be added directly to your account balance, available for all future purchases."}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsWalletModalOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-black text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={() => redeemMutation.mutate(redeemCode)}
                                disabled={!redeemCode || redeemMutation.isPending}
                                className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                {redeemMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : (language === 'ar' ? "شحن الآن" : "Top Up Now")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function EditProfileModal({ isOpen, onClose, user, language, queryClient }: any) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState("personal");

    // User State
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

    const fileInputRefs = {
        avatar: useRef<HTMLInputElement>(null),
    };


    const updateProfileMutation = useMutation({
        mutationFn: async ({ userData }: any) => {
            if (userData) {
                await endpoints.auth.updateProfile(userData);
            }
        },
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم تحديث البيانات بنجاح" : "Information updated successfully");
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || (language === 'ar' ? "فشل التحديث" : "Update failed"));
        }
    });

    const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'avatar') setAvatarFile(file);

        if (type === 'avatar') {
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const userFormData = new FormData();
        userFormData.append('name', name);
        userFormData.append('email', email);
        if (password) userFormData.append('password', password);
        if (avatarFile) userFormData.append('avatar', avatarFile);

        updateProfileMutation.mutate({ userData: userFormData });
    };

    const tabs = [
        { id: "personal", label: t('personalInfo'), icon: User },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-6xl w-[95vw] md:w-full bg-white rounded-[2.5rem] overflow-hidden p-0 h-[85vh] flex flex-col border-0 shadow-2xl"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                showCloseButton={false}
            >
                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className={`w-full md:w-80 bg-gray-50/50 p-8 border-e border-gray-100 overflow-y-auto`}>
                        <DialogHeader className="mb-10 text-start">
                            <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                                {language === 'ar' ? "إعدادات الحساب" : "Account Settings"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black transition-all text-start group ${activeTab === tab.id
                                        ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                        : "text-gray-500 hover:bg-white hover:text-gray-900"
                                        }`}
                                >
                                    <tab.icon size={22} className={`${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-primary'} transition-colors`} />
                                    <span className="text-lg">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-12 bg-white scrollbar-hide">
                        <form id="profile-form" onSubmit={handleSubmit} className="space-y-10 max-w-4xl mx-auto">
                            <AnimatePresence mode="wait">
                                {/* Personal Information Tab */}
                                {activeTab === "personal" && (
                                    <motion.div
                                        key="personal"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col items-center gap-6 mb-10">
                                            <div
                                                onClick={() => fileInputRefs.avatar.current?.click()}
                                                className="relative w-36 h-36 rounded-[3.5rem] bg-gray-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-500"
                                            >
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <Camera size={44} className="text-gray-300 group-hover:text-primary/80" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                    <Plus size={36} />
                                                </div>
                                            </div>
                                            <input type="file" ref={fileInputRefs.avatar} onChange={(e) => handleFileChange('avatar', e)} accept="image/*" className="hidden" />
                                            <div className="text-center">
                                                <p className="text-base font-black text-gray-900 mb-1">{language === 'ar' ? "تغيير الصورة الشخصية" : "Change Profile Picture"}</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{language === 'ar' ? "يفضل صورة مربعة 500x500" : "Square image 500x500 recommended"}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                                            <div className="text-start space-y-2">
                                                <label className="text-xs font-black text-gray-700 px-1 uppercase tracking-wider">{language === 'ar' ? "الاسم الكامل" : "Full Name"}</label>
                                                <Input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 border-0 rounded-2xl h-14 px-6 font-bold focus:ring-2 focus:ring-primary transition-all text-gray-900" required />
                                            </div>
                                            <div className="text-start space-y-2">
                                                <label className="text-xs font-black text-gray-700 px-1 uppercase tracking-wider">{language === 'ar' ? "البريد الإلكتروني" : "Email Address"}</label>
                                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-0 rounded-2xl h-14 px-6 font-bold focus:ring-2 focus:ring-primary transition-all text-gray-900" required dir="ltr" />
                                            </div>
                                            <div className="text-start md:col-span-2 space-y-2">
                                                <label className="text-xs font-black text-gray-700 px-1 uppercase tracking-wider">{language === 'ar' ? "كلمة المرور الجديدة" : "New Password"}</label>
                                                <div className="relative">
                                                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-gray-50 border-0 rounded-2xl h-14 px-6 font-bold focus:ring-2 focus:ring-primary transition-all text-gray-900" dir="ltr" />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-2">
                                                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold px-2 uppercase tracking-wide">{language === 'ar' ? "اتركه فارغاً للحفاظ على كلمة المرور الحالية" : "Leave blank to keep current password"}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="p-8 border-t border-gray-50 bg-gray-50/40 flex-shrink-0">
                    <div className="flex w-full gap-5 max-w-4xl mx-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 rounded-[2rem] h-16 font-black text-gray-400 hover:bg-white transition-all border border-transparent hover:border-gray-200 text-lg"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            form="profile-form"
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-[2rem] h-16 font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg"
                        >
                            {updateProfileMutation.isPending ? (
                                <Loader2 className="animate-spin w-7 h-7" />
                            ) : (
                                <>
                                    <span>{t('saveChanges')}</span>
                                    <ChevronLeft size={24} className={`hidden md:block ${language === 'en' ? 'rotate-180' : ''}`} />
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>

                {/* Enhanced Custom Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-6 ${language === 'ar' ? 'left-6' : 'right-6'} w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl shadow-xl shadow-gray-200/50 flex items-center justify-center text-gray-400 hover:text-primary transition-all z-50 group border border-gray-100/50 active:scale-90`}
                    aria-label="Close"
                >
                    <X size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </DialogContent>
        </Dialog>
    );
}
