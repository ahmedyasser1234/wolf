import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import api from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  Eye,
  Download,
  AlertCircle,
  Gift,
  XCircle,
  RefreshCcw,
  Wallet,
  Lock,
  UserPlus,
  LogIn,
  Loader2,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";

interface OrderStatus {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: any;
}

const ORDER_STATUSES: OrderStatus[] = [
  { id: "all", labelAr: "جميع الطلبات", labelEn: "All Orders", icon: Package },
  { id: "pending", labelAr: "قيد المراجعة", labelEn: "Pending Review", icon: Clock },
  { id: "processing", labelAr: "جاري التجهيز", labelEn: "Processing", icon: Clock },
  { id: "shipped", labelAr: "خرج للتوصيل", labelEn: "Shipped", icon: Truck },
  { id: "delivered", labelAr: "مكتمل", labelEn: "Delivered", icon: CheckCircle },
  { id: "cancelled", labelAr: "ملغية", labelEn: "Cancelled", icon: XCircle },
  { id: "returned", labelAr: "ملغية مني", labelEn: "Returned", icon: RefreshCcw },
];

export default function Orders() {
  const { language, t, formatPrice } = useLanguage();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', page, selectedStatus],
    queryFn: async () => await endpoints.orders.list({ page, limit, status: selectedStatus }),
    enabled: !!user
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;

  const payDownPaymentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await api.post(`/orders/${orderId}/pay-installment-downpayment`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(language === 'ar' ? 'فشلت عملية الدفع' : 'Payment failed');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    }
  });

  const filteredOrders = orders;

  const PolicySection = () => (
    <div className="mb-12">
      <div className="bg-[#fdf8e6] border border-[#f5e6b3] rounded-3xl p-6 md:p-10 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center md:text-start">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Gift className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              {language === 'ar' ? 'سياسة الإلغاء والإرجاع المرنة' : 'Flexible Cancellation and Return Policy'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <Card className="bg-white border-none shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">{language === 'ar' ? 'إلغاء في أي وقت' : 'Cancel Anytime'}</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {language === 'ar'
                ? 'يمكنك إلغاء الطلب في أي مرحلة حتى بعد استلامه. نوفر لك مرونة كاملة في إدارة طلباتك.'
                : 'You can cancel the order at any stage even after receiving it. We provide full flexibility in managing your orders.'}
            </p>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">{language === 'ar' ? 'إرجاع خلال 14 أيام' : 'Return within 14 Days'}</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {language === 'ar'
                ? 'لديك 14 أيام من تاريخ استلام الطلب لتقديم طلب إرجاع المنتجات المستلمة حديثاً قابلة للإرجاع بسهولة.'
                : 'You have 14 days from the date of receipt to submit a return request for the products easily.'}
            </p>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">{language === 'ar' ? 'استرداد المبلغ' : 'Full Refund'}</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {language === 'ar'
                ? 'بعد إرجاع المنتج وفحصه، سيتم استرداد المبلغ خلال 5-7 أيام عمل بنفس طريقة الدفع الأصلية.'
                : 'After returning the product and checking it, the amount will be refunded within 5-7 business days using the original payment method.'}
            </p>
          </Card>
        </div>

        <div className="mt-8 bg-black/5 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-primary" />
          <p className="text-xs font-bold text-gray-700">
            {language === 'ar'
              ? 'ملاحظة: الطلبات المكتملة (بعد 14 أيام من الاستلام) غير قابلة للإلغاء أو الإرجاع. يمكنك إلغاء الطلب في أي وقت قبل اكتماله، حتى بعد خروجه للتوصيل.'
              : 'Note: Completed orders (14 days after receipt) are non-cancellable and non-returnable. You can cancel the order anytime before completion.'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header — CollectionHero style */}
      <section className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-gray-900 flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/order-hero.png"
            alt={language === 'ar' ? "تتبع الطلب" : "Track Order"}
            className="w-full h-full object-cover opacity-60"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col items-center justify-center text-center text-white z-10 pt-20 md:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col items-center space-y-4">
              <h1 className="text-5xl md:text-7xl font-serif font-black mb-4 tracking-tight drop-shadow-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent">
                {language === 'ar' ? 'تتبع طلبك' : 'Track Your Order'}
              </h1>
              <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-bold leading-relaxed mb-6">
                {language === 'ar'
                  ? 'شاهد حالة طلباتك وتابع تحركاتها لحظة بلحظة'
                  : 'View your order status and track its movements moment by moment'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-10 mb-20 relative z-20">
        <PolicySection />

        {!user ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] border border-gray-100 shadow-xl p-10 md:p-20 text-center"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
              <Lock className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">{language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please Login'}</h2>
            <p className="text-gray-500 font-bold mb-10 max-w-md mx-auto">
              {language === 'ar'
                ? 'لتتبع طلباتك ومشاهدة سجل مشترياتك، يرجى تسجيل الدخول إلى حسابك'
                : 'To track your orders and view your purchase history, please login to your account'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button className="h-14 px-10 rounded-full bg-primary text-background font-black text-lg gap-3 w-full sm:w-auto hover:bg-primary/90">
                  <LogIn className="w-5 h-5" />
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login Now'}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="h-14 px-10 rounded-full border-2 border-gray-900 font-black text-lg gap-3 w-full sm:w-auto">
                  <UserPlus className="w-5 h-5" />
                  {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="bg-[#f8f9fa] p-2 rounded-2xl flex flex-wrap gap-2 items-center justify-center shadow-inner">
              {ORDER_STATUSES.map((status) => {
                const isActive = selectedStatus === status.id;
                return (
                  <button
                    key={status.id}
                    onClick={() => {
                      setSelectedStatus(status.id);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isActive
                      ? 'bg-primary text-background shadow-lg scale-105'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
                  >
                    <status.icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                    {language === 'ar' ? status.labelAr : status.labelEn}
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <Package className="w-20 h-20 text-primary/20 mx-auto mb-4 animate-bounce" />
                <p className="text-gray-500 font-bold text-xl">{language === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading orders...'}</p>
              </div>
            ) : !filteredOrders || filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-gray-900 mb-3">{language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</h3>
                <p className="text-gray-500 font-bold mb-10">{language === 'ar' ? 'لم تقم بأي طلبات في هذه الفئة حتى الآن' : 'You haven\'t made any orders in this category yet'}</p>
                <Link href="/products">
                  <Button className="h-14 px-10 rounded-full bg-primary text-background font-black">
                    {language === 'ar' ? 'ابدأ التسوق الآن' : 'Start Shopping Now'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredOrders.map((order: any) => (
                  <Card key={order.id} className="border border-gray-100 shadow-sm hover:shadow-xl transition-all rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        <div className="p-8 flex-1 border-b lg:border-b-0 lg:border-e border-gray-900 bg-gray-950 group-hover:bg-gray-900 transition-colors">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{language === 'ar' ? 'رقم الطلب' : 'ORDER NO'}</p>
                              <h3 className="text-2xl font-black text-white">#{order.orderNumber}</h3>
                            </div>
                            <div className="text-end">
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'التاريخ' : 'DATE'}</p>
                              <p className="font-bold text-white">
                                {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? "ar-SA" : "en-US")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex-1">
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{language === 'ar' ? 'حالة الشحن' : 'SHIPPING STATUS'}</p>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                                <div
                                  className="h-full bg-white"
                                  style={{
                                    width:
                                      order.status === 'delivered' ? '100%' :
                                        order.status === 'shipped' ? '70%' :
                                          order.status === 'processing' ? '40%' : '15%'
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm font-black text-white">
                                {ORDER_STATUSES.find(s => s.id === order.status)?.labelAr || order.status}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'الإجمالي' : 'TOTAL'}</p>
                              <p className="text-2xl font-black text-primary">{formatPrice(order.total)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex flex-row lg:flex-col gap-3 justify-center items-center lg:items-stretch w-full lg:w-64">

                          {/* KYC Review Status Banner */}
                          {order.paymentStatus === 'pending_kyc_review' && (
                            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                              <div className="flex items-center gap-2 justify-center mb-1">
                                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                                <span className="text-sm font-black text-amber-700">{language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</span>
                              </div>
                              <p className="text-xs text-amber-600 font-bold">{language === 'ar' ? 'سيتم إشعارك فور الموافقة' : 'You will be notified once approved'}</p>
                            </div>
                          )}

                          {/* Pay Down Payment Button */}
                          {order.paymentStatus === 'pending_payment' && (
                            <Button
                              onClick={() => payDownPaymentMutation.mutate(order.id)}
                              disabled={payDownPaymentMutation.isPending}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-14 font-black gap-2 text-sm shadow-lg shadow-emerald-200"
                            >
                              {payDownPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                              {language === 'ar' ? 'دفع الدفعة الأولى' : 'Pay Down Payment'}
                            </Button>
                          )}

                          <Link href={`/orders/${order.id}`} className="flex-1 lg:flex-none">
                            <Button className="w-full bg-gray-900 text-white hover:bg-black rounded-xl h-12 font-bold gap-2">
                              <Eye className="w-4 h-4" />
                              {t('viewDetails')}
                            </Button>
                          </Link>
                          <Button variant="outline" className="flex-1 lg:flex-none border-gray-300 text-gray-900 hover:bg-gray-100 rounded-xl h-12 font-bold gap-2">
                            <Download className="w-4 h-4" />
                            {language === 'ar' ? 'الفاتورة' : 'Invoice'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
            {meta && meta.lastPage > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 pb-10">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-xl border-gray-200 font-bold"
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>

                <div className="flex items-center gap-2">
                  {[...Array(meta.lastPage)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all ${page === i + 1
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-gray-400 hover:bg-gray-100'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  disabled={page >= meta.lastPage}
                  onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                  className="rounded-xl border-gray-200 font-bold"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            )}
            )}
          </div>
        )}
      </div>
    </div>
  );
}

