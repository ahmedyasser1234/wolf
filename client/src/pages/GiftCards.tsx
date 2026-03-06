import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
    Gift, Copy, Check, Share2, ChevronRight,
    Sparkles, Heart, ArrowLeft, Loader2, MessageCircle,
    CreditCard, Wallet
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const PRESETS = [50, 100, 200, 500];

interface PurchaseResult {
    code: string;
    amount: number;
    recipientName?: string;
    checkoutUrl?: string;
}

function AnimatedCard({ amount, recipientName, language }: { amount: number; recipientName: string; language: string }) {
    return (
        <motion.div
            initial={{ rotateY: -15, scale: 0.9 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="w-full max-w-sm mx-auto"
            style={{ perspective: "1000px" }}
        >
            <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-2xl shadow-rose-500/40"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)" }}>
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-20"
                    style={{ background: "radial-gradient(circle at 30% 30%, white 0%, transparent 60%)" }} />
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/5" />

                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Gift className="w-6 h-6 text-white" />
                            <span className="text-white font-black text-sm tracking-widest uppercase">Gift Card</span>
                        </div>
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    </div>

                    <div>
                        {recipientName && (
                            <p className="text-white/60 text-xs font-bold mb-0.5">
                                {language === 'ar' ? `إلى: ${recipientName}` : `To: ${recipientName}`}
                            </p>
                        )}
                        <p className="text-white text-4xl font-black tracking-tight">
                            {amount.toLocaleString()} <span className="text-2xl">AED</span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function SuccessScreen({ result, language }: { result: PurchaseResult; language: string }) {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(result.code);
        setCopied(true);
        toast.success(language === 'ar' ? 'تم نسخ الكود!' : 'Code copied!');
        setTimeout(() => setCopied(false), 3000);
    };

    const shareWhatsApp = () => {
        const msg = language === 'ar'
            ? `🎁 هدية ليك! كارت هدية بقيمة ${result.amount} درهم\n\nاستخدم الكود: ${result.code}\nعند الدفع في متجر Wolf Techno 🛍️`
            : `🎁 A gift for you! Gift card worth ${result.amount} AED\n\nUse code: ${result.code}\nAt checkout on Wolf Techno store 🛍️`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
        >
            {/* Success icon */}
            <div className="flex justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center"
                >
                    <Check className="w-10 h-10 text-emerald-400" />
                </motion.div>
            </div>

            <div>
                <h2 className="text-3xl font-black text-white mb-2">
                    {language === 'ar' ? '🎉 تم إنشاء الكارت!' : '🎉 Gift Card Created!'}
                </h2>
                <p className="text-gray-400 font-bold">
                    {language === 'ar'
                        ? `كارت هدية بقيمة ${result.amount} درهم جاهز للمشاركة`
                        : `A ${result.amount} AED gift card is ready to share`}
                </p>
            </div>

            {/* Visual card */}
            <AnimatedCard amount={result.amount} recipientName={result.recipientName || ''} language={language} />

            {/* Code box */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-3">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {language === 'ar' ? 'كود الهدية' : 'Gift Code'}
                </p>
                <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-5 py-4 border border-gray-700">
                    <span className="flex-1 text-center font-mono font-black text-2xl text-white tracking-[0.3em]">
                        {result.code}
                    </span>
                    <button
                        onClick={copyCode}
                        className="w-10 h-10 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors text-white"
                    >
                        {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                </div>
                <p className="text-xs text-gray-500 font-bold">
                    {language === 'ar'
                        ? '* استخدم هذا الكود عند الدفع في صفحة المتجر'
                        : '* Use this code at checkout - valid for one purchase'}
                </p>
            </div>

            {/* Share button */}
            <button
                onClick={shareWhatsApp}
                className="w-full h-14 bg-[#25D366] hover:bg-[#20c05a] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-98 shadow-lg shadow-[#25D366]/20"
            >
                <MessageCircle size={22} />
                {language === 'ar' ? 'أرسل عبر واتساب' : 'Share via WhatsApp'}
            </button>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={copyCode}
                    className="h-12 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Share2 size={16} />
                    {language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                </button>
                <Link href="/products">
                    <button className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                        {language === 'ar' ? 'تسوّق الآن' : 'Shop Now'}
                        <ChevronRight size={16} />
                    </button>
                </Link>
            </div>
        </motion.div>
    );
}

export default function GiftCards() {
    const { language } = useLanguage();
    const [amount, setAmount] = useState<number>(100);
    const [customAmount, setCustomAmount] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
    const [result, setResult] = useState<PurchaseResult | null>(null);

    const { data: walletData } = useQuery({
        queryKey: ['/api/wallets/my-wallet'],
        queryFn: () => endpoints.wallets.getMyWallet()
    });

    const finalAmount = customAmount ? Number(customAmount) : amount;

    const purchaseMutation = useMutation({
        mutationFn: () => endpoints.giftCards.purchase(finalAmount, recipientName || undefined, paymentMethod),
        onSuccess: (data: PurchaseResult) => {
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
                return;
            }
            setResult(data);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message;
            toast.error(msg || (language === 'ar' ? 'فشل إنشاء الكارت. حاول مرة أخرى.' : 'Failed to create gift card. Try again.'));
        },
    });

    return (
        <div className="min-h-screen bg-gray-950 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden pt-20 pb-16"
                style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #0f0f0f 60%)" }}>
                <div className="absolute inset-0 opacity-30"
                    style={{ background: "radial-gradient(ellipse at 50% 0%, #7c3aed 0%, transparent 70%)" }} />
                <div className="container mx-auto px-4 text-center relative z-10 mt-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
                                <Gift className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white">
                            {language === 'ar' ? '🎁 جيفت كارد' : '🎁 Gift Cards'}
                        </h1>
                        <p className="text-gray-400 text-xl font-bold max-w-md mx-auto">
                            {language === 'ar'
                                ? 'اشترِ كارت هدية بأي مبلغ وأهده لمن تحب!'
                                : 'Buy a gift card for any amount and gift it to someone special!'}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-lg -mt-6 relative z-10">
                <AnimatePresence mode="wait">
                    {result ? (
                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SuccessScreen result={result} language={language} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Live preview card */}
                            <AnimatedCard amount={finalAmount || 0} recipientName={recipientName} language={language} />

                            <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-8 space-y-7">
                                {/* Amount presets */}
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-300 uppercase tracking-widest">
                                        {language === 'ar' ? 'اختر القيمة' : 'Select Amount'}
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {PRESETS.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => { setAmount(p); setCustomAmount(''); }}
                                                className={`h-12 rounded-xl font-black text-sm transition-all ${!customAmount && amount === p
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Custom amount */}
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={10}
                                            max={10000}
                                            value={customAmount}
                                            onChange={e => setCustomAmount(e.target.value)}
                                            placeholder={language === 'ar' ? 'أو أدخل مبلغاً مخصصاً (AED)' : 'Or enter custom amount (AED)'}
                                            className={`h-14 bg-gray-800 border-gray-700 text-white rounded-2xl px-5 text-lg font-black placeholder:text-gray-600 focus-visible:ring-purple-500 ${language === 'ar' ? 'pr-14' : 'pl-14'}`}
                                            dir="ltr"
                                        />
                                        {customAmount && (
                                            <span className={`absolute top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm ${language === 'ar' ? 'right-4' : 'left-4'}`}>
                                                AED
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Recipient name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                        <Heart size={14} className="text-rose-400" />
                                        {language === 'ar' ? 'اسم المستقبِل (اختياري)' : "Recipient's Name (Optional)"}
                                    </label>
                                    <Input
                                        type="text"
                                        value={recipientName}
                                        onChange={e => setRecipientName(e.target.value)}
                                        placeholder={language === 'ar' ? 'مثال: محمد، سارة...' : 'e.g. John, Sara...'}
                                        className="h-14 bg-gray-800 border-gray-700 text-white rounded-2xl px-5 text-lg placeholder:text-gray-600 focus-visible:ring-purple-500"
                                    />
                                </div>

                                {/* Payment Method Selection */}
                                <div className="space-y-4">
                                    <label className="text-sm font-black text-gray-300 uppercase tracking-widest">
                                        {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'card', label: language === 'ar' ? 'بطاقة بنكية' : 'Bank Card', Icon: CreditCard },
                                            { id: 'wallet', label: language === 'ar' ? 'المحفظة' : 'Wallet', Icon: Wallet },
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(m.id as any)}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === m.id ? 'border-purple-600 bg-purple-600/10 shadow-lg shadow-purple-500/10' : 'border-gray-800 bg-gray-800/50 hover:border-gray-700 text-gray-400'}`}
                                            >
                                                <m.Icon className={`w-6 h-6 ${paymentMethod === m.id ? 'text-purple-500' : 'text-gray-500'}`} />
                                                <span className={`text-xs font-black uppercase tracking-wider ${paymentMethod === m.id ? 'text-white' : 'text-gray-500'}`}>{m.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {paymentMethod === 'wallet' && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-purple-900/20 border border-purple-800/30 rounded-2xl flex justify-between items-center">
                                            <span className="text-purple-400 font-bold">
                                                {walletData?.wallet?.balance ? `${Number(walletData.wallet.balance).toLocaleString()} AED` : '0 AED'}
                                            </span>
                                            <span className="text-xs font-black text-purple-300 uppercase tracking-widest">
                                                {language === 'ar' ? 'رصيدك المتاح' : 'Available Balance'}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>

                                {/* How it works */}
                                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 space-y-2">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                        {language === 'ar' ? 'كيف يعمل' : 'How it works'}
                                    </p>
                                    {[
                                        { ar: `ادفع ${finalAmount || '...'} درهم`, en: `Pay ${finalAmount || '...'} AED` },
                                        { ar: 'احصل على كود هدية فريد', en: 'Get a unique gift code' },
                                        { ar: 'شاركه مع من تحب', en: 'Share it with your loved one' },
                                        { ar: 'يستخدمه عند الدفع للحصول على خصم فوري', en: 'They use it at checkout for instant discount' },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-300 font-bold">
                                            <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-black shrink-0">
                                                {i + 1}
                                            </div>
                                            {language === 'ar' ? step.ar : step.en}
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <Button
                                    onClick={() => purchaseMutation.mutate()}
                                    disabled={purchaseMutation.isPending || !finalAmount || finalAmount < 10}
                                    className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
                                >
                                    {purchaseMutation.isPending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            <Gift className="mr-2" size={22} />
                                            {language === 'ar'
                                                ? `اشترِ كارت ${finalAmount || '...'} درهم`
                                                : `Buy ${finalAmount || '...'} AED Gift Card`}
                                        </>
                                    )}
                                </Button>

                                <Link href="/products">
                                    <button className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 font-bold text-sm transition-colors">
                                        <ArrowLeft size={14} />
                                        {language === 'ar' ? 'العودة للمتجر' : 'Back to Shop'}
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
