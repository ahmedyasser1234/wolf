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
  ShoppingBag,
  History,
  Star,
  Store,
  Ticket,
  Gift,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { useLanguage } from "@/lib/i18n";
import AdminSearchModal from "@/components/admin/AdminSearchModal";

// Lazy-load dashboard tabs for performance
const AdminAnalyticsTab = lazy(() => import("@/components/dashboard/AdminAnalyticsTab"));
const ContentTab = lazy(() => import("@/components/dashboard/ContentTab"));
const AdminCategoriesTab = lazy(() => import("@/components/dashboard/AdminCategoriesTab"));
const AdminCollectionsTab = lazy(() => import("@/components/dashboard/AdminCollectionsTab"));
const AdminOffersTab = lazy(() => import("@/components/dashboard/AdminOffersTab"));
const AdminCouponsTab = lazy(() => import("@/components/dashboard/AdminCouponsTab"));
const AdminGiftCardsTab = lazy(() => import("@/components/dashboard/AdminGiftCardsTab"));
const AdminInstallmentsTab = lazy(() => import("@/components/dashboard/AdminInstallmentsTab"));
const InstallmentOrdersTab = lazy(() => import("@/components/dashboard/InstallmentOrdersTab"));
const ProductsTab = lazy(() => import("@/components/dashboard/ProductsTab"));
const AdminPaymentGatewaysTab = lazy(() => import("@/components/dashboard/AdminPaymentGatewaysTab"));
const AdminOrdersTab = lazy(() => import("@/components/dashboard/OrdersTab"));
const AdminCustomersTab = lazy(() => import("@/components/dashboard/CustomersTab"));
const MessagesTab = lazy(() => import("@/components/dashboard/MessagesTab"));
const AdminInstallmentPaymentsTab = lazy(() => import("@/components/dashboard/AdminInstallmentPaymentsTab"));
const AdminEmailCenterTab = lazy(() => import("@/components/dashboard/AdminEmailCenterTab"));


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
  const [customerHistoryTab, setCustomerHistoryTab] = useState<'orders' | 'gift_cards' | 'wallet'>('orders');

  const [activeTab, setActiveTabInternal] = useState<"overview" | "analytics" | "products" | "categories" | "collections" | "offers" | "coupons" | "giftcards" | "installments" | "installment-orders" | "payments" | "orders" | "customers" | "chat" | "content" | "settings" | "installment-payments" | "email-center">(() => {
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
  const { data: dashboardStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");

  const [orderPage, setOrderPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderDateFrom, orderDateTo]);

  const { data: ordersResult, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders', orderPage, orderSearch, orderDateFrom, orderDateTo],
    queryFn: async () => (await api.get('/admin/orders', {
      params: {
        page: orderPage,
        limit: 10,
        search: orderSearch,
        dateFrom: orderDateFrom,
        dateTo: orderDateTo
      }
    })).data,
  });

  const adminOrders = ordersResult?.orders || [];
  const totalOrderPages = ordersResult?.totalPages || 0;

  const pendingInstallmentReviews = dashboardStats?.pendingKycReviews || 0;

  const [lastSeenKycAt, setLastSeenKycAt] = useState<number>(() => {
    return Number(localStorage.getItem('lastSeenInstallmentOrdersAt') || 0);
  });

  const showInstallmentBadge = useMemo(() => {
    if (!dashboardStats?.latestPendingKycAt) return false;
    const latestAt = new Date(dashboardStats.latestPendingKycAt).getTime();
    return latestAt > lastSeenKycAt;
  }, [dashboardStats?.latestPendingKycAt, lastSeenKycAt]);

  /* Define tabs with distinct gradient colors */
  const tabs = useMemo<{ id: string; label: string; icon: any; color?: string; badge?: number | boolean }[]>(() => [
    { id: "overview", label: t('overview'), icon: LayoutDashboard, color: "from-purple-600 to-pink-600 shadow-purple-500/30" },
    { id: "analytics", label: t('analytics'), icon: BarChart3, color: "from-emerald-400 to-teal-600 shadow-emerald-500/30" },
    { id: "content", label: t('contentManagement'), icon: Edit, color: "from-primary to-rose-600 shadow-primary/30" },
    { id: "products", label: t('products'), icon: Package, color: "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30" },
    { id: "categories", label: t('categories'), icon: Layers, color: "from-teal-400 to-emerald-600 shadow-teal-500/30" },
    { id: "collections", label: language === 'ar' ? 'المجموعات' : 'Collections', icon: List, color: "from-blue-400 to-indigo-600 shadow-blue-500/30" },
    { id: "offers", label: language === 'ar' ? 'العروض' : 'Offers', icon: TrendingUp, color: "from-pink-400 to-rose-600 shadow-pink-500/30" },
    { id: "coupons", label: language === 'ar' ? 'الكوبونات' : 'Coupons', icon: Ticket, color: "from-amber-400 to-orange-600 shadow-amber-500/30" },
    { id: "giftcards", label: language === 'ar' ? 'الجيفت كارد' : 'Gift Cards', icon: Gift, color: "from-emerald-400 to-teal-600 shadow-emerald-500/30" },
    { id: "installments", label: language === 'ar' ? 'التقسيط' : 'Installments', icon: CreditCard, color: "from-violet-400 to-purple-600 shadow-violet-500/30" },
    { id: "installment-orders", label: language === 'ar' ? 'طلبات التقسيط' : 'Installment Orders', icon: ShoppingCart, badge: showInstallmentBadge ? (dashboardStats?.pendingKycReviews || true) : undefined, color: "from-amber-400 to-orange-500 shadow-amber-500/30" },
    { id: "installment-payments", label: language === 'ar' ? 'متابعة الأقساط' : 'Installment Tracking', icon: History, color: "from-indigo-400 to-blue-600 shadow-indigo-500/30" },
    { id: "payments", label: language === 'ar' ? 'بوابات الدفع' : 'Payment Gateways', icon: DollarSign, color: "from-emerald-400 to-teal-600 shadow-emerald-500/30" },
    { id: "email-center", label: language === 'ar' ? 'مركز الإيميلات' : 'Email Center', icon: Mail, color: "from-blue-500 to-cyan-500 shadow-blue-500/30" },
    { id: "orders", label: t('orders'), icon: ShoppingCart, color: "from-orange-500 to-red-600 shadow-orange-500/30" },
    { id: "customers", label: t('customers'), icon: Users, color: "from-sky-500 to-blue-600 shadow-sky-500/30" },
    { id: "chat", label: t('chat'), icon: MessageSquare, badge: unreadCount, color: "from-pink-500 to-primary shadow-pink-500/30" },
    { id: "settings", label: t('settings'), icon: Settings, color: "from-slate-700 to-slate-900 shadow-slate-500/30" },
  ], [t, unreadCount, language, dashboardStats, showInstallmentBadge]);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabInternal(tab);

    // Clear installment badge if clicking the tab
    if (tab === 'installment-orders') {
      const now = Date.now();
      localStorage.setItem('lastSeenInstallmentOrdersAt', now.toString());
      setLastSeenKycAt(now);
    }

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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isAdminOrderModalOpen, setIsAdminOrderModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
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




  const updateCustomerStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      endpoints.admin.updateCustomerStatus(id, status),
    onSuccess: (_, variables) => {
      const statusLabel = variables.status === 'blocked'
        ? (language === 'ar' ? 'تم حظر المستخدم' : 'User blocked')
        : (language === 'ar' ? 'تم تفعيل المستخدم' : 'User activated');
      toast.success(statusLabel);
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'));
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
    enabled: activeTab === 'products' // Only fetch if on products tab
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
    enabled: activeTab === 'customers' // Only fetch if on customers tab
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

  const totalRevenue = dashboardStats?.totalRevenue || 0;




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
    <div className="h-screen bg-background flex flex-col overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
      <div className="bg-background border-b border-gray-800 sticky top-20 z-30 shadow-md">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group h-11 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2.5 transition-all duration-300 relative whitespace-nowrap min-w-fit shadow-sm ${activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105 z-10`
                  : "bg-gray-800 text-white hover:bg-gray-700 hover:text-white border border-transparent hover:border-gray-600 hover:shadow-md"
                  }`}
              >
                <tab.icon className={`w-4 h-4 md:w-5 md:h-5 relative z-10 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
                {tab.badge ? (
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-600 text-white text-[10px] md:text-xs font-black rounded-full flex items-center justify-center animate-bounce shadow-md z-20 border-2 border-white">
                    {typeof tab.badge === 'number' ? (tab.badge > 99 ? '99+' : tab.badge) : ''}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-8">
        <Suspense fallback={
          <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-800 rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-black text-white uppercase tracking-[0.3em] animate-pulse">Wolf Techno</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('retry')}</p>
            </div>
          </div>
        }>
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
                        <p className="text-2xl md:text-3xl font-black text-white">{dashboardStats?.totalCustomers || 0}</p>
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
                        <p className="text-2xl md:text-3xl font-black text-white">{dashboardStats?.totalProducts || 0}</p>
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
                        <p className="text-2xl md:text-3xl font-black text-white">{dashboardStats?.totalPaidOrders || 0}</p>
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
                        <p className="text-xl md:text-2xl font-black text-white">{(dashboardStats?.totalRevenue || 0).toFixed(2)} {t('currency')}</p>
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

          {/* Installment Payments Tracking Tab */}
          {
            activeTab === "installment-payments" && (
              <AdminInstallmentPaymentsTab />
            )
          }

          {/* Settings Tab */}
          {activeTab === "settings" && <SettingsTab />}

          {/* Email Center Tab */}
          {activeTab === "email-center" && (
            <Suspense fallback={<div className="p-8 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-purple-600" /></div>}>
              <AdminEmailCenterTab />
            </Suspense>
          )}

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
          {
            activeTab === "orders" && (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-orange-400" />
                  </div>
                  {t('orders')}
                </h2>

                {/* Filter Bar */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 relative">
                    <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1 block">{language === 'ar' ? 'بحث (رقم الطلب / اسم العميل)' : 'Search (Order # / Customer)'}</label>
                    <div className="relative">
                      <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500`} />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={e => setOrderSearch(e.target.value)}
                        placeholder={language === 'ar' ? 'ابحث...' : 'Search...'}
                        className={`w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500`}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-40">
                    <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1 block">{language === 'ar' ? 'من تاريخ' : 'From Date'}</label>
                    <input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-purple-500 [color-scheme:dark]" />
                  </div>
                  <div className="w-full md:w-40">
                    <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1 block">{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
                    <input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-purple-500 [color-scheme:dark]" />
                  </div>
                  <button onClick={() => { setOrderSearch(''); setOrderDateFrom(''); setOrderDateTo(''); setOrderPage(1); }}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800 text-sm font-bold transition-colors">
                    {language === 'ar' ? 'مسح' : 'Clear'}
                  </button>
                </div>

                <Card className="border border-gray-800 rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                  <CardContent className="p-0">
                    {/* Mobile Order Cards */}
                    <div className="md:hidden space-y-4 p-4">
                      {adminOrders.map((order: any) => (
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
                                  {order.customer?.name || order.shippingAddress?.name || `${t('customer')} #${order.customerId}`}
                                </p>
                                {order.createdAt && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                )}
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
                            <th className="py-4 px-6 font-black text-white text-center">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th className="py-4 px-6 font-black text-white text-center">{t('amount')}</th>
                            <th className="py-4 px-6 font-black text-white text-center">{language === 'ar' ? 'وسيلة الدفع' : 'Payment Method'}</th>
                            <th className="py-4 px-6 font-black text-white text-center">{language === 'ar' ? 'حالة الطلب' : 'Order Status'}</th>
                            <th className="py-4 px-6 font-black text-white text-center">{t('deliveryStatus')}</th>
                            <th className="py-4 px-6 font-black text-white text-end">{t('actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminOrders.map((order: any) => (
                            <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-white text-start">{order.orderNumber}</td>
                              <td className="py-4 px-6 text-white font-medium text-start">{order.customer?.name || order.shippingAddress?.name || `${t('customer')} #${order.customerId}`}</td>
                              <td className="py-4 px-6 text-center">
                                <span className="text-gray-300 text-xs font-bold">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-black text-white text-center">{Number(order.total).toFixed(2)} {t('currency')}</td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-700">
                                    {order.paymentMethod === 'cash' || order.paymentMethod === 'cod' || order.paymentMethod === 'cashOnDelivery' ? (language === 'ar' ? 'دفع عند الاستلام' : 'COD') :
                                      order.paymentMethod === 'wallet' ? (language === 'ar' ? 'محفظة' : 'Wallet') :
                                        order.paymentMethod === 'gift_card' ? (language === 'ar' ? 'بطاقة هدية' : 'Gift Card') :
                                          order.paymentMethod === 'installments' ? (language === 'ar' ? 'تقسيط' : 'Installments') :
                                            (language === 'ar' ? 'بطاقة بنكية' : 'Bank Card')}
                                  </span>
                                  {order.paymentMethod === 'installments' && (
                                    <span className="px-2 py-0.5 bg-violet-900/40 text-violet-400 rounded-full text-[9px] font-black border border-violet-800/50">
                                      {({
                                        'card': language === 'ar' ? 'بطاقة' : 'Card',
                                        'wallet': language === 'ar' ? 'محفظة' : 'Wallet',
                                        'gift_card': language === 'ar' ? 'بطاقة هدية' : 'Gift Card',
                                        'stripe': language === 'ar' ? 'بطاقة' : 'Card',
                                      } as any)[order.depositPaymentMethod] || (language === 'ar' ? 'بطاقة' : 'Card')}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.installmentPlanId ? 'bg-purple-900/40 text-purple-400 border-purple-800/50' : 'bg-blue-900/40 text-blue-400 border-blue-800/50'}`}>
                                  {order.installmentPlanId ? (language === 'ar' ? 'تقسيط' : 'Installment') : (language === 'ar' ? 'كاش' : 'Cash')}
                                </span>
                                <div className="mt-1">
                                  <span className={`text-[9px] font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-500' :
                                    order.paymentStatus === 'failed' ? 'text-red-500' :
                                      (order.paymentStatus === 'pending_kyc_review' || order.paymentStatus === 'pending_payment') ? 'text-amber-500' :
                                        'text-blue-400'
                                    }`}>
                                    {order.paymentStatus === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') :
                                      (order.paymentStatus === 'pending_kyc_review' || order.paymentStatus === 'pending_payment') ? (language === 'ar' ? 'مراجعة' : 'Review') :
                                        order.paymentStatus === 'failed' ? (language === 'ar' ? 'فشل' : 'Failed') :
                                          (language === 'ar' ? 'معلق' : 'Pending')}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.status === 'delivered' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
                                  order.status === 'cancelled' ? 'bg-red-900/40 text-red-400 border-red-800/50' :
                                    order.status === 'preparing_shipment' ? 'bg-fuchsia-900/40 text-fuchsia-400 border-fuchsia-800/50' :
                                      'bg-blue-900/40 text-blue-400 border-blue-800/50'
                                  }`}>
                                  {order.status === 'delivered' ? t('delivered') :
                                    order.status === 'cancelled' ? (language === 'ar' ? 'ملغى' : 'Cancelled') :
                                      order.status === 'preparing_shipment' ? (language === 'ar' ? 'تجهيز الشحن' : 'Preparing') :
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

                      {/* Pagination Controls */}
                      {totalOrderPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/50 sticky bottom-0 z-10">
                          <div className="flex items-center gap-2 text-start">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                              {language === 'ar' ? 'صفحة' : 'Page'} {orderPage} {language === 'ar' ? 'من' : 'of'} {totalOrderPages}
                            </span>
                            <span className="text-[10px] font-bold text-gray-600">
                              ({ordersResult?.total} {language === 'ar' ? 'طلب إجمالي' : 'Total Orders'})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={orderPage === 1 || ordersLoading}
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setOrderPage(p => Math.max(1, p - 1));
                              }}
                              className="rounded-xl border-gray-800 bg-gray-950 text-white hover:bg-gray-800 h-9 px-4 font-black"
                            >
                              {language === 'ar' ? 'السابق' : 'Previous'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={orderPage === totalOrderPages || ordersLoading}
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setOrderPage(p => Math.min(totalOrderPages, p + 1));
                              }}
                              className="rounded-xl border-gray-800 bg-gray-950 text-white hover:bg-gray-800 h-9 px-4 font-black"
                            >
                              {language === 'ar' ? 'التالي' : 'Next'}
                            </Button>
                          </div>
                        </div>
                      )}
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
                            <th className="py-4 px-6 font-black text-white text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
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
                                    <div className="flex flex-col">
                                      <span>{c.name || t('customerUnknown')}</span>
                                      {c.status === 'blocked' && (
                                        <span className="text-[10px] text-red-500 font-bold uppercase">{language === 'ar' ? 'محظور' : 'Blocked'}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-white text-start">{c.email}</td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.status === 'blocked' ? 'bg-red-900/40 text-red-400 border-red-800/50' : 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50'}`}>
                                    {c.status === 'blocked' ? (language === 'ar' ? 'محظور' : 'Blocked') : (language === 'ar' ? 'نشط' : 'Active')}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-white text-xs text-center">{c.lastSignedIn ? new Date(c.lastSignedIn).toLocaleDateString() : t('never')}</td>
                                <td className="py-4 px-6 text-white text-center">{c.phone || '-'}</td>
                                <td className="py-4 px-6 text-end">
                                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    {c.status === 'blocked' ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={updateCustomerStatusMutation.isPending && updateCustomerStatusMutation.variables?.id === c.id}
                                        className="text-emerald-400 hover:text-emerald-500 hover:bg-emerald-900/30 rounded-lg"
                                        onClick={() => updateCustomerStatusMutation.mutate({ id: c.id, status: 'active' })}
                                        title={language === 'ar' ? 'تفعيل الحساب' : 'Activate Account'}
                                      >
                                        {updateCustomerStatusMutation.isPending && updateCustomerStatusMutation.variables?.id === c.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <UserCheck className="w-4 h-4" />
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-amber-400 hover:text-amber-500 hover:bg-amber-900/30 rounded-lg"
                                        onClick={() => showConfirm(
                                          language === 'ar' ? 'حظر العميل' : 'Block Customer',
                                          language === 'ar' ? `هل أنت متأكد من حظر العميل ${c.name}؟ لن يتمكن من تسجيل الدخول.` : `Are you sure you want to block ${c.name}? They will not be able to log in.`,
                                          () => updateCustomerStatusMutation.mutate({ id: c.id, status: 'blocked' })
                                        )}
                                        title={language === 'ar' ? 'حظر الحساب' : 'Block Account'}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    )}
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
        </Suspense>
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
              <div className="bg-gray-900 p-4 rounded-2xl flex flex-col gap-4 text-start">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    {selectedOrder.installmentPlanId ? (
                      <p className="text-white font-medium">
                        {language === 'ar' ? 'نظام التقسيط:' : 'Installment System:'} <span className="text-purple-400">
                          {selectedOrder.installmentPlan?.name || (language === 'ar' ? 'مفعل' : 'Active')}
                        </span>
                      </p>
                    ) : (
                      <p className="text-white font-medium">
                        {t('paymentMethod')}: {({
                          'card': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                          'cash': language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery',
                          'cod': language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery',
                          'cashOnDelivery': language === 'ar' ? 'دفع عند الاستلام' : 'Cash on Delivery',
                          'installments': language === 'ar' ? 'تقسيط' : 'Installments',
                          'wallet': language === 'ar' ? 'المحفظة الإلكترونية' : 'Wallet',
                          'gift_card': language === 'ar' ? 'بطاقة هدية' : 'Gift Card',
                          'stripe': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                        } as any)[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                      </p>
                    )}
                    <p className="text-white font-medium">{language === 'ar' ? 'حالة الدفع' : 'Payment Status'}: {({
                      'paid': language === 'ar' ? 'تم الدفع ✅' : 'Paid ✅',
                      'pending': language === 'ar' ? 'قيد الانتظار' : 'Pending',
                      'pending_kyc_review': language === 'ar' ? 'مراجعة أوراق 📋' : 'KYC Review 📋',
                      'pending_payment': language === 'ar' ? 'انتظار الدفع' : 'Awaiting Payment',
                      'awaiting_deposit_payment': language === 'ar' ? 'بانتظار دفع المقدم' : 'Awaiting Deposit',
                      'failed': language === 'ar' ? 'فشل الدفع ❌' : 'Failed ❌',
                      'cancelled': language === 'ar' ? 'ملغى' : 'Cancelled',
                      'preparing_shipment': language === 'ar' ? 'جاري تجهيز الشحن' : 'Preparing Shipment',
                      'shipped': language === 'ar' ? 'تم الشحن' : 'Shipped',
                      'delivered': language === 'ar' ? 'تم التسليم' : 'Delivered',
                    } as any)[selectedOrder.paymentStatus || selectedOrder.status] || selectedOrder.status}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${selectedOrder.installmentPlanId ? 'bg-purple-900 text-purple-300 border border-purple-700' : 'bg-blue-900 text-blue-300 border border-blue-700'}`}>
                      {selectedOrder.installmentPlanId ? (language === 'ar' ? 'طلب تقسيط' : 'Installment Order') : (language === 'ar' ? 'طلب كاش' : 'Cash Order')}
                    </span>
                  </div>
                </div>

                {selectedOrder.depositAmount && (
                  <div className="pt-3 border-t border-gray-800 bg-emerald-900/10 p-3 rounded-xl border border-emerald-500/20">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-bold text-gray-300">
                        {language === 'ar' ? 'طريقة دفع المقدم:' : 'Down-Payment Method:'}
                        <span className="text-emerald-400 ml-2">
                          {({
                            'card': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                            'wallet': language === 'ar' ? 'المحفظة' : 'Wallet',
                            'gift_card': language === 'ar' ? 'كارت هدية' : 'Gift Card',
                            'stripe': language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
                          } as any)[selectedOrder.depositPaymentMethod] || selectedOrder.depositPaymentMethod}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-emerald-400">
                        {language === 'ar' ? 'مبلغ المقدم:' : 'Down-Payment Amount:'}
                        <span className="text-lg ml-2">{Number(selectedOrder.depositAmount).toFixed(2)} {t('currency')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedOrder.kycData && (
                <div className="bg-gray-900 p-4 rounded-2xl text-start space-y-4">
                  <h4 className="font-black text-white mb-2 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" /> {language === 'ar' ? 'بيانات وأوراق العميل (KYC)' : 'Customer Info & Documents (KYC)'}
                  </h4>

                  {/* Manual Data Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-950/50 p-4 rounded-xl border border-gray-800">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{language === 'ar' ? 'رقم الهوية' : 'ID Number'}</p>
                      <p className="text-sm text-white font-medium">{selectedOrder.kycData.idNumber || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</p>
                      <p className="text-sm text-white font-medium">{selectedOrder.kycData.passportNumber || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p>
                      <p className="text-sm text-white font-medium">{selectedOrder.kycData.dob || '-'}</p>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{language === 'ar' ? 'عنوان السكن' : 'Residential Address'}</p>
                      <p className="text-sm text-white font-medium leading-relaxed">{selectedOrder.kycData.residentialAddress || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {selectedOrder.kycData.faceId && (
                      <div className="group relative aspect-square rounded-xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-emerald-500 transition-all">
                        <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-emerald-500" />
                        <span className="text-[10px] text-white font-bold">{language === 'ar' ? 'صورة الوجه' : 'Face ID'}</span>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                          <a href={selectedOrder.kycData.faceId} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <Eye className="w-5 h-5 text-white" />
                          </a>
                          <a href={selectedOrder.kycData.faceId} download={`face_id_${selectedOrder.orderNumber}.jpg`} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <Download className="w-5 h-5 text-white" />
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedOrder.kycData.residencyDoc && (
                      <div className="group relative aspect-square rounded-xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-emerald-500 transition-all">
                        <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-emerald-500" />
                        <span className="text-[10px] text-white font-bold">{language === 'ar' ? 'إثبات السكن' : 'Residency'}</span>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                          <a href={selectedOrder.kycData.residencyDoc} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <Eye className="w-5 h-5 text-white" />
                          </a>
                          <a href={selectedOrder.kycData.residencyDoc} download={`residency_${selectedOrder.orderNumber}.jpg`} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <Download className="w-5 h-5 text-white" />
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedOrder.kycData.passportDoc && (
                      <div className="group relative aspect-square rounded-xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-emerald-500 transition-all">
                        <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-emerald-500" />
                        <span className="text-[10px] text-white font-bold">{language === 'ar' ? 'الجواز/الهوية' : 'Passport/ID'}</span>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                          <a href={selectedOrder.kycData.passportDoc} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <Eye className="w-5 h-5 text-white" />
                          </a>
                          <a href={selectedOrder.kycData.passportDoc} download={`passport_${selectedOrder.orderNumber}.jpg`} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <Download className="w-5 h-5 text-white" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {/* Order Items */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 font-black text-sm text-white flex items-center gap-2 uppercase tracking-tight">
                  <ShoppingBag size={14} className="text-purple-400" />
                  {language === 'ar' ? "محتويات الطلب" : "Order Items"}
                </div>
                <div className="divide-y divide-gray-800">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center gap-3 sm:gap-4 hover:bg-gray-800/30 transition-colors">
                      <div className="w-12 h-15 rounded-lg bg-gray-950 flex-shrink-0 overflow-hidden border border-gray-800">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-gray-700" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] sm:text-xs font-black text-white truncate uppercase tracking-tight">
                          {language === 'ar' ? item.product?.nameAr : item.product?.nameEn}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.size && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{item.size}</span>
                          )}
                          <span className="text-[10px] font-bold text-gray-500">x{item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] sm:text-xs font-black text-[#e91e63]">
                          {(item.price * item.quantity).toFixed(2)} {t('currency')}
                        </p>
                        <p className="text-[9px] font-bold text-gray-600">
                          {Number(item.price).toFixed(2)} {t('currency')}/{language === 'ar' ? 'قطعة' : 'pc'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <div className="p-6 text-center">
                      <p className="text-xs text-gray-500 font-bold italic">{language === 'ar' ? 'لا توجد بيانات لهذا الطلب' : 'No items data for this order'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-800 rounded-2xl overflow-hidden text-start">
                <div className="bg-gray-800 px-4 py-2 font-black text-sm text-white">{t('invoiceSummary')}</div>
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
                    <div className="flex justify-between text-sm text-green-400 font-bold">
                      <span>{t('discountLabel')}</span>
                      <span>-{Number(selectedOrder.discount).toFixed(2)} {t('currency')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-800 pt-3 flex justify-between font-black text-white">
                    <span>{t('orderTotal')}</span>
                    <span className="text-lg text-purple-500">{Number(selectedOrder.total).toFixed(2)} {t('currency')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-start gap-2">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsAdminOrderModalOpen(false)}>
              {t('close')}
            </Button>
            {selectedOrder && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={newStatus || selectedOrder?.status || ''}
                  onValueChange={(val) => setNewStatus(val)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] rounded-xl font-bold bg-gray-900 border-gray-700">
                    <SelectValue placeholder={t('updateOrderStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{language === 'ar' ? "الحالة" : "Status"}</SelectLabel>
                      <SelectItem value="pending" disabled={['preparing_shipment', 'shipped', 'delivered', 'cancelled'].includes(selectedOrder?.status)}>
                        {language === 'ar' ? "قيد الانتظار ⏳" : "Pending ⏳"}
                      </SelectItem>
                      <SelectItem value="preparing_shipment" disabled={['shipped', 'delivered', 'cancelled'].includes(selectedOrder?.status)}>
                        {language === 'ar' ? "جاري التجهيز للشحن 📦" : "Preparing Shipment 📦"}
                      </SelectItem>
                      <SelectItem value="shipped" disabled={['delivered', 'cancelled'].includes(selectedOrder?.status)}>
                        {language === 'ar' ? "تم الشحن 🚚" : "Shipped 🚚"}
                      </SelectItem>
                      <SelectItem value="delivered" disabled={['cancelled'].includes(selectedOrder?.status)}>
                        {language === 'ar' ? "تم التوصيل 📦" : "Delivered 📦"}
                      </SelectItem>
                      <SelectItem value="cancelled" disabled={['delivered'].includes(selectedOrder?.status) || !!selectedOrder?.installmentPlanId}>
                        {language === 'ar' ? "إلغاء ❌" : "Cancel ❌"}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold whitespace-nowrap"
                  disabled={updatingStatus}
                  onClick={async () => {
                    if (!newStatus) {
                      toast.error(language === 'ar' ? 'يرجى اختيار حالة جديدة' : 'Please select a new status');
                      return;
                    }
                    if (!selectedOrder?.id) return;
                    setUpdatingStatus(true);
                    try {
                      await api.patch(`/orders/${selectedOrder.id}/status`, { status: newStatus });
                      toast.success(language === 'ar' ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully');
                      queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] });
                      setIsAdminOrderModalOpen(false);
                    } catch (err) {
                      toast.error(language === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
                    } finally {
                      setUpdatingStatus(false);
                    }
                  }}
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : t('updateOrderStatus')}
                </Button>
              </div>
            )}
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

              {/* Tab Filters */}
              <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setCustomerHistoryTab('orders')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${customerHistoryTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  {t('orders')}
                </button>
                <button
                  onClick={() => setCustomerHistoryTab('gift_cards')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${customerHistoryTab === 'gift_cards' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  {language === 'ar' ? 'كروت الهدايا' : 'Gift Cards'}
                </button>
                <button
                  onClick={() => setCustomerHistoryTab('wallet')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${customerHistoryTab === 'wallet' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  {language === 'ar' ? 'المحفظة' : 'Wallet'}
                </button>
              </div>

              {/* Orders Tab Content */}
              {customerHistoryTab === 'orders' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    {t('orders')}
                  </h4>
                  {customerDetails.orders && customerDetails.orders.length > 0 ? (
                    <div className="space-y-3">
                      {customerDetails.orders.map((order: any) => (
                        <div 
                          key={order.id} 
                          className="border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800/50 cursor-pointer transition-colors group"
                          onClick={async () => {
                            try {
                              const fullOrder = await endpoints.orders.get(order.id);
                              setSelectedOrder(fullOrder);
                              setIsAdminOrderModalOpen(true);
                            } catch (err) {
                              toast.error(language === 'ar' ? 'فشل تحميل تفاصيل الطلب' : 'Failed to load order details');
                            }
                          }}
                        >
                          <div>
                            <p className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors uppercase">{order.orderNumber}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">
                              {({
                                'card': language === 'ar' ? 'بطاقة' : 'Card',
                                'cash': language === 'ar' ? 'كاش' : 'Cash',
                                'wallet': language === 'ar' ? 'محفظة' : 'Wallet',
                                'gift_card': language === 'ar' ? 'جيفت كارد' : 'Gift Card',
                                'installments': language === 'ar' ? 'تقسيط' : 'Installments'
                              } as any)[order.paymentMethod] || order.paymentMethod}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm text-blue-500">{order.total?.toLocaleString()} {t('currency')}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight mt-1 ${
                              order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' :
                              order.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 
                              'bg-amber-900/30 text-amber-500 border border-amber-800/50'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                      <p className="text-sm text-gray-500 italic font-medium">{language === 'ar' ? 'لا توجد طلبات سابقة' : 'No previous orders found.'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Gift Cards Tab Content */}
              {customerHistoryTab === 'gift_cards' && (
                <div className="space-y-6">
                  {/* Purchased */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-500" />
                      {language === 'ar' ? 'كروت اشتراها العميل' : 'Gift Cards Purchased'}
                    </h4>
                    {customerDetails.giftCards?.purchased?.length > 0 ? (
                      <div className="grid gap-2">
                        {customerDetails.giftCards.purchased.map((card: any) => (
                          <div key={card.id} className="bg-gray-900/70 border border-gray-800 p-3 rounded-xl flex justify-between items-center group">
                            <div>
                              <p className="font-mono text-xs text-white group-hover:text-purple-400 transition-colors uppercase">{card.code}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                                {card.isRedeemed ? (language === 'ar' ? 'تم الاستخدام' : 'Redeemed') : (language === 'ar' ? 'متاح' : 'Available')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-sm text-purple-400">{Number(card.amount).toFixed(2)} {t('currency')}</p>
                              <p className="text-[9px] text-gray-600 mt-1">{new Date(card.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 italic px-2">{language === 'ar' ? 'لم يقم بشراء كروت بعد' : 'No gift cards purchased yet.'}</p>
                    )}
                  </div>

                  {/* Redeemed */}
                  <div className="space-y-3 border-t border-gray-800 pt-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-500" />
                      {language === 'ar' ? 'كروت استخدمها العميل' : 'Gift Cards Redeemed'}
                    </h4>
                    {customerDetails.giftCards?.redeemed?.length > 0 ? (
                      <div className="grid gap-2">
                        {customerDetails.giftCards.redeemed.map((card: any) => (
                          <div key={card.id} className="bg-gray-900/70 border border-emerald-900/30 p-3 rounded-xl flex justify-between items-center bg-emerald-950/5">
                            <div>
                              <p className="font-mono text-xs text-white uppercase">{card.code}</p>
                              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                                {language === 'ar' ? 'تم الشحن' : 'Redeemed'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-sm text-emerald-400">{Number(card.amount).toFixed(2)} {t('currency')}</p>
                              <p className="text-[9px] text-gray-600 mt-1">{card.redeemedAt ? new Date(card.redeemedAt).toLocaleDateString() : '-'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 italic px-2">{language === 'ar' ? 'لم يقم باستخدام كروت بعد' : 'No gift cards redeemed yet.'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Wallet Tab Content */}
              {customerHistoryTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-1">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</p>
                      <h3 className="text-2xl font-black text-emerald-400">{Number(customerDetails.wallet?.balance || 0).toFixed(2)} <span className="text-xs font-bold opacity-70">{t('currency')}</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-sm mt-6 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" />
                    {language === 'ar' ? 'سجل العمليات' : 'Transaction History'}
                  </h4>
                  {customerDetails.walletTransactions && customerDetails.walletTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetails.walletTransactions.map((tx: any) => (
                        <div key={tx.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center transition-all hover:border-gray-700">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${tx.amount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                              <p className="text-xs font-black text-white uppercase tracking-tight">
                                {language === 'ar' 
                                  ? (tx.type === 'funding' ? 'شحن رصيد' : tx.type === 'payment' ? 'دفع لطلب' : tx.type === 'refund' ? 'استرجاع' : 'تحويل')
                                  : tx.type.toUpperCase()
                                }
                              </p>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[200px]">{tx.description || '-'}</p>
                            <p className="text-[9px] text-gray-600 font-bold">{new Date(tx.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                            </p>
                            <p className="text-[9px] font-bold text-gray-700 uppercase">{t('currency')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                      <p className="text-sm text-gray-500 italic font-medium">{language === 'ar' ? 'لا توجد عمليات مسبقة' : 'No transactions found.'}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      <AdminSearchModal />
    </div >
  );
}


