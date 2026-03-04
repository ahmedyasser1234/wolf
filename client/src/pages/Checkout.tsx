import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import api, { endpoints } from "@/lib/api"; // Fixed: import api from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import {
  CreditCard, Truck, Receipt, CheckCircle2, ChevronLeft, ChevronRight,
  ShieldCheck, Wallet, Banknote, AlertCircle, Loader2, UserCheck, Smartphone, Globe, Info, Clock, Gift,
  Zap, QrCode, Shield, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import KYCStep from "@/components/checkout/KYCStep";
import { useAuth } from "@/_core/hooks/useAuth";

type CheckoutStep = "shipping" | "payment" | "kyc" | "review" | "success";

export default function Checkout() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  // Direct initialization from localStorage to avoid race conditions
  const getInitialIntent = () => {
    const raw = localStorage.getItem('wolf_payment_intent');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };
  const intent = getInitialIntent();

  const [step, setStep] = useState<CheckoutStep>(
    intent?.paymentMethod === 'installments' ? "kyc" : "shipping"
  );

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || "",
    lastName: user?.name?.split(' ')[1] || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: "",
    country: "UAE",
    zipCode: "",
    paymentMethod: intent?.paymentMethod || "card",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
    installmentPlanId: (intent?.paymentMethod === 'installments' ? intent.planId : null) as number | null,
    topUpMethod: null as "card" | "cash" | null,
  });

  const [kycData, setKycData] = useState<any>(null);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [giftCardCode, setGiftCardCode] = useState("");

  // Show toast if starting at KYC
  useEffect(() => {
    if (step === 'kyc') {
      toast.info(language === 'ar' ? "يرجى إكمال التحقق من الهوية للمتابعة" : "Please complete identity verification to proceed");
    }
  }, [language]); // Only run once on mount or language change if step is kyc

  // Queries
  const { data: cartData, isLoading: isCartLoading, isFetching: isCartFetching } = useQuery({
    queryKey: ["cart"],
    queryFn: () => endpoints.cart.get(),
    enabled: !!user,
  });

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => endpoints.wallets.getMyWallet(),
    enabled: !!user,
  });

  const { data: gatewaysData } = useQuery({
    queryKey: ["paymentGateways"],
    queryFn: () => endpoints.paymentGateways.listEnabled(),
  });

  const items = useMemo(() => {
    if (cartData && Array.isArray(cartData)) return cartData;
    if (cartData && typeof cartData === 'object' && (cartData as any).items) return (cartData as any).items;
    return [];
  }, [cartData]);

  const collectionIds = useMemo(() => {
    const ids = items.map((item: any) => item.product?.collectionId).filter(Boolean);
    return ids.filter((v: any, i: number, a: any[]) => a.indexOf(v) === i);
  }, [items]);

  const { data: installmentPlansData } = useQuery({
    queryKey: ["activeInstallmentPlans", collectionIds],
    queryFn: async () => {
      if (collectionIds.length === 0) return endpoints.installments.active();
      const plans = await Promise.all(
        collectionIds.map((id: number) => endpoints.installments.active(id))
      );
      // Flat and unique
      return plans.flat().filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    },
    enabled: !!user && items.length > 0,
  });

  const availablePlans = (installmentPlansData as any[]) || [];

  const subtotal = useMemo(() => {
    return items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.product?.price || 0)), 0);
  }, [items]);

  const total = subtotal; // Shipping and discounts would be added/subtracted here
  const couponCode = ""; // Simplified for now
  const gateways = (gatewaysData as any[]) || [];

  // Mutations
  const placeOrderMutation = useMutation({
    mutationFn: (data: any) => endpoints.orders.create(data),
    onSuccess: (data) => {
      // API returns { orders: [], checkoutUrl: string }
      const result = data;

      // If there's a checkoutUrl, redirect to it
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      setOrderResult(result.orders?.[0]);
      setStep("success");
      toast.success(language === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Order placed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء تقديم الطلب' : 'Error placing order'));
    },
  });

  const queryClient = useQueryClient();
  const redeemGiftCardMutation = useMutation({
    mutationFn: (code: string) => endpoints.giftCards.redeem(code),
    onSuccess: (data) => {
      toast.success(language === 'ar' ? 'تم شحن الكارت بنجاح في محفظتك' : 'Gift card redeemed successfully to your wallet');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setFormData(prev => ({ ...prev, paymentMethod: 'wallet' }));
      setGiftCardCode("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'كود غير صالح أو مستخدم من قبل' : 'Invalid or already used code'));
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    if (!formData.address || !formData.city) {
      toast.error(language === 'ar' ? 'يرجى إكمال بيانات الشحن' : 'Please complete shipping address');
      return;
    }

    const walletBal = walletData?.wallet?.balance ?? 0;
    const isWallet = formData.paymentMethod === 'wallet';
    const walletAmountUsed = isWallet ? Math.min(walletBal, total) : 0;
    const topUpMethod = formData.topUpMethod;

    if (isWallet && walletBal < total && !topUpMethod) {
      toast.error(language === 'ar' ? 'يرجى اختيار طريقة دفع للمبلغ المتبقي' : 'Please select payment method for the remainder');
      return;
    }

    // Validation for online payments
    const isOnline = !['cash', 'wallet', 'installments'].includes(formData.paymentMethod);
    if (isOnline && (!formData.cardNumber || !formData.cardExpiry)) {
      // For now we allow redirecting to gateways with just the method selection
      // but if we show card fields, we should validate them.
      // toast.error(language === 'ar' ? 'يرجى إدخال بيانات البطاقة' : 'Please enter card details');
    }

    // Check quantity limit again (only validate against actual cart items)
    if (formData.paymentMethod === 'installments' && items.length > 0) {
      const intentRaw = localStorage.getItem('wolf_payment_intent');
      if (intentRaw) {
        const intent = JSON.parse(intentRaw);
        const totalItems = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

        const minQ = intent.minQuantity || 1;
        const maxQ = intent.maxQuantity || 0;

        if (totalItems < minQ || (maxQ > 0 && totalItems > maxQ)) {
          toast.error(language === 'ar'
            ? `هذا النظام يدعم عدد منتجات بين ${minQ} و ${maxQ > 0 ? maxQ : '∞'}`
            : `This plan only supports between ${minQ} and ${maxQ > 0 ? maxQ : 'unlimited'} items`);
          return;
        }
      }
    }

    placeOrderMutation.mutate({
      shippingAddress: {
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        zipCode: formData.zipCode
      },
      paymentMethod: formData.paymentMethod,
      couponCode: couponCode || undefined,
      installmentPlanId: formData.paymentMethod === 'installments' ? formData.installmentPlanId : undefined,
      kycData: kycData,
      walletAmountUsed,
      topUpMethod
    });
  };

  // Wait for loading or background fetching if items are empty (to prevent stale cache from showing "Empty cart" too early)
  if (isCartLoading || (isCartFetching && items.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0 && step !== "success" && step !== "kyc" && !placeOrderMutation.isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <Receipt size={64} className="text-gray-200 mb-6" />
        <h2 className="text-3xl font-black text-gray-900 mb-2 font-arabic">{language === 'ar' ? 'السلة فارغة' : 'Cart is Empty'}</h2>
        <p className="text-gray-500 mb-8 font-bold">{language === 'ar' ? 'ابدأ بالتسوق الآن لإضافة المنتجات' : 'Start shopping now to add items'}</p>
        <Button onClick={() => setLocation("/")} className="rounded-full px-10 h-14 bg-primary text-lg font-bold shadow-lg shadow-primary/20">
          {language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
        </Button>
      </div>
    );
  }

  const getGatewayIcon = (name: string) => {
    switch (name) {
      case 'stripe': return CreditCard;
      case 'paymob': return CreditCard;
      case 'ccavenue': return Globe;
      case 'tigerpay': return ShieldCheck;
      case 'mamo': return Zap;
      case 'paymennt': return CreditCard;
      case 'utap': return QrCode;
      case 'my_network': return Globe;
      case 'omnispay': return CreditCard;
      case 'vaultspay': return Shield;
      case 'afspro': return ShieldCheck;
      case 'payby': return Phone;
      case 'geidea': return CreditCard;
      case 'dpo_pay': return Globe;
      case 'cash_on_delivery': return Banknote;
      case 'wallet': return Wallet;
      case 'installments': return UserCheck;
      default: return CreditCard;
    }
  };

  const paymentMethods = [
    ...gateways.map(g => {
      const gName = g.name.toLowerCase();
      const isCard = gName.includes('stripe') || gName.includes('paymob') || gName.includes('ccavenue') || gName.includes('card') || gName.includes('checkout');
      return {
        id: g.name,
        label: isCard ? (language === 'ar' ? 'بطاقة بنكية (فيزا/ماستركارد)' : 'Bank Card (Visa/MasterCard)') : (language === 'ar' ? g.displayNameAr : g.displayNameEn),
        Icon: getGatewayIcon(g.name),
        isCard
      }
    }),
    // If no card gateway exists, add a placeholder "Bank Card"
    ...((!gateways.some(g => {
      const gn = g.name.toLowerCase();
      return gn.includes('stripe') || gn.includes('paymob') || gn.includes('card') || gn.includes('checkout');
    })) ? [{
      id: 'card',
      label: language === 'ar' ? 'بطاقة بنكية (فيزا/ماستركارد)' : 'Bank Card (Visa/MasterCard)',
      Icon: CreditCard,
      isCard: true
    }] : []),
    { id: 'wallet', label: language === 'ar' ? 'المحفظة' : 'Wallet', Icon: Wallet, isCard: false },
    { id: 'gift_card', label: language === 'ar' ? 'كارت هدية' : 'Gift Card', Icon: Gift, isCard: false },
    { id: 'cash', label: language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery', Icon: Banknote, isCard: false },
    { id: 'installments', label: language === 'ar' ? 'تقسيط WOLF' : 'WOLF TECHNO Installments', Icon: UserCheck, isCard: false },
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // dedupe

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-8 md:pt-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-[80px] md:top-[112px] z-40 py-6">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase font-arabic">{language === 'ar' ? 'إتمام الدفع' : 'Checkout'}</h1>
            <div className="flex items-center gap-8 font-bold text-sm tracking-widest uppercase text-gray-400 font-arabic">
              {formData.paymentMethod === 'installments' ? (
                <>
                  <div className={`flex items-center gap-2 ${['kyc', 'shipping', 'review'].includes(step) ? 'text-primary' : ''}`}>
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${['kyc', 'shipping', 'review'].includes(step) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>1</span>
                    <span>{language === 'ar' ? 'التحقق' : 'KYC'}</span>
                  </div>
                  <ChevronLeft size={16} />
                  <div className={`flex items-center gap-2 ${['shipping', 'review'].includes(step) ? 'text-primary' : ''}`}>
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${['shipping', 'review'].includes(step) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>2</span>
                    <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  </div>
                  <ChevronLeft size={16} />
                  <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : ''}`}>
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${step === 'review' ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>3</span>
                    <span>{language === 'ar' ? 'مراجعة' : 'Review'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={`flex items-center gap-2 ${['shipping', 'payment', 'review'].includes(step) ? 'text-primary' : ''}`}>
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${['shipping', 'payment', 'review'].includes(step) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>1</span>
                    <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  </div>
                  <ChevronLeft size={16} />
                  <div className={`flex items-center gap-2 ${['payment', 'review'].includes(step) ? 'text-primary' : ''}`}>
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${['payment', 'review'].includes(step) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>2</span>
                    <span>{language === 'ar' ? 'الدفع' : 'Payment'}</span>
                  </div>
                  <ChevronLeft size={16} />
                  <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : ''}`}>
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${step === 'review' ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>3</span>
                    <span>{language === 'ar' ? 'مراجعة' : 'Review'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl mt-12">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === "shipping" && (
                <motion.div key="shipping" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 text-right font-arabic">
                    <h2 className="text-3xl font-black text-gray-900 mb-8">{language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{language === 'ar' ? 'الاسم الأول' : 'First Name'}</label>
                        <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-lg text-black font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{language === 'ar' ? 'اسم العائلة' : 'Last Name'}</label>
                        <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-lg text-black font-bold" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{language === 'ar' ? 'العنوان' : 'Address'}</label>
                        <Input name="address" value={formData.address} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-lg text-black font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{language === 'ar' ? 'المدينة' : 'City'}</label>
                        <Input name="city" value={formData.city} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-lg text-black font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">الإمارات</label>
                        <Input name="country" value={formData.country} readOnly className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-lg text-gray-400" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <Input name="phone" value={formData.phone} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-lg text-black font-bold" />
                      </div>
                    </div>
                    <Button
                      onClick={() => setStep(formData.paymentMethod === 'installments' ? "review" : "payment")}
                      className="w-full h-16 rounded-full mt-12 bg-primary hover:bg-primary/90 text-xl font-bold text-white shadow-xl shadow-primary/20 group uppercase"
                    >
                      {language === 'ar' ? (formData.paymentMethod === 'installments' ? 'مراجعة الطلب' : 'متابعة للدفع') : (formData.paymentMethod === 'installments' ? 'Review Order' : 'Continue to Payment')}
                      <ChevronLeft className="mr-3 group-hover:-translate-x-2 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 text-right">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 font-arabic">
                    <h2 className="text-3xl font-black text-gray-900 mb-8">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                      {paymentMethods.map((method: any) => (
                        <button
                          key={method.id}
                          onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                          className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all group ${formData.paymentMethod === method.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-gray-50 bg-gray-50 hover:border-primary/30 hover:bg-white'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 ${formData.paymentMethod === method.id ? 'bg-primary text-white' : 'bg-white text-gray-400'}`}>
                            <method.Icon size={20} />
                          </div>
                          <span className={`text-sm font-black transition-colors ${formData.paymentMethod === method.id ? 'text-primary' : 'text-gray-500'}`}>{method.label}</span>
                          {method.id === 'wallet' && walletData?.wallet && (
                            <span className="text-xs font-bold text-emerald-600 mt-2">{formatPrice(walletData.wallet.balance)}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Method Views */}
                    {(() => {
                      const selectedMethod = paymentMethods.find(m => m.id === formData.paymentMethod);
                      const isCardMain = selectedMethod?.isCard || formData.paymentMethod === 'card';
                      const isCardTopUp = formData.paymentMethod === 'wallet' && formData.topUpMethod === 'card';

                      if (isCardMain || isCardTopUp) {
                        return (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-8">
                              <div className="md:col-span-2 space-y-2">
                                <label className="font-bold text-gray-700 text-sm">الاسم على البطاقة</label>
                                <Input name="cardName" value={formData.cardName} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold" />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <label className="font-bold text-gray-700 text-sm">رقم البطاقة</label>
                                <Input name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold" placeholder="0000 0000 0000 0000" />
                              </div>
                              <div className="space-y-2">
                                <label className="font-bold text-gray-700 text-sm">تاريخ الانتهاء</label>
                                <Input name="cardExpiry" value={formData.cardExpiry} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold" placeholder="MM / YY" />
                              </div>
                              <div className="space-y-2">
                                <label className="font-bold text-gray-700 text-sm">CVV</label>
                                <Input name="cardCVC" value={formData.cardCVC} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold" placeholder="***" type="password" maxLength={3} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                      return null;
                    })()}

                    {formData.paymentMethod === 'wallet' && (() => {
                      const walletBal = walletData?.wallet?.balance ?? 0;
                      const isFull = walletBal >= total;
                      const shortfall = Math.max(0, total - walletBal);
                      return (
                        <div className="space-y-5">
                          <div className={`rounded-[2rem] p-7 border-2 text-center ${isFull ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <Wallet size={40} className={`mx-auto mb-3 ${isFull ? 'text-emerald-600' : 'text-amber-600'}`} />
                            <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">رصيد المحفظة</p>
                            <p className={`text-4xl font-black mb-1 ${isFull ? 'text-emerald-600' : 'text-amber-600'}`}>{formatPrice(walletBal)}</p>
                            {isFull ? (
                              <p className="text-emerald-700 font-bold text-sm">✓ رصيدك كافٍ</p>
                            ) : (
                              <p className="text-amber-700 font-bold text-sm">رصيدك غير كافٍ — ناقص {formatPrice(shortfall)}</p>
                            )}
                          </div>
                          {!isFull && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <Button variant={formData.topUpMethod === 'card' ? 'default' : 'outline'} onClick={() => setFormData({ ...formData, topUpMethod: 'card' })} className={`h-12 rounded-xl border-gray-300 font-bold ${formData.topUpMethod !== 'card' ? 'text-gray-900 shadow-sm' : ''}`}>بطاقة بنكية</Button>
                              <Button variant={formData.topUpMethod === 'cash' ? 'default' : 'outline'} onClick={() => setFormData({ ...formData, topUpMethod: 'cash' })} className={`h-12 rounded-xl border-gray-300 font-bold ${formData.topUpMethod !== 'cash' ? 'text-gray-900 shadow-sm' : ''}`}>دفع عند التسليم</Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {formData.paymentMethod === 'gift_card' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-purple-50 p-8 rounded-[2rem] border-2 border-purple-100 text-center">
                          <Gift size={40} className="mx-auto mb-4 text-purple-600" />
                          <h3 className="text-xl font-black text-gray-900 mb-2">{language === 'ar' ? 'لديك كارت هدية؟' : 'Have a Gift Card?'}</h3>
                          <p className="text-sm text-gray-500 font-bold mb-6">{language === 'ar' ? 'أدخل الكود أدناه لشحن الرصيد فوراً في محفظتك' : 'Enter the code below to instantly top up your wallet'}</p>
                          <div className="flex gap-3">
                            <Input
                              value={giftCardCode}
                              onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                              placeholder="XXXX-XXXX-XXXX"
                              className="h-14 rounded-xl bg-white border-2 border-purple-100 text-center font-mono text-xl tracking-widest focus-visible:ring-purple-500 text-black font-bold"
                            />
                            <Button
                              onClick={() => redeemGiftCardMutation.mutate(giftCardCode)}
                              disabled={!giftCardCode || redeemGiftCardMutation.isPending}
                              className="h-14 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shrink-0"
                            >
                              {redeemGiftCardMutation.isPending ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'تفعيل' : 'Redeem')}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {formData.paymentMethod === 'installments' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 text-right mb-4">{language === 'ar' ? 'اختر خطة التقسيط المناسبة' : 'Choose Installment Plan'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availablePlans.map((plan: any) => (
                            <button
                              key={plan.id}
                              onClick={() => setFormData({ ...formData, installmentPlanId: plan.id })}
                              className={`flex flex-col p-6 rounded-[2.5rem] border-2 transition-all text-right group ${formData.installmentPlanId === plan.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-gray-100 bg-white hover:border-primary/30'}`}
                            >
                              <div className="flex justify-between items-center mb-4 w-full">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.installmentPlanId === plan.id ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50'}`}>
                                  {formData.installmentPlanId === plan.id && <CheckCircle2 size={16} />}
                                </div>
                                <span className="font-black text-lg text-gray-900">{plan.name}</span>
                              </div>
                              <div className="space-y-3 text-sm font-bold text-gray-500">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                  <span>{plan.months} {language === 'ar' ? 'أشهر' : 'Months'}</span>
                                  <span>{language === 'ar' ? 'مدة التقسيط:' : 'Duration:'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                  <span>{plan.downPaymentPercentage}%</span>
                                  <span>{language === 'ar' ? 'مقدم الدفع:' : 'Down Payment:'}</span>
                                </div>
                                <div className="flex justify-between items-center text-primary pt-1">
                                  <span className="text-lg font-black">{formatPrice((total * (1 - plan.downPaymentPercentage / 100)) / plan.months)}</span>
                                  <span>{language === 'ar' ? 'القسط الشهري:' : 'Monthly Payment:'}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                          {availablePlans.length === 0 && (
                            <div className="col-span-full p-12 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                              <AlertCircle size={40} className="mx-auto mb-4 text-gray-400 opacity-50" />
                              <p className="font-bold text-gray-500">{language === 'ar' ? 'لا توجد خطط تقسيط متاحة لهذه المنتجات حالياً' : 'No installment plans available for these products'}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-12 font-arabic">
                      <Button onClick={() => setStep("shipping")} variant="outline" className="h-16 rounded-full border-2 text-xl font-bold text-gray-900 border-gray-300">العودة</Button>
                      <Button
                        onClick={() => {
                          if (formData.paymentMethod === 'installments') {
                            if (!formData.installmentPlanId) {
                              toast.error(language === 'ar' ? "يرجى اختيار خطة تقسيط" : "Please select an installment plan");
                              return;
                            }
                            setStep("kyc");
                            return;
                          }
                          const isCardMain = formData.paymentMethod === 'card' || paymentMethods.find(m => m.id === formData.paymentMethod)?.isCard;
                          if (isCardMain && !formData.cardNumber) {
                            toast.error(language === 'ar' ? "يرجى إكمال بيانات البطاقة" : "Please complete card details"); return;
                          }
                          const walletBal = walletData?.wallet?.balance ?? 0;
                          if (formData.paymentMethod === 'wallet' && walletBal < total && !formData.topUpMethod) {
                            toast.error(language === 'ar' ? "يرجى اختيار طريقة دفع للمتبقي" : "Please select payment method for the remainder"); return;
                          }
                          if (formData.paymentMethod === 'wallet' && formData.topUpMethod === 'card' && !formData.cardNumber) {
                            toast.error(language === 'ar' ? "يرجى إكمال بيانات البطاقة للمبلغ المتبقي" : "Please complete card details for the remainder"); return;
                          }
                          setStep("review");
                        }}
                        className="h-16 rounded-full bg-primary hover:bg-primary/90 text-xl font-bold group text-white"
                      >
                        مراجعة الطلب <ChevronLeft className="mr-3 group-hover:-translate-x-2 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "kyc" && (
                <KYCStep
                  onBack={() => {
                    // If we were forced into KYC from the start, back should go to cart or payment
                    if (formData.paymentMethod === 'installments') {
                      setStep("payment"); // Allow changing payment method if they back out of KYC
                    } else {
                      setStep("payment");
                    }
                  }}
                  onComplete={(data) => {
                    setKycData(data);
                    // If we haven't filled shipping yet, go to shipping
                    if (!formData.address || !formData.city) {
                      setStep("shipping");
                    } else {
                      setStep("review");
                    }
                  }}
                />
              )}

              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 text-right font-arabic">
                    <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">مراجعة الطلب</h2>
                    <p className="text-gray-500 text-center mb-12 text-lg">أنت على وشك اقتناء أفضل المنتجات التقنية</p>
                    <div className="grid grid-cols-2 gap-4 mt-16">
                      <Button onClick={() => setStep(formData.paymentMethod === 'installments' ? "shipping" : "payment")} variant="outline" className="h-16 rounded-full border-2 text-xl font-bold font-arabic text-gray-900 border-gray-300">العودة</Button>
                      <Button onClick={handlePlaceOrder} disabled={placeOrderMutation.isPending} className="h-16 rounded-full bg-primary hover:bg-primary/90 text-xl font-bold text-white shadow-xl shadow-primary/20 font-arabic">
                        {placeOrderMutation.isPending ? <Loader2 className="animate-spin" /> : 'تأكيد الطلب'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "success" && orderResult && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-green-50 text-center font-arabic">
                  {orderResult.paymentStatus === 'pending_kyc_review' ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 shadow-inner shadow-blue-200">
                        <Loader2 size={40} className="text-blue-500 animate-spin" />
                      </div>
                      <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">طلب التقسيط قيد المراجعة</h2>
                      <p className="text-xl text-gray-500 font-bold mb-4">نشكرك على تقديم طلب التقسيط رقم <span className="text-primary tracking-widest text-2xl ml-2">#{orderResult.orderNumber}</span></p>
                      <p className="text-md text-gray-400 font-bold mb-10 max-w-sm mx-auto">نقوم حالياً بمراجعة مستنداتك والموافقة على الطلب. سنقوم بإشعارك قريباً لدفع الدفعة الأولى.</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={64} className="text-green-500 mx-auto mb-8" />
                      <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">تهانينا! تم استلام طلبك</h2>
                      <p className="text-xl text-gray-500 font-bold mb-10">رقم الطلب الخاص بك هو <span className="text-primary tracking-widest text-2xl ml-2">#{orderResult.orderNumber}</span></p>
                    </>
                  )}
                  <Button onClick={() => {
                    localStorage.removeItem('wolf_payment_intent');
                    setLocation("/orders");
                  }} className="rounded-full px-12 h-16 bg-gray-950 text-xl font-bold hover:bg-black transition-all shadow-2xl shadow-gray-900/40 hover:shadow-gray-900/60 hover:-translate-y-1">
                    متابعة طلباتي
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 text-right sticky top-40 font-arabic">
              <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">ملخص الطلب</h3>
              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto scrollbar-hide">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-end gap-5">
                    <div className="grow text-right">
                      <p className="font-bold text-gray-900 truncate max-w-[120px]">{language === 'ar' ? item.product?.nameAr : item.product?.nameEn}</p>
                      <p className="text-sm text-gray-400">الكمية: {item.quantity}</p>
                    </div>
                    <img src={item.product?.images?.[0]} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-6 rounded-[2rem] mt-8">
                <span className="font-black text-primary text-3xl tracking-tighter">{formatPrice(total)}</span>
                <span className="text-gray-900 font-black text-xl">المجموع</span>
              </div>

              {formData.paymentMethod === 'installments' && (() => {
                const intentRaw = localStorage.getItem('wolf_payment_intent');
                if (!intentRaw) return null;
                const intent = JSON.parse(intentRaw);
                return (
                  <div className="mt-6 space-y-3 bg-purple-50 p-6 rounded-[2rem] border-2 border-purple-100">
                    <div className="flex justify-between items-center text-sm font-bold text-purple-700">
                      <span>{formatPrice(intent.total)}</span>
                      <span>الإجمالي بالفوائد</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-purple-900 pt-3 border-t border-purple-200">
                      <span>{formatPrice(intent.downPayment)}</span>
                      <span>الدفعة الأولى (تُدفع الآن)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-purple-500">
                      <span>{formatPrice(intent.financedAmount)}</span>
                      <span>المبلغ المتبقي للأقساط</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div >
      </div >
    </div >
  );
}
