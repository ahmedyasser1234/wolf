import { useAuth } from "@/_core/hooks/useAuth";
// import { useSocket } from "@/_core/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { endpoints } from "@/lib/api";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Download,
  Upload,
  Edit,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  MoreVertical,
  Package,
  Pause,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Ticket,
  Gift,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useChat } from "@/contexts/ChatContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
// Removed rogue code block
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import AdminAnalyticsTab from "@/components/dashboard/AdminAnalyticsTab";
import ContentTab from "@/components/dashboard/ContentTab";
import AdminCategoriesTab from "@/components/dashboard/AdminCategoriesTab";
import AdminCollectionsTab from "@/components/dashboard/AdminCollectionsTab";
import AdminOffersTab from "@/components/dashboard/AdminOffersTab";
import AdminCouponsTab from "@/components/dashboard/AdminCouponsTab";
import AdminGiftCardsTab from "@/components/dashboard/AdminGiftCardsTab";
import AdminInstallmentsTab from "@/components/dashboard/AdminInstallmentsTab";
import InstallmentOrdersTab from "@/components/dashboard/InstallmentOrdersTab";
import ProductsTab from "@/components/dashboard/ProductsTab";
import AdminPaymentGatewaysTab from "@/components/dashboard/AdminPaymentGatewaysTab";
import { useLanguage } from "@/lib/i18n";
import AdminSearchModal from "@/components/admin/AdminSearchModal";


