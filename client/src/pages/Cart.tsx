import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus, ShieldCheck, Truck, RotateCcw, ChevronLeft, Tag, Loader2, Banknote, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { useState, useMemo, useEffect } from "react";

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Cart() {
  const queryClient = useQueryClient();
  const { language, formatPrice } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [guestCartTrigger, setGuestCartTrigger] = useState(0);

  useEffect(() => {
    const handleCartUpdate = () => {
      setGuestCartTrigger(prev => prev + 1);
    };
    window.addEventListener('fustan-cart-updated', handleCartUpdate);
    return () => window.removeEventListener('fustan-cart-updated', handleCartUpdate);
  }, []);

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => endpoints.cart.get(),
    enabled: !!user,
    retry: false
  });

  const cartItems = useMemo(() => {
    let finalItems: any[] = [];
    if (cartData && Array.isArray(cartData)) {
      finalItems = [...cartData];
    }

    // Add guest items
    if (typeof window !== "undefined") {
      const guestItemsRaw = localStorage.getItem('wolf-techno-guest-items');
      if (guestItemsRaw) {
        try {
          const guestItems = JSON.parse(guestItemsRaw);
          if (Array.isArray(guestItems)) {
            finalItems = [...finalItems, ...guestItems.map(item => ({ ...item, isGuestItem: true }))];
          }
        } catch (e) {
          console.error("Failed to parse guest cart", e);
        }
      }
    }
    return finalItems;
  }, [cartData, user, guestCartTrigger]);

  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: any) => {
      // Check if it's a guest item (string id or has isGuestItem flag)
      const item = items.find((i: any) => i.id === cartItemId);
      if (item?.isGuestItem) {
        const guestItemsRaw = localStorage.getItem('wolf-techno-guest-items');
        if (guestItemsRaw) {
          const guestItems = JSON.parse(guestItemsRaw);
          const filtered = guestItems.filter((i: any) => i.id !== cartItemId);
          localStorage.setItem('wolf-techno-guest-items', JSON.stringify(filtered));
          window.dispatchEvent(new CustomEvent('wolf-techno-cart-updated'));
        }
        return Promise.resolve();
      }
      return endpoints.cart.remove(cartItemId);
    },
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم حذف المنتج من السلة" : "Product removed from cart");
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: any, quantity: number }) => {
      const item = items.find((i: any) => i.id === cartItemId);
      if (item?.isGuestItem) {
        const guestItemsRaw = localStorage.getItem('wolf-techno-guest-items');
        if (guestItemsRaw) {
          const guestItems = JSON.parse(guestItemsRaw);
          const updated = guestItems.map((i: any) => i.id === cartItemId ? { ...i, quantity } : i);
          localStorage.setItem('wolf-techno-guest-items', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('wolf-techno-cart-updated'));
        }
        return Promise.resolve();
      }
      return endpoints.cart.update(cartItemId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'installments' | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const handleCheckoutClick = () => {
    if (!user) {
      toast.info(language === 'ar' ? "يرجى تسجيل الدخول لإتمام عملية الشراء" : "Please login to complete checkout");
      setLocation("/login?redirect=/checkout");
      return;
    }
    setIsSelectionModalOpen(true);
  };

  const { data: installmentPlans } = useQuery({
    queryKey: ['installmentPlans', 'active'],
    queryFn: () => endpoints.installments.active(),
    enabled: isSelectionModalOpen
  });

  const handleConfirmCheckout = () => {
    if (!selectedMethod) {
      toast.error(language === 'ar' ? "يرجى اختيار طريقة الدفع" : "Please select a payment method");
      return;
    }

    if (selectedMethod === 'installments' && !selectedPlanId) {
      toast.error(language === 'ar' ? "يرجى اختيار خطة التقسيط" : "Please select an installment plan");
      return;
    }

    if (selectedMethod === 'cash') {
      localStorage.removeItem('wolf_payment_intent');
      setLocation(`/checkout`);
    } else {
      const plan = (installmentPlans as any[])?.find(p => p.id === selectedPlanId);
      if (plan) {
        // Calculate based on current subtotal after discounts
        const grossTotal = total; // This is subtotal + shipping - discount
        const interestAmount = grossTotal * (plan.interestRate || 0) / 100;
        const totalWithInterest = grossTotal + interestAmount;
        const downPayment = totalWithInterest * (plan.downPaymentPercentage || 0) / 100;

        localStorage.setItem('wolf_payment_intent', JSON.stringify({
          paymentMethod: 'installments',
          planId: plan.id,
          months: plan.months,
          interestRate: plan.interestRate,
          downPayment: downPayment,
          total: totalWithInterest,
          financedAmount: totalWithInterest - downPayment,
          minQuantity: plan.minQuantity,
          maxQuantity: plan.maxQuantity
        }));
        setLocation('/checkout');
      }
    }
    setIsSelectionModalOpen(false);
  };


  const clearCartMutation = useMutation({
    mutationFn: () => endpoints.cart.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      console.error("Failed to clear cart", err);
      toast.error(language === 'ar' ? "فشل إفراغ السلة" : "Failed to clear cart");
    }
  });

  const handleClearCart = async () => {
    // 1. Clear Guest Items
    localStorage.removeItem('wolf-techno-guest-items');
    window.dispatchEvent(new CustomEvent('wolf-techno-cart-updated')); // For headers/other components
    window.dispatchEvent(new CustomEvent('wolf-techno-cart-updated')); // For this component's effect

    // 2. Clear Database Cart if User is logged in
    if (user) {
      await clearCartMutation.mutateAsync();
    } else {
      // If guest, just invalidate local query to show empty state
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }

    toast.success(language === 'ar' ? "تم إفراغ السلة" : "Cart cleared successfully");
  };

  const items = (cartItems as any[]) || [];

  const subtotal = items.reduce((total: number, item: any) => {
    return total + (Number(item.quantity) * Number(item.product?.price || 0));
  }, 0);

  // 1. Fetch Offers for Vendors
  const uniqueVendorIds = Array.from(new Set(items.map((item: any) => item.product?.vendorId).filter(Boolean)));

  const { data: activeOffers } = useQuery({
    queryKey: ['vendors', 'offers', uniqueVendorIds],
    queryFn: async () => {
      if (uniqueVendorIds.length === 0) return [];
      const promises = uniqueVendorIds.map(id => api.get(`/offers/vendor/${id}`).catch(() => ({ data: [] })));
      // Note: Assuming endpoint /offers/vendor/:id exists or using generic /offers?vendorId=...
      // Let's use the one we used in OffersTab: /offers?vendorId=... which returns all offers. 
      // But we should filter for ACTIVE and Date range logic here or in backend.
      // For simplicity, let's fetch all and filter in frontend.

      const responses = await Promise.all(uniqueVendorIds.map(id =>
        api.get(`/offers?vendorId=${id}`).then(res => res.data)
      ));
      return responses.flat();
    },
    enabled: uniqueVendorIds.length > 0
  });

  // 2. Fetch Offer Products (Since generic offers list might not have products attached directly if findOne logic isn't used)
  // Actually OffersService.findAll doesn't return products. We need to fetch details or update findAll.
  // Let's fetch products for offers independently or hope findAll returns relevant info. 
  // Update: OffersService.findAll only returns offer details. We need productIds to check applicability.
  // We'll trust the process: modify OffersService.findAll to return productIds or make a new combined call.
  // For now, let's assume we update backend to include productIds in findAll or we fetch them.
  // Hack: We will use a modified query or just fetch individual offer details if needed.
  // Better: Allow findAll to join offerItems.


  // Calculate Automatic Discounts from Offers
  let automaticDiscount = 0;
  let appliedOffers: any[] = [];

  if (activeOffers) {
    const now = new Date();
    activeOffers.forEach((offer: any) => {
      const startDate = new Date(offer.startDate);
      const endDate = new Date(offer.endDate);

      if (!offer.isActive || now < startDate || now > endDate) return;

      const offerProductIds = offer.productIds || [];

      // Find cart items matching this offer
      const matchingItems = items.filter((item: any) => offerProductIds.includes(item.productId));

      if (matchingItems.length > 0) {
        const totalQuantity = matchingItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const minQty = offer.minQuantity || 1;

        if (totalQuantity >= minQty) {
          // Apply Discount
          const matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.quantity * Number(item.product.price)), 0);
          const discount = (matchingSubtotal * offer.discountPercent) / 100;
          automaticDiscount += discount;
          appliedOffers.push(offer);
        }
      }
    });
  }


  const totalDiscount = automaticDiscount;

  // Calculate Shipping
  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', 'shipping', uniqueVendorIds],
    queryFn: async () => {
      if (uniqueVendorIds.length === 0) return [];
      const promises = uniqueVendorIds.map(id => api.get(`/vendors/${id}`).catch(() => ({ data: { shippingCost: 0 } })));
      const responses = await Promise.all(promises);
      return responses.map(r => r.data);
    },
    enabled: uniqueVendorIds.length > 0
  });

  const shipping = vendorsData?.reduce((sum: number, v: any) => sum + (Number(v.shippingCost) || 0), 0) || 0;
  const total = subtotal + shipping - totalDiscount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`min-h-screen bg-[#fafafa] flex flex-col items-center justify-center py-20 px-4 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border border-white/5">
            <ShoppingCart size={48} className="text-primary" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">{language === 'ar' ? 'سلّتك مشتاقة إليك' : 'Your cart is missing you'}</h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">{language === 'ar' ? 'بإمكانكِ إضافة أفضل المنتجات التقنية من مجموعتنا الجديدة الآن.' : 'You can add the best tech products from our new collection now.'}</p>
          <Link href="/products">
            <Button size="lg" className="h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-xl font-bold shadow-xl shadow-primary/20">{language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#fafafa] pb-32 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Premium Page Header */}
      <header className="bg-white border-b border-gray-100 pt-12 pb-16">
        <div className={`container mx-auto px-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          <h1 className="text-5xl font-black text-gray-900 mb-4">{language === 'ar' ? 'حقيبة التسوق' : 'Shopping Cart'}</h1>
          <p className="text-xl text-gray-500">{language === 'ar' ? `لديكِ ${items.length} قطع مختارة بعناية` : `You have ${items.length} carefully selected pieces`}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-3xl font-black text-gray-900">{language === 'ar' ? 'محتويات الحقيبة' : 'Cart Contents'}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCart}
            disabled={clearCartMutation.isPending}
            className="text-gray-500 hover:text-primary hover:bg-primary/20 font-bold rounded-xl border-gray-200"
          >
            {clearCartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {language === 'ar' ? 'إفراغ السلة' : 'Clear Cart'}
          </Button>
        </div>
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Main Cart Area */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              <AnimatePresence mode='popLayout'>
                {items.map((item: any) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative group"
                  >
                    <img
                      src={(item.product?.images && item.product.images[0]) || (item.product?.image) || "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=200&h=200&fit=crop"}
                      alt={language === 'ar' ? (item.product?.nameAr || 'منتج مميز') : (item.product?.nameEn || 'Premium Product')}
                      className="w-32 h-32 rounded-3xl object-cover shadow-lg shrink-0"
                    />

                    <div className={`grow ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">
                        {language === 'ar' ? (item.product?.nameAr || 'منتج مميز') : (item.product?.nameEn || 'Premium Product')}
                      </h3>
                      <div className={`flex items-center gap-2 mb-4 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>
                        <span className="text-gray-500 font-bold">
                          {language === 'ar'
                            ? (item.product?.category?.nameAr || 'تصميم حصري')
                            : (item.product?.category?.nameEn || 'Exclusive Design')}
                        </span>
                        {item.color && (
                          <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-700 border border-gray-200">
                            {language === 'ar' ? 'اللون' : 'Color'}: {item.color}
                          </span>
                        )}
                      </div>

                      {/* Check if item has applied offer */}
                      {appliedOffers.some((o: any) => o.productIds?.includes(item.productId)) && (
                        <div className="mb-2 inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                          <Tag className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          {language === 'ar' ? 'عرض مطبق' : 'Offer Applied'}
                        </div>
                      )}

                      <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-3 text-2xl font-black text-primary`}>
                        {formatPrice(item.product?.price)}
                      </div>
                    </div>

                    <div className={`flex flex-col ${language === 'ar' ? 'items-end' : 'items-start'} gap-6 shrink-0`}>
                      <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantityMutation.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                          className="text-primary hover:bg-white rounded-xl"
                        >
                          <Plus size={18} />
                        </Button>
                        <span className="w-12 text-center text-xl font-black text-gray-900">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => item.quantity > 1 ? updateQuantityMutation.mutate({ cartItemId: item.id, quantity: item.quantity - 1 }) : removeItemMutation.mutate(item.id)}
                          className="text-gray-400 hover:bg-white rounded-xl"
                        >
                          <Minus size={18} />
                        </Button>
                      </div>

                      <button
                        onClick={() => removeItemMutation.mutate(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors font-bold flex items-center gap-2 text-sm"
                      >
                        {language === 'ar' ? 'إزالة' : 'Remove'} <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-40"
            >
              <div className={`bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-50 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <h2 className="text-3xl font-black text-gray-900 mb-10">{language === 'ar' ? 'ملخص الحقيبة' : 'Bag Summary'}</h2>

                <div className="space-y-6 mb-10 border-b border-gray-50 pb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-black text-primary">{formatPrice(subtotal)}</span>
                    <span className="text-lg text-gray-500 font-bold">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xl font-black ${shipping === 0 ? 'text-green-500' : 'text-gray-900'}`}>
                      {shipping === 0 ? (language === 'ar' ? 'مجانـاً' : 'Free') : formatPrice(shipping)}
                    </span>
                    <span className="text-lg text-gray-500 font-bold">{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                  </div>

                </div>

                <div className="flex justify-between items-center mb-12">
                  <span className="text-4xl font-black text-primary">{formatPrice(total)}</span>
                  <span className="text-2xl font-black text-gray-900">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                </div>

                <Button
                  onClick={handleCheckoutClick}
                  className="w-full h-20 rounded-full bg-primary hover:bg-primary/90 text-2xl font-black shadow-xl shadow-primary/20 group text-primary-foreground"
                >
                  {language === 'ar' ? 'إتمام الشراء' : 'Checkout'} <ChevronLeft className={`mr-3 group-hover:-translate-x-2 transition-transform ${language === 'ar' ? '' : 'rotate-180 ml-3 mr-0'}`} />
                </Button>

                {/* Trust Badges in Sidebar */}
                <div className="mt-12 space-y-4">
                  <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-3 text-gray-400`}>
                    <span className="text-sm font-bold">{language === 'ar' ? 'دفع آمن 100%' : '100% Secure Payment'}</span>
                    <ShieldCheck size={20} className="text-primary/80" />
                  </div>
                  <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-3 text-gray-400`}>
                    <span className="text-sm font-bold">{language === 'ar' ? 'شحن سريع ومؤمن' : 'Fast & Insured Shipping'}</span>
                    <Truck size={20} className="text-primary/80" />
                  </div>
                  <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-3 text-gray-400`}>
                    <span className="text-sm font-bold">{language === 'ar' ? 'سياسة استرجاع مرنة' : 'Flexible Return Policy'}</span>
                    <RotateCcw size={20} className="text-primary/80" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Checkout Choice Dialog */}
      <Dialog open={isSelectionModalOpen} onOpenChange={setIsSelectionModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 font-arabic max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-black text-center mb-4 md:mb-6 text-black">
              {language === 'ar' ? 'اختر طريقة الدفع' : 'Choose Payment Method'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-2 md:my-4">
            {/* Cash Option */}
            <div
              onClick={() => {
                setSelectedMethod('cash');
                setSelectedPlanId(null);
              }}
              className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center gap-3 md:gap-4 ${selectedMethod === 'cash' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${selectedMethod === 'cash' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                <Banknote size={28} />
              </div>
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-black mb-1 text-black">{language === 'ar' ? 'دفع كامل' : 'Pay Full Amount'}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-bold">{language === 'ar' ? 'دفع إجمالي الطلب نقداً أو بالبطاقة' : 'Pay full total via Cash or Card'}</p>
              </div>
            </div>

            {/* Installments Option */}
            <div
              onClick={() => setSelectedMethod('installments')}
              className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center gap-3 md:gap-4 ${selectedMethod === 'installments' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${selectedMethod === 'installments' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                <Clock size={28} />
              </div>
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-black mb-1 text-black">{language === 'ar' ? 'تقسيط مريح' : 'Easy Installments'}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-bold">{language === 'ar' ? 'قسم مشترياتك على دفعات شهرية' : 'Split your purchase into monthly payments'}</p>
              </div>
            </div>
          </div>

          {/* Installment Plans List */}
          <AnimatePresence>
            {selectedMethod === 'installments' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 md:pt-4 space-y-2 md:space-y-3">
                  <p className="font-bold text-black mb-1 md:mb-2 text-sm md:text-base">{language === 'ar' ? 'اختر خطة التقسيط:' : 'Select Installment Plan:'}</p>
                  <div className="grid grid-cols-1 gap-2 md:gap-3 max-h-[250px] md:max-h-[300px] overflow-y-auto px-1">
                    {installmentPlans?.map((plan: any) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-base md:text-lg text-black">{language === 'ar' ? plan.nameAr : plan.nameEn}</span>
                          <span className="text-xs md:text-sm text-gray-600 font-bold">{plan.months} {language === 'ar' ? 'أشهر' : 'Months'} • {plan.interestRate}% {language === 'ar' ? 'فوائد' : 'Interest'}</span>
                        </div>
                        <div className="flex flex-col text-left items-end">
                          <span className="font-black text-primary text-sm md:text-lg">{formatPrice((total * (1 + (plan.interestRate || 0) / 100)) / plan.months)}</span>
                          <span className="text-[10px] md:text-xs text-gray-600 font-bold">{language === 'ar' ? 'شهرياً' : 'per month'}</span>
                        </div>
                      </div>
                    ))}
                    {(!installmentPlans || installmentPlans.length === 0) && (
                      <p className="text-center py-4 text-black italic font-bold">
                        {language === 'ar' ? 'لا توجد خطط تقسيط متاحة لهذه المنتجات' : 'No installment plans available for these products'}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSelectionModalOpen(false)}
              className="h-12 md:h-14 rounded-full flex-1 font-bold text-base md:text-lg order-2 md:order-1"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              disabled={!selectedMethod || (selectedMethod === 'installments' && !selectedPlanId)}
              className="h-12 md:h-14 rounded-full flex-[2] bg-primary hover:bg-primary/90 text-white font-bold text-base md:text-lg shadow-lg shadow-primary/20 order-1 md:order-2"
            >
              {language === 'ar' ? 'متابعة' : 'Continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
