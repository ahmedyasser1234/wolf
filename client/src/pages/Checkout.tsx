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

type CheckoutStep = "shipping" | "kyc" | "deposit" | "success";

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

  const [step, setStep] = useState<CheckoutStep>("shipping");

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || "",
    lastName: user?.name?.split(' ')[1] || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: "",
    country: "United Arab Emirates",
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
  const [depositMethod, setDepositMethod] = useState<'wallet' | 'card' | 'gift_card'>('card');
  const [depositGiftCardCode, setDepositGiftCardCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // Show toast if starting at KYC
  useEffect(() => {
    if (step === 'kyc') {
      toast.info(language === 'ar' ? "يرجى إكمال التحقق من الهوية للمتابعة" : "Please complete identity verification to proceed");
    }
  }, [language]);

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

  const total = subtotal; // Shipping would be added here

  const discountAmount = appliedCoupon ? (total * appliedCoupon.discountPercent) / 100 : 0;
  const finalTotal = total - discountAmount;

  const gateways = (gatewaysData as any[]) || [];

  const validateCouponMutation = useMutation({
    mutationFn: (code: string) => endpoints.coupons.validate(code),
    onSuccess: (data) => {
      setAppliedCoupon(data);
      toast.success(language === 'ar' ? 'تم تطبيق كود الخصم بنجاح' : 'Coupon applied successfully');
    },
    onError: (err: any) => {
      setAppliedCoupon(null);
      toast.error(err.response?.data?.message || (language === 'ar' ? 'كود الخصم غير صالح' : 'Invalid coupon code'));
    }
  });

  // Mutations
  const placeOrderMutation = useMutation({
    mutationFn: (data: any) => endpoints.orders.create(data),
    onSuccess: (data) => {
      const result = data;

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      setOrderResult(result.orders?.[0]);
      setStep("success");
      toast.success(language === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Order placed successfully');
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      const baseMsg = language === 'ar' ? 'حدث خطأ أثناء تقديم الطلب' : 'Error placing order';
      toast.error(`${baseMsg}${status ? ` (${status})` : ''}${message ? `: ${message}` : ''}`);
    },
  });

  const queryClient = useQueryClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    if (!formData.address || !formData.city) {
      toast.error(language === 'ar' ? 'يرجى إكمال بيانات الشحن' : 'Please complete shipping address');
      return;
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
      couponCode: appliedCoupon?.code || undefined,
      installmentPlanId: formData.paymentMethod === 'installments' ? formData.installmentPlanId : undefined,
      kycData: kycData,
      depositPaymentMethod: formData.paymentMethod === 'installments' ? depositMethod : undefined,
      depositGiftCardCode: formData.paymentMethod === 'installments' ? depositGiftCardCode : undefined,
    });
  };

  const currentIntent = intent;

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
      default: return CreditCard;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 w-full page-container mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 relative z-40 pt-2 pb-4 md:py-6 w-full">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
            <h1 className="checkout-title font-black text-gray-900 tracking-tighter uppercase font-arabic">{t('checkoutReady')}</h1>
            <div className="steps-container font-bold text-gray-400 font-arabic">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 shrink-0 ${['shipping', 'kyc', 'deposit'].includes(step) ? 'text-primary' : ''}`}>
                  <span className={`step-number border-2 ${['shipping', 'kyc', 'deposit'].includes(step) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>1</span>
                  <span className="step-label">{t('shippingInfo')}</span>
                </div>
                <ChevronLeft className={`step-divider text-gray-300 shrink-0 ${language === 'en' ? 'rotate-180' : ''}`} />
                {formData.paymentMethod === 'installments' && (
                  <>
                    <div className={`flex items-center gap-2 shrink-0 ${['kyc', 'deposit'].includes(step) ? 'text-primary' : ''}`}>
                      <span className={`step-number border-2 ${['kyc', 'deposit'].includes(step) ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>2</span>
                      <span className="step-label">{language === 'ar' ? 'التحقق' : 'KYC'}</span>
                    </div>
                    <ChevronLeft className={`step-divider text-gray-300 shrink-0 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </>
                )}
                <div className={`flex items-center gap-2 shrink-0 ${step === 'deposit' ? 'text-primary' : ''}`}>
                  <span className={`step-number border-2 ${step === 'deposit' ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200'}`}>{formData.paymentMethod === 'installments' ? 3 : 2}</span>
                  <span className="step-label">{formData.paymentMethod === 'installments' ? (language === 'ar' ? 'دفع المقدم' : 'Deposit') : (language === 'ar' ? 'تأكيد' : 'Confirm')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 max-w-7xl mt-4 md:mt-8 w-full overflow-x-hidden">
        <div className="grid lg:grid-cols-12 gap-6 md:gap-12">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === "shipping" && (
                <motion.div key="shipping" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="bg-white p-6 sm:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-50 text-right font-arabic w-full">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-6 md:mb-10">{t('shippingInfo')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8">
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{t('firstName')}</label>
                        <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold w-full focus-visible:ring-primary text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{t('lastName')}</label>
                        <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold w-full focus-visible:ring-primary text-base" />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{t('address')}</label>
                        <Input name="address" value={formData.address} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold w-full focus-visible:ring-primary text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{t('city')}</label>
                        <Input name="city" value={formData.city} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold w-full focus-visible:ring-primary text-base" />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{language === 'ar' ? 'الدولة' : 'Country'}</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="h-14 w-full rounded-2xl bg-gray-50 border-none px-6 text-black font-bold focus-visible:ring-primary text-base appearance-none cursor-pointer"
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        >
                          <option value="United Arab Emirates">🇦🇪 الإمارات العربية المتحدة - UAE</option>
                          <option value="Saudi Arabia">🇸🇦 المملكة العربية السعودية - Saudi Arabia</option>
                          <option value="Kuwait">🇰🇼 الكويت - Kuwait</option>
                          <option value="Qatar">🇶🇦 قطر - Qatar</option>
                          <option value="Bahrain">🇧🇭 البحرين - Bahrain</option>
                          <option value="Oman">🇴🇲 عُمان - Oman</option>
                          <option value="Egypt">🇪🇬 مصر - Egypt</option>
                          <option value="Jordan">🇯🇴 الأردن - Jordan</option>
                          <option value="Lebanon">🇱🇧 لبنان - Lebanon</option>
                          <option value="Iraq">🇮🇶 العراق - Iraq</option>
                          <option value="Yemen">🇾🇪 اليمن - Yemen</option>
                          <option value="Libya">🇱🇾 ليبيا - Libya</option>
                          <option value="Tunisia">🇹🇳 تونس - Tunisia</option>
                          <option value="Algeria">🇩🇿 الجزائر - Algeria</option>
                          <option value="Morocco">🇲🇦 المغرب - Morocco</option>
                          <option value="Sudan">🇸🇩 السودان - Sudan</option>
                          <option value="Syria">🇸🇾 سوريا - Syria</option>
                          <option value="Palestine">🇵🇸 فلسطين - Palestine</option>
                          <option disabled>──────────────</option>
                          <option value="United States">🇺🇸 United States</option>
                          <option value="United Kingdom">🇬🇧 United Kingdom</option>
                          <option value="Canada">🇨🇦 Canada</option>
                          <option value="Australia">🇦🇺 Australia</option>
                          <option value="Germany">🇩🇪 Germany</option>
                          <option value="France">🇫🇷 France</option>
                          <option value="Turkey">🇹🇷 Turkey</option>
                          <option value="India">🇮🇳 India</option>
                          <option value="Pakistan">🇵🇰 Pakistan</option>
                          <option value="Other">🌍 {language === 'ar' ? 'دولة أخرى' : 'Other'}</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="font-bold text-gray-700 text-sm">{t('phone')}</label>
                        <Input name="phone" value={formData.phone} onChange={handleInputChange} className="h-14 rounded-2xl bg-gray-50 border-none px-6 text-black font-bold w-full focus-visible:ring-primary text-base" />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (formData.paymentMethod === 'installments') setStep("kyc");
                        else setStep("deposit");
                      }}
                      className="w-full h-14 md:h-16 rounded-full mt-8 md:mt-12 bg-primary hover:bg-primary/90 text-lg md:text-xl font-bold text-white shadow-xl shadow-primary/20 group"
                    >
                      {formData.paymentMethod === 'installments' ? (language === 'ar' ? 'التالي: رفع الأوراق' : 'Next: Upload Docs') : (language === 'ar' ? 'تأكيد الطلب' : 'Confirm Order')}
                      <ChevronLeft className={`mr-2 group-hover:-translate-x-2 transition-transform ${language === 'en' ? 'rotate-180 group-hover:translate-x-2' : ''}`} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "kyc" && (
                <KYCStep
                  onBack={() => setStep("shipping")}
                  onComplete={(data) => {
                    setKycData(data);
                    setStep("deposit");
                  }}
                />
              )}

              {step === "deposit" && (
                <motion.div key="deposit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                  <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-50 text-right font-arabic">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">
                      {formData.paymentMethod === 'installments' ? (language === 'ar' ? 'دفع مقدم التقسيط' : 'Pay Down Payment') : (language === 'ar' ? 'مراجعة الطلب' : 'Review Order')}
                    </h2>

                    {formData.paymentMethod === 'installments' && (
                      <div className="mb-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex justify-between items-center">
                        <span className="text-2xl font-black text-purple-900">{formatPrice(currentIntent?.downPayment || 0)}</span>
                        <span className="font-bold text-purple-700 text-lg">مبلغ المقدم المطلوب</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="font-bold text-gray-600 mb-4">{language === 'ar' ? 'اختر طريقة الدفع للمقدم:' : 'Select deposit payment method:'}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'card', label: language === 'ar' ? 'بطاقة بنكية' : 'Bank Card', Icon: CreditCard },
                          { id: 'wallet', label: language === 'ar' ? 'المحفظة' : 'Wallet', Icon: Wallet },
                          { id: 'gift_card', label: language === 'ar' ? 'كارت هدية' : 'Gift Card', Icon: Gift },
                        ].map((m) => (
                          <div
                            key={m.id}
                            onClick={() => setDepositMethod(m.id as any)}
                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 ${depositMethod === m.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                          >
                            <m.Icon className={`w-8 h-8 ${depositMethod === m.id ? 'text-primary' : 'text-gray-400'}`} />
                            <span className={`font-bold ${depositMethod === m.id ? 'text-primary' : 'text-gray-600'}`}>{m.label}</span>
                          </div>
                        ))}
                      </div>

                      {depositMethod === 'gift_card' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                          <label className="font-bold text-gray-700">{language === 'ar' ? 'كود كارت الهدية' : 'Gift Card Code'}</label>
                          <Input
                            value={depositGiftCardCode}
                            onChange={(e) => setDepositGiftCardCode(e.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX-XXXX"
                            className="h-14 rounded-xl text-center font-mono font-bold text-lg border-gray-200"
                          />
                        </motion.div>
                      )}

                      {depositMethod === 'wallet' && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl flex justify-between items-center">
                          <span className="font-bold text-blue-700">{formatPrice(walletData?.balance || 0)}</span>
                          <span className="text-blue-600 font-bold">رصيدك الحالي</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-12">
                      <Button onClick={() => setStep(formData.paymentMethod === 'installments' ? "kyc" : "shipping")} variant="outline" className="h-14 md:h-16 rounded-full border-2 text-lg font-bold font-arabic text-gray-900 border-gray-300">{t('back')}</Button>
                      <Button onClick={handlePlaceOrder} disabled={placeOrderMutation.isPending} className="h-14 md:h-16 rounded-full bg-primary hover:bg-primary/90 text-lg md:text-xl font-bold text-white shadow-xl shadow-primary/20 font-arabic">
                        {placeOrderMutation.isPending ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'إرسال الطلب' : 'Place Order')}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "success" && orderResult && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border-4 border-green-50 text-center font-arabic">
                  <CheckCircle2 size={64} className="text-green-500 mx-auto mb-8" />
                  <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                    {language === 'ar' ? 'تم إرسال طلبك بنجاح! 🎉' : 'Order Placed Successfully! 🎉'}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-500 font-bold mb-4">{t('orderNumberLabel')} <span className="text-primary tracking-widest text-xl md:text-2xl ml-2">#{orderResult.orderNumber}</span></p>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-right">
                    <p className="text-amber-800 font-bold text-base">
                      {language === 'ar'
                        ? orderResult.paymentStatus === 'pending_kyc_review'
                          ? '📋 طلبك قيد مراجعة الأوراق من الإدارة. ستتلقى إشعاراً عند الموافقة.'
                          : '💳 تم استلام طلبك ومقدم الدفع. يمكنك متابعة حالة الطلب من لوحة تحكمك.'
                        : orderResult.paymentStatus === 'pending_kyc_review'
                          ? '📋 Your order is under document review by admin. You will be notified upon approval.'
                          : '💳 Your order and deposit have been received. You can follow the status from your dashboard.'}
                    </p>
                  </div>
                  <Button onClick={() => {
                    localStorage.removeItem('wolf_payment_intent');
                    setLocation("/orders");
                  }} className="rounded-full px-8 md:px-12 h-14 md:h-16 bg-gray-950 text-lg md:text-xl font-bold hover:bg-black transition-all shadow-2xl shadow-gray-900/40 hover:shadow-gray-900/60 hover:-translate-y-1">
                    {language === 'ar' ? 'متابعة طلباتي' : 'View My Orders'}
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
            </div>

            {/* Coupon Section */}
            <div className="mt-6 mb-8 w-full">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (appliedCoupon) {
                      setAppliedCoupon(null);
                      setCouponInput("");
                    } else if (couponInput.trim()) {
                      validateCouponMutation.mutate(couponInput);
                    }
                  }}
                  disabled={validateCouponMutation.isPending || (!appliedCoupon && !couponInput.trim())}
                  variant={appliedCoupon ? "destructive" : "default"}
                  className="h-12 px-6 rounded-xl font-bold shrink-0"
                >
                  {validateCouponMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : appliedCoupon ? (language === 'ar' ? 'إزالة' : 'Remove') : (language === 'ar' ? 'تطبيق' : 'Apply')}
                </Button>
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={language === 'ar' ? 'كود الخصم (إن وجد)' : 'Discount code (if any)'}
                  disabled={!!appliedCoupon}
                  className="h-12 bg-gray-50 border-gray-100 rounded-xl font-mono text-center flex-1 font-bold text-gray-900 focus-visible:ring-primary"
                />
              </div>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between items-center bg-green-50/50 p-4 rounded-xl mt-4 border border-green-100 mb-4">
                <span className="font-bold text-green-600 text-lg">-{formatPrice(discountAmount)}</span>
                <span className="text-green-700 font-bold">{language === 'ar' ? `الخصم (${appliedCoupon.discountPercent}%)` : `Discount (${appliedCoupon.discountPercent}%)`}</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-[2rem] mt-4">
              <span className="font-black text-primary text-3xl tracking-tighter">{formatPrice(finalTotal)}</span>
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
  );
}