interface CardHeaderProps {
  children: React.ReactNode;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader = ({ children }: CardHeaderProps) => (
  <div className="border-b border-gray-200 px-6 py-4">{children}</div>
);

const CardTitle = ({ children, className }: CardTitleProps) => (
  <h3 className={`text-lg font-semibold text-white ${className || ""}`}>{children}</h3>
);

function SettingsTab() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: () => endpoints.auth.getProfile(),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setAvatarPreview(profile.avatar || null);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (formData: FormData) => endpoints.auth.updateProfile(formData),
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (language === 'ar' ? "فشل التحديث" : "Update failed"));
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password) formData.append('password', password);
    if (avatarFile) formData.append('avatar', avatarFile);

    updateProfile.mutate(formData);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-purple-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-0 shadow-sm overflow-hidden text-start bg-background border border-gray-800 rounded-[1.5rem] md:rounded-[2rem]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader>
          <CardTitle>{language === 'ar' ? "إعدادات الحساب" : "Account Settings"}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-[1.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-purple-300 transition-all"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-gray-300 group-hover:text-purple-400" />
                )}
                <div className="absolute inset-0 bg-black/40 items-center justify-center hidden group-hover:flex text-white transition-all">
                  <Plus size={24} />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-white font-bold">
                {language === 'ar' ? "تغيير الصورة الشخصية" : "Change Profile Picture"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-start">
                <label className="block text-sm font-semibold text-white mb-2">
                  {language === 'ar' ? "الاسم" : "Name"}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? "ادخل اسمك" : "Enter your name"}
                  className="w-full text-base"
                  required
                />
              </div>

              <div className="text-start">
                <label className="block text-sm font-semibold text-white mb-2">
                  {language === 'ar' ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@fustan.com"
                  className="w-full text-left text-base"
                  required
                />
              </div>

              <div className="text-start">
                <label className="block text-sm font-semibold text-white mb-2">
                  {language === 'ar' ? "كلمة المرور الجديدة (اختياري)" : "New Password (Optional)"}
                </label>
                <div className="relative">
                  <Input
                    type={showProfilePassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-left pr-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white px-2"
                  >
                    {showProfilePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-white mt-1">
                  {language === 'ar' ? "اتركه فارغاً للحفاظ على كلمة المرور الحالية" : "Leave blank to keep current password"}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {updateProfile.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>{t('saving')}</span>
                </div>
              ) : (
                language === 'ar' ? "حفظ التغييرات" : "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const { unreadCount } = useChatNotifications();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // MOVED STATE TO TOP FOR DEBUGGING
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [detailsCustomerId, setDetailsCustomerId] = useState<number | null>(null);

  const [activeTab, setActiveTabInternal] = useState<"overview" | "analytics" | "products" | "categories" | "collections" | "offers" | "coupons" | "giftcards" | "installments" | "installment-orders" | "payments" | "orders" | "customers" | "chat" | "content" | "settings">(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("tab") as any) || "overview";
  });

  const [exportingCustomers, setExportingCustomers] = useState(false);
  const [importingCustomers, setImportingCustomers] = useState(false);

  const handleExportCustomers = async () => {
    setExportingCustomers(true);
    try {
      const blob = await endpoints.admin.exportCustomers();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
    } catch (error) {
      console.error(error);
      toast.error(language === 'ar' ? 'فشل تصدير البيانات' : 'Failed to export data');
    } finally {
      setExportingCustomers(false);
    }
  };

  const handleImportCustomers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCustomers(true);
    try {
      await endpoints.admin.importCustomers(file);
      toast.success(language === 'ar' ? 'تم استيراد البيانات بنجاح' : 'Data imported successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    } catch (error) {
      console.error(error);
      toast.error(language === 'ar' ? 'فشل استيراد البيانات' : 'Failed to import data');
    } finally {
      setImportingCustomers(false);
      if (e.target) e.target.value = '';
    }
  };

  // These must be defined before `tabs` useMemo since tabs references pendingInstallmentReviews
  const { data: adminOrders } = useQuery({
    queryKey: ['admin-orders-full'],
    queryFn: async () => (await api.get('/admin/orders')).data,
  });

  // Count pending installment KYC reviews for badge
  const pendingInstallmentReviews = (adminOrders || []).filter(
    (o: any) => o.installmentPlanId && o.paymentStatus === 'pending_kyc_review'
  ).length;

  /* Define tabs with distinct gradient colors */
  const tabs = useMemo<{ id: string; label: string; icon: any; color?: string; badge?: number }[]>(() => [
    { id: "overview", label: t('overview'), icon: LayoutDashboard, color: "from-purple-600 to-pink-600 shadow-purple-500/30" },
    { id: "analytics", label: t('analytics'), icon: BarChart3, color: "from-emerald-400 to-teal-600 shadow-emerald-500/30" },
    { id: "content", label: t('contentManagement'), icon: Edit, color: "-primary to-red-600 -primary/30" },
    { id: "products", label: t('products'), icon: Package, color: "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30" },
    { id: "categories", label: t('categories'), icon: Layers, color: "from-teal-400 to-emerald-600 shadow-teal-500/30" },
    { id: "collections", label: language === 'ar' ? 'المجموعات' : 'Collections', icon: List, color: "from-blue-400 to-indigo-600 shadow-blue-500/30" },
    { id: "offers", label: language === 'ar' ? 'العروض' : 'Offers', icon: TrendingUp, color: "from-pink-400 to-rose-600 shadow-pink-500/30" },
    { id: "coupons", label: language === 'ar' ? 'الكوبونات' : 'Coupons', icon: Ticket, color: "from-amber-400 to-orange-600 shadow-amber-500/30" },
    { id: "giftcards", label: language === 'ar' ? 'الجيفت كارد' : 'Gift Cards', icon: Gift, color: "from-emerald-400 to-teal-600 shadow-emerald-500/30" },
    { id: "installments", label: language === 'ar' ? 'التقسيط' : 'Installments', icon: CreditCard, color: "from-violet-400 to-purple-600 shadow-violet-500/30" },
    { id: "installment-orders", label: language === 'ar' ? 'طلبات التقسيط' : 'Installment Orders', icon: ShoppingCart, badge: pendingInstallmentReviews || undefined, color: "from-amber-400 to-orange-500 shadow-amber-500/30" },
    { id: "payments", label: language === 'ar' ? 'بوابات الدفع' : 'Payment Gateways', icon: DollarSign, color: "from-emerald-400 to-teal-600 shadow-emerald-500/30" },
    { id: "orders", label: t('orders'), icon: ShoppingCart, color: "from-orange-500 to-red-600 shadow-orange-500/30" },
    { id: "customers", label: t('customers'), icon: Users, color: "from-sky-500 to-blue-600 shadow-sky-500/30" },
    { id: "chat", label: t('chat'), icon: MessageSquare, badge: unreadCount, color: "from-pink-500 -primary shadow-pink-500/30" },
    { id: "settings", label: t('settings'), icon: Settings, color: "from-slate-700 to-slate-900 shadow-slate-500/30" },
  ], [t, unreadCount, language]);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabInternal(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    setLocation(window.location.pathname + "?" + params.toString());
  };

  const [autoOpenAddCategory, setAutoOpenAddCategory] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as any;
    if (tab && tab !== activeTab) {
      setActiveTabInternal(tab);
    }
  }, [window.location.search]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    title: "",
    description: "",
    onConfirm: () => { },
  });

  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmConfig({ title, description, onConfirm });
    setConfirmOpen(true);
  };
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isAdminOrderModalOpen, setIsAdminOrderModalOpen] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Fetch customer details when detailsCustomerId changes
  const { data: fetchedCustomerDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin', 'customer', detailsCustomerId],
    queryFn: async () => {
      if (!detailsCustomerId) return null;
      return await api.get(`/admin/customers/${detailsCustomerId}`).then(res => res.data);
    },
    enabled: !!detailsCustomerId
  });

  // Sync fetched details to local state
  useEffect(() => {
    if (fetchedCustomerDetails) {
      setCustomerDetails(fetchedCustomerDetails);
    }
  }, [fetchedCustomerDetails]);

  // Delete Product Mutation for AdminDashboard
  const deleteProduct = useMutation({
    mutationFn: (id: number) => endpoints.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('productDeleted') || 'Product deleted successfully');
    },
    onError: () => {
      toast.error(t('errorDeleting') || 'Error deleting product');
    }
  });




  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await api.delete(`/admin/customers/${customerToDelete.id}`);
      toast.success('Customer deleted successfully');
      setDeleteCustomerOpen(false);
      setCustomerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete customer');
    }
  };

  const { openChat, isUserOnline, socket, checkOnlineStatus } = useChat(); // Use global chat context



  const openAdminChat = (target: { recipientId: number, name: string, logo?: string }) => {
    openChat({
      recipientId: target.recipientId,
      name: target.name,
      logo: target.logo,
      sessionId: `customer-${target.recipientId}`
    });
  };


  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'products', productSearch],
    queryFn: async () => (await api.get('/admin/products', { params: { search: productSearch } })).data,
  });

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);



  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await endpoints.categories.list()),
  });

  // adminOrders and pendingInstallmentReviews are now declared before the tabs useMemo (above)

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: async () => (await api.get('/admin/customers')).data,
  });

  const { data: adminConversations } = useQuery({
    queryKey: ['admin', 'conversations'],
    queryFn: async () => (await api.get('/admin/conversations')).data,
  });

  const { data: vendorProfile } = useQuery({
    queryKey: ['admin', 'vendor-profile'],
    queryFn: () => endpoints.vendors.getDashboard(),
    enabled: !!user,
  });



  // Socket logic moved to ChatContext
  // const socket = useSocket();
  // const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  const totalRevenue = adminOrders
    ?.filter((o: any) => o.paymentStatus === 'paid')
    .reduce((sum: number, order: any) => sum + Number(order.total), 0) || 0;




  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }


  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('mustBeAdmin')}
          </h1>
          <Link href="/">
            <Button>{t('returnHome')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Desktop Navbar */}
      <header className="h-20 bg-background border-b border-gray-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black text-white">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h1>

          {/* Command + K Search Trigger */}
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: true,
                bubbles: true
              });
              document.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-all group"
          >
            <Search size={16} className="text-white group-hover:text-white transition-colors" />
            <span className="text-sm font-bold text-white group-hover:text-white transition-colors">
              {language === 'ar' ? "بحث سريع..." : "Quick search..."}
            </span>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] font-black text-white">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] font-black text-white">K</kbd>
            </div>
          </button>
        </div>
        <Link href="/">
          <Button variant="outline" className="rounded-xl border-gray-800 font-bold bg-gray-900 text-white hover:bg-gray-800">
            <span className="hidden sm:inline">{language === 'ar' ? "العودة للمتجر" : "Return to Store"}</span>
            <ArrowRight className={`mr-0 sm:mr-2 h-4 w-4 ${language === 'en' ? 'rotate-180' : ''}`} />
          </Button>
        </Link>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-background border-b border-gray-800 relative">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group h-11 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2.5 transition-all duration-300 relative overflow-hidden whitespace-nowrap min-w-fit shadow-sm ${activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105 z-10`
                  : "bg-gray-800 text-white hover:bg-gray-700 hover:text-white border border-transparent hover:border-gray-600 hover:shadow-md"
                  }`}
              >
                <tab.icon className={`w-4 h-4 md:w-5 md:h-5 relative z-10 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
                {tab.badge ? (
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-600 text-white text-[10px] md:text-xs font-black rounded-full flex items-center justify-center animate-bounce shadow-md z-20 border-2 border-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm border-r-4 border-r-blue-500 rounded-3xl bg-background border border-gray-800 h-full">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <header className="h-4 md:h-6 flex items-center">
                        <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest opacity-70">{t('totalCustomers')}</p>
                      </header>
                      <p className="text-2xl md:text-3xl font-black text-white">{customers?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-900/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm border-r-4 border-r-yellow-500 bg-background border border-gray-800 h-full">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest opacity-70">{t('totalProducts')}</p>
                      <p className="text-2xl md:text-3xl font-black text-white">{products?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-900/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm border-r-4 border-primary/20 bg-background border border-gray-800 h-full">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest opacity-70">{t('paidOrders')}</p>
                      <p className="text-2xl md:text-3xl font-black text-white">{adminOrders?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm border-r-4 border-r-emerald-500 bg-background border border-gray-800 h-full">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs text-emerald-400 font-black uppercase tracking-widest">{t('totalRevenue')}</p>
                      <p className="text-xl md:text-2xl font-black text-white">{totalRevenue.toFixed(2)} {t('currency')}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <TrendingUp size={10} />
                        <span>{t('fromPaidOrders')}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm bg-background border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">{t('systemStatus')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">{t('dbServer')}</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">{t('emailServer')}</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">{t('paymentService')}</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">{t('storageService')}</span>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-background border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">{t('quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 justify-start"
                    onClick={() => {
                      setActiveTab("categories");
                      setAutoOpenAddCategory(true);
                    }}
                  >
                    {t('addCategory')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
        }

        {/* Analytics Tab */}
        {activeTab === "analytics" && <AdminAnalyticsTab />}

        {/* Content Tab */}
        {activeTab === "content" && <ContentTab />}

        {/* Categories Tab */}
        {
          activeTab === "categories" && (
            <AdminCategoriesTab
              showConfirm={showConfirm}
              initialAddOpen={autoOpenAddCategory}
              onModalClose={() => setAutoOpenAddCategory(false)}
            />
          )
        }

        {/* Collections Tab */}
        {
          activeTab === "collections" && (
            <AdminCollectionsTab
              showConfirm={showConfirm}
            />
          )
        }

        {/* Offers Tab */}
        {
          activeTab === "offers" && (
            <AdminOffersTab showConfirm={showConfirm} />
          )
        }

        {/* Coupons Tab */}
        {
          activeTab === "coupons" && (
            <AdminCouponsTab showConfirm={showConfirm} />
          )
        }

        {/* Gift Cards Tab */}
        {
          activeTab === "giftcards" && (
            <AdminGiftCardsTab showConfirm={showConfirm} />
          )
        }

        {/* Installments Plans Tab */}
        {
          activeTab === "installments" && (
            <AdminInstallmentsTab showConfirm={showConfirm} />
          )
        }

        {/* Installment Orders Review Tab */}
        {
          activeTab === "installment-orders" && (
            <InstallmentOrdersTab />
          )
        }

        {/* Settings Tab */}
        {activeTab === "settings" && <SettingsTab />}

        {/* Products Tab - Full featured with add/edit modals */}
        {
          activeTab === "products" && (
            <div>
              <ProductsTab
                onProductClick={(id) => setLocation(`/products/${id}`)}
                onPreview={(id) => window.open(`/products/${id}`, '_blank')}
                showConfirm={(title, desc, onConfirm) => {
                  setConfirmConfig({ title, description: desc, onConfirm });
                  setConfirmOpen(true);
                }}
              />
            </div>
          )
        }
        {/* Orders Tab */}
        {
          activeTab === "orders" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-orange-400" />
                </div>
                {t('orders')}
              </h2>

              <Card className="border border-gray-800 rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                <CardContent className="p-0">
                  {/* Mobile Order Cards */}
                  <div className="md:hidden space-y-4 p-4">
                    {adminOrders?.map((order: any) => (
                      <Card key={order.id} className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-gray-900">#{order.orderNumber}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                  {order.status === 'delivered' ? t('delivered') : t('processing')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 font-medium">
                                {order.customerName || `${t('customer')} #${order.customerId}`}
                              </p>
                            </div>
                            <span className="font-black text-purple-600 text-lg">
                              {Number(order.total).toFixed(2)} {t('currency')}
                            </span>
                          </div>

                          <Button
                            className="w-full bg-slate-900 text-white hover:bg-slate-800 h-9 text-xs font-bold rounded-xl"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsAdminOrderModalOpen(true);
                            }}
                          >
                            {t('viewDetails')}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto text-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-900">
                          <th className="py-4 px-6 font-black text-white text-start">{t('orderNumber')}</th>
                          <th className="py-4 px-6 font-black text-white text-start">{t('customer')}</th>
                          <th className="py-4 px-6 font-black text-white text-center">{t('amount')}</th>
                          <th className="py-4 px-6 font-black text-white text-center">{language === 'ar' ? 'وسيلة الدفع' : 'Payment Method'}</th>
                          <th className="py-4 px-6 font-black text-white text-center">{language === 'ar' ? 'حالة الدفع' : 'Payment Status'}</th>
                          <th className="py-4 px-6 font-black text-white text-center">{t('deliveryStatus')}</th>
                          <th className="py-4 px-6 font-black text-white text-end">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOrders?.map((order: any) => (
                          <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-white text-start">{order.orderNumber}</td>
                            <td className="py-4 px-6 text-white font-medium text-start">{order.customer?.name || order.shippingAddress?.name || `${t('customer')} #${order.customerId}`}</td>
                            <td className="py-4 px-6 font-black text-white text-center">{Number(order.total).toFixed(2)} {t('currency')}</td>
                            <td className="py-4 px-6 text-center">
                              <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-700">
                                {order.paymentMethod === 'cod' || order.paymentMethod === 'cashOnDelivery' ? (language === 'ar' ? 'دفع عند الاستلام' : 'COD') :
                                  order.paymentMethod === 'installments' ? (language === 'ar' ? 'تقسيط' : 'Installments') :
                                    order.paymentMethod === 'wallet' ? (language === 'ar' ? 'محفظة' : 'Wallet') : (language === 'ar' ? 'بطاقة' : 'Card')}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.paymentStatus === 'paid' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
                                order.paymentStatus === 'failed' ? 'bg-red-900/40 text-red-400 border-red-800/50' :
                                  order.paymentStatus === 'pending_kyc_review' ? 'bg-amber-900/40 text-amber-500 border-amber-800/50' :
                                    'bg-blue-900/40 text-blue-400 border-blue-800/50'
                                }`}>
                                {order.paymentStatus === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') :
                                  order.paymentStatus === 'pending_kyc_review' ? (language === 'ar' ? 'مراجعة أوراق' : 'Reviewing') :
                                    order.paymentStatus === 'pending_payment' ? (language === 'ar' ? 'بانتظار المقدم' : 'Awaiting Downpayment') :
                                      (language === 'ar' ? 'معلق' : 'Pending')}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.status === 'delivered' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
                                order.status === 'cancelled' ? 'bg-red-900/40 text-red-400 border-red-800/50' :
                                  'bg-blue-900/40 text-blue-400 border-blue-800/50'
                                }`}>
                                {order.status === 'delivered' ? t('delivered') :
                                  order.status === 'cancelled' ? (language === 'ar' ? 'ملغى' : 'Cancelled') :
                                    t('processing')}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-400 font-bold hover:bg-purple-900/30"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsAdminOrderModalOpen(true);
                                }}
                              >
                                {t('viewDetails')}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }

        {/* Customers Tab */}
        {
          activeTab === "customers" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
                {t('manageCustomers')}
              </h2>

              <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/50">
                    <div className="flex flex-wrap items-center gap-3 order-2 md:order-1">
                      <Button
                        variant="outline"
                        onClick={handleExportCustomers}
                        disabled={exportingCustomers}
                        className="h-10 px-4 rounded-xl border-gray-800 bg-gray-900 text-white hover:bg-gray-800 font-bold shadow-lg flex items-center gap-2"
                      >
                        {exportingCustomers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="text-xs">{language === 'ar' ? 'تصدير Excel' : 'Export Excel'}</span>
                      </Button>

                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          id="import-customers-admin"
                          className="hidden"
                          onChange={handleImportCustomers}
                        />
                        <Button
                          variant="outline"
                          asChild
                          disabled={importingCustomers}
                          className="h-10 px-4 rounded-xl border-gray-800 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer font-bold shadow-lg flex items-center gap-2"
                        >
                          <label htmlFor="import-customers-admin" className="flex items-center gap-2">
                            {importingCustomers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span className="text-xs">{language === 'ar' ? 'استيراد Excel' : 'Import Excel'}</span>
                          </label>
                        </Button>
                      </div>
                    </div>

                    <div className="relative w-full md:w-72 text-start order-1 md:order-2">
                      <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-white`} />
                      <Input
                        placeholder={t('searchCustomerAdmin')}
                        className={`rounded-xl border-gray-800 bg-gray-900 text-white placeholder:text-gray-500 focus:ring-purple-500 h-10 md:h-11 font-bold ${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Mobile Customer Cards */}
                  <div className="md:hidden space-y-4 p-4">
                    {customers?.filter((c: any) =>
                      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      (c.phone && c.phone.includes(customerSearch))
                    ).map((c: any) => (
                      <Card key={c.id}
                        className="border border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-gray-900/50"
                        onClick={() => { setDetailsCustomerId(c.id); setCustomerDetailsOpen(true); }}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-black text-xs uppercase shadow-sm border border-gray-700">
                                {(c.name || 'C').substring(0, 2)}
                              </div>
                              {isUserOnline(c.id) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white truncate">{c.name || t('customerUnknown')}</h4>
                              <p className="text-xs text-gray-500 truncate">{c.email}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <div className="text-gray-400">
                              <p>{t('mobileNumber')}: {c.phone || '-'}</p>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-white hover:text-purple-400 hover:bg-purple-900/30 rounded-lg"
                                onClick={() => {
                                  openAdminChat({
                                    recipientId: c.id,
                                    name: c.name || t('customer'),
                                    logo: c.avatar
                                  });
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto text-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-900">
                          <th className="py-4 px-6 font-black text-white text-start">{t('customer')}</th>
                          <th className="py-4 px-6 font-black text-white text-start">{t('emailContact')}</th>
                          <th className="py-4 px-6 font-black text-white text-center">{t('lastSeen')}</th>
                          <th className="py-4 px-6 font-black text-white text-center">{t('mobileNumber')}</th>
                          <th className="py-4 px-6 font-black text-white text-end">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              <td className="py-4 px-6"><div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                              <td className="py-4 px-6"><Skeleton className="h-4 w-40" /></td>
                              <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                              <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                              <td className="py-4 px-6 justify-end flex gap-2"><Skeleton className="h-8 w-8 rounded-lg" /></td>
                            </tr>
                          ))
                        ) : (
                          customers?.filter((c: any) =>
                            c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            (c.phone && c.phone.includes(customerSearch))
                          ).map((c: any) => (
                            <tr key={c.id}
                              className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                              onClick={() => { setDetailsCustomerId(c.id); setCustomerDetailsOpen(true); }}
                            >
                              <td className="py-4 px-6 font-bold text-white text-start">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm border border-gray-700">
                                      {(c.name || 'C').substring(0, 2)}
                                    </div>
                                    {isUserOnline(c.id) && (
                                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                                    )}
                                  </div>
                                  <span>{c.name || t('customerUnknown')}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-white text-start">{c.email}</td>
                              <td className="py-4 px-6 text-white text-xs text-center">{c.lastSignedIn ? new Date(c.lastSignedIn).toLocaleDateString() : t('never')}</td>
                              <td className="py-4 px-6 text-white text-center">{c.phone || '-'}</td>
                              <td className="py-4 px-6 text-end">
                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:text-purple-400 hover:bg-purple-900/30 rounded-lg"
                                    onClick={() => {
                                      openAdminChat({
                                        recipientId: c.id,
                                        name: c.name || t('customer'),
                                        logo: c.avatar
                                      });
                                    }}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>

                                  {user?.email === 'admin@fustan.com' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-400 hover:text-red-500 hover:bg-red-900/30 rounded-lg"
                                      onClick={() => {
                                        setCustomerToDelete(c);
                                        setDeleteCustomerOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }

        {/* Chat Tab */}
        {
          activeTab === "chat" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                {t('manageConversations')}
              </h2>

              <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-300">{t('activeConversationsDesc')}</p>
                  <span className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 text-white text-xs font-black">
                    {adminConversations?.length || 0} {t('conversationCount')}
                  </span>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-800">
                    {adminConversations?.map((conv: any) => (
                      <div key={conv.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-3 rtl:space-x-reverse">
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-blue-50 overflow-hidden">
                              {conv.customerAvatar ? <img src={conv.customerAvatar} alt="" className="w-full h-full object-cover" /> : (conv.customerName || 'C').substring(0, 1)}
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs ring-2 ring-purple-50 overflow-hidden">
                              {conv.storeLogo ? <img src={conv.storeLogo} alt="" className="w-full h-full object-cover" /> : (conv.storeNameAr || conv.storeNameEn || 'S').substring(0, 1)}
                            </div>
                          </div>
                          <div className="text-right" dir="rtl">
                            <h4 className="font-bold text-white text-sm">
                              {conv.customerName || t('customer')} <span className="text-white font-normal mx-1">{t('with')}</span> {conv.storeNameAr || conv.storeNameEn || t('vendor')}
                            </h4>
                            <p className="text-xs text-white mt-1">
                              {conv.lastMessage ? conv.lastMessage.substring(0, 50) : t('noMessages')}...
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white font-bold gap-2 hover:bg-white/10"
                          onClick={() => {
                            toast.info(t('chatDetailsComingSoon'));
                          }}
                        >
                          {t('viewConversationDetails')} <ChevronRight size={14} />
                        </Button>
                      </div>
                    ))}
                    {(!adminConversations || adminConversations.length === 0) && (
                      <div className="p-12 text-center text-white font-medium">{t('noActiveConversations')}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }
        {/* Payment Gateways Tab */}
        {activeTab === "payments" && <AdminPaymentGatewaysTab />}

      </main >

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-white text-base">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 mt-4">
            <AlertDialogCancel className="flex-1">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConfig.onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
            >
              {t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Order Details Modal */}
      <Dialog open={isAdminOrderModalOpen} onOpenChange={setIsAdminOrderModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('orderDetails')} #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-gray-900 p-4 rounded-2xl flex justify-between items-center text-start">
                <div>
                  <p className="text-white font-medium">{t('paymentMethod')}: {selectedOrder.paymentMethod === 'stripe' ? t('creditCard') : t('cashOnDelivery')}</p>
                  <p className="text-white font-medium">{t('paymentStatus')}: {selectedOrder.paymentStatus === 'paid' ? t('paid') : t('pending')}</p>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-2xl text-start">
                <h4 className="font-black text-white mb-3 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" /> {t('shippingAddress')}
                </h4>
                <div className="space-y-2 text-sm text-white font-medium">
                  <p>{selectedOrder.shippingAddress?.name}</p>
                  <p>{selectedOrder.shippingAddress?.phone}</p>
                  <p>{selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.country}</p>
                  <p>{selectedOrder.shippingAddress?.address}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden text-start">
                <div className="bg-slate-50 px-4 py-2 font-black text-sm">{t('invoiceSummary')}</div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm text-white">
                    <span>{t('subtotal')}</span>
                    <span>{Number(selectedOrder.subtotal).toFixed(2)} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white">
                    <span>{t('shippingCost')}</span>
                    <span>{Number(selectedOrder.shippingCost).toFixed(2)} {t('currency')}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-bold">
                      <span>{t('discountLabel')}</span>
                      <span>-{Number(selectedOrder.discount).toFixed(2)} {t('currency')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-800 pt-3 flex justify-between font-black text-white">
                    <span>{t('orderTotal')}</span>
                    <span className="text-lg text-purple-600">{Number(selectedOrder.total).toFixed(2)} {t('currency')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-start gap-2">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsAdminOrderModalOpen(false)}>
              {t('close')}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">
              {t('updateOrderStatus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Side Dialogs for Customers */}
      <AlertDialog open={deleteCustomerOpen} onOpenChange={setDeleteCustomerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' ? 'سيؤدي هذا إلى حذف حساب العميل نهائيًا بما في ذلك جميع بياناته. لا يمكن التراجع عن هذا الإجراء.' : 'This will permanently delete the customer account including all their data. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto" side={language === 'ar' ? 'right' : 'left'}>
          <SheetHeader className="text-start">
            <SheetTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</SheetTitle>
            <SheetDescription>{language === 'ar' ? 'عرض تفصيلي لملف العميل وطلباته.' : 'Detailed view of customer profile and orders.'}</SheetDescription>
          </SheetHeader>

          {detailsLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : customerDetails ? (
            <div className="space-y-6 py-6">
              <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl">
                  {(customerDetails.name || 'C').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{customerDetails.name}</h3>
                  <p className="text-sm text-white">{customerDetails.email}</p>
                  <p className="text-xs text-white mt-1">Joined {new Date(customerDetails.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">{t('contactInfo')}</h4>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white">{t('mobileNumber')}</span>
                    <span className="text-sm font-medium">{customerDetails.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white">{t('address')}</span>
                    <span className="text-sm font-medium max-w-[200px] text-right truncate">{customerDetails.address || '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">{t('orders')}</h4>
                {customerDetails.orders && customerDetails.orders.length > 0 ? (
                  <div className="space-y-3">
                    {customerDetails.orders.map((order: any) => (
                      <div key={order.id} className="border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-white">{order.orderNumber}</p>
                          <p className="text-xs text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-blue-600">{order.total?.toLocaleString()} {t('currency')}</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white italic">No orders found.</p>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      <AdminSearchModal />
    </div >
  );
}


