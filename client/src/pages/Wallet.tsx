import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
    Wallet, Gift, ArrowUpCircle, ArrowDownCircle, Copy, Check,
    Clock, TrendingUp, Loader2, RefreshCw, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { formatPrice, cn } from "@/lib/utils";

export default function WalletPage() {
    const { language } = useLanguage();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const [giftCode, setGiftCode] = useState("");
    const [redeemed, setRedeemed] = useState<number | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<string>("");
    const [selectedGateway, setSelectedGateway] = useState<string>("");
    const [isTopUpLoading, setIsTopUpLoading] = useState(false);

    const { data: gateways } = useQuery({
        queryKey: ["payment-gateways"],
        queryFn: () => endpoints.paymentGateways.listEnabled(),
    });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => endpoints.wallets.getMyWallet(),
    });

    const wallet = (data as any)?.wallet;
    const txns: any[] = (data as any)?.transactions ?? [];
    const balance = wallet?.balance ?? 0;

    const { data: cartData } = useQuery({
        queryKey: ["cart"],
        queryFn: () => endpoints.cart.get(),
    });
    const items = (cartData as any)?.items || [];

    const redeemMutation = useMutation({
        mutationFn: () => endpoints.giftCards.redeem(giftCode.trim().toUpperCase()),
        onSuccess: (updated: any) => {
            const amount = updated?.balance - balance;
            setRedeemed(amount > 0 ? amount : null);
            toast.success(language === "ar" ? `✅ تم إضافة ${amount} درهم للمحفظة!` : `✅ ${amount} AED added to wallet!`);
            setGiftCode("");
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || (language === "ar" ? "كود غير صالح أو مستخدم من قبل" : "Invalid or already used code"));
        },
    });

    const confirmTopUpMutation = useMutation({
        mutationFn: ({ amount, referenceId }: { amount: number; referenceId: string }) =>
            endpoints.wallets.confirmTopUp(amount, referenceId),
        onSuccess: () => {
            toast.success(language === "ar" ? "✅ تم تحديث الرصيد بنجاح!" : "✅ Balance updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('topup_success');
            url.searchParams.delete('amount');
            window.history.replaceState({}, '', url.pathname + url.search);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || (language === "ar" ? "فشل تحديث الرصيد" : "Failed to update balance"));
        }
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const isSuccess = params.get('topup_success') === 'true';
        const amount = parseFloat(params.get('amount') || "0");

        if (isSuccess && amount > 0) {
            confirmTopUpMutation.mutate({ amount, referenceId: `STRIPE_RETURN_${Date.now()}` });
        } else if (params.get('topup_cancel') === 'true') {
            toast.error(language === "ar" ? "تم إلغاء عملية الشحن" : "Top up cancelled");
            const url = new URL(window.location.href);
            url.searchParams.delete('topup_cancel');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, []);

    const handleRedeem = () => {
        if (!giftCode.trim()) {
            toast.error(language === "ar" ? "أدخل الكود أولاً" : "Enter a code first");
            return;
        }
        redeemMutation.mutate();
    };

    const handleTopUp = async () => {
        const amount = parseFloat(topUpAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error(language === "ar" ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount");
            return;
        }
        if (!selectedGateway) {
            toast.error(language === "ar" ? "اختر وسيلة دفع" : "Select a payment method");
            return;
        }

        setIsTopUpLoading(true);
        try {
            const { url } = await endpoints.wallets.createTopUpSession(amount, selectedGateway);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("Missing redirect URL");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || (language === "ar" ? "فشل شحن المحفظة" : "Top up failed"));
        } finally {
            setIsTopUpLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 pb-24">
            {/* Hero */}
            <div
                className="relative pt-24 pb-20 overflow-hidden"
                style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f0f0f 70%)" }}
            >
                <div className="absolute inset-0 opacity-30"
                    style={{ background: "radial-gradient(ellipse at 60% 0%, #059669 0%, transparent 65%)" }} />
                <div className="container mx-auto px-4 text-center relative z-10 mt-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                <Wallet className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-2">
                            {language === "ar" ? "محفظتي" : "My Wallet"}
                        </h1>

                        {/* Balance chip */}
                        {!isLoading && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-8 inline-flex flex-col items-center gap-1"
                            >
                                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                                    {language === "ar" ? "الرصيد المتاح" : "Available Balance"}
                                </span>
                                <span className="text-6xl font-black text-emerald-400 tabular-nums">
                                    {balance.toFixed(2)}
                                </span>
                                <span className="text-2xl text-gray-400 font-bold">AED</span>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-2xl -mt-8 relative z-10 space-y-6">
                {/* Add Funds */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-gray-800 rounded-[2rem] p-7"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-base">
                                {language === "ar" ? "شحن المحفظة" : "Add Funds"}
                            </h3>
                            <p className="text-xs text-gray-500 font-bold">
                                {language === "ar" ? "أضف رصيد لمواصلة التسوق" : "Add balance to continue shopping"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Input
                                type="number"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-14 bg-gray-800 border-gray-700 text-white font-black text-2xl text-center rounded-2xl focus-visible:ring-emerald-500"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">AED</div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {gateways?.map((gw: any) => (
                                <button
                                    key={gw.id}
                                    onClick={() => setSelectedGateway(gw.key)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all text-xs font-bold",
                                        selectedGateway === gw.key
                                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                                    )}
                                >
                                    {language === "ar" ? gw.nameAr : gw.nameEn}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={handleTopUp}
                            disabled={isTopUpLoading || !topUpAmount || !selectedGateway}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 transition-all"
                        >
                            {isTopUpLoading ? <Loader2 className="animate-spin" /> : (language === "ar" ? "اشحن الآن" : "Top up Now")}
                        </Button>
                    </div>
                </motion.div>

                {/* Redeem Gift Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900 border border-gray-800 rounded-[2rem] p-7"
                >
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-base">
                                {language === "ar" ? "استرداد جيفت كارد" : "Redeem Gift Card"}
                            </h3>
                            <p className="text-xs text-gray-500 font-bold">
                                {language === "ar" ? "أدخل الكود لإضافة الرصيد للمحفظة" : "Enter code to add balance to wallet"}
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {redeemed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-3"
                            >
                                <Check className="text-emerald-400 shrink-0" size={18} />
                                <span className="text-emerald-400 font-black text-sm">
                                    {language === "ar"
                                        ? `تم إضافة ${redeemed} درهم بنجاح ✓`
                                        : `${redeemed} AED added successfully ✓`}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex gap-3">
                        <Input
                            value={giftCode}
                            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                            placeholder="GIFT-XXXX-XXXX"
                            className="flex-1 h-12 bg-gray-800 border-gray-700 text-white font-mono font-black tracking-[0.2em] text-center text-sm rounded-xl placeholder:text-gray-600 placeholder:tracking-normal focus-visible:ring-purple-500"
                            dir="ltr"
                        />
                        <Button
                            onClick={handleRedeem}
                            disabled={redeemMutation.isPending || !giftCode.trim()}
                            className="h-12 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 font-black text-sm shrink-0"
                        >
                            {redeemMutation.isPending
                                ? <Loader2 size={16} className="animate-spin" />
                                : (language === "ar" ? "استرداد" : "Redeem")}
                        </Button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <Link href="/gift-cards">
                            <button className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors">
                                <Gift size={12} />
                                {language === "ar" ? "شراء جيفت كارد جديد" : "Buy a new gift card"}
                                <ChevronRight size={12} />
                            </button>
                        </Link>
                        <button
                            onClick={() => {
                                if (items.length === 0) {
                                    toast.error(language === "ar" ? "السلة فارغة! أضف منتجات أولاً" : "Cart is empty! Add products first");
                                    return;
                                }
                                setLocation("/checkout?from=wallet");
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                        >
                            {language === "ar" ? "ادفع بالمحفظة" : "Pay with wallet"}
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </motion.div>

                {/* Quick Action */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            if (items.length === 0) {
                                toast.error(language === "ar" ? "السلة فارغة! أضف منتجات أولاً" : "Cart is empty! Add products first");
                                return;
                            }
                            setLocation("/checkout?from=wallet");
                        }}
                    >
                        <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:bg-emerald-600/20 transition-colors text-right">
                            <TrendingUp className="text-emerald-500 w-7 h-7" />
                            <p className="font-black text-white text-sm">
                                {language === "ar" ? "الدفع بالمحفظة" : "Pay with Wallet"}
                            </p>
                            <p className="text-xs text-gray-400">
                                {language === "ar" ? "استخدم رصيدك في الطلبات" : "Use balance for orders"}
                            </p>
                        </div>
                    </button>
                    <Link href="/gift-cards">
                        <div className="bg-purple-600/10 border border-purple-600/30 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:bg-purple-600/20 transition-colors">
                            <Gift className="text-purple-400 w-7 h-7" />
                            <p className="font-black text-white text-sm">
                                {language === "ar" ? "شراء جيفت كارد" : "Buy Gift Card"}
                            </p>
                            <p className="text-xs text-gray-400">
                                {language === "ar" ? "أهدِ أحبائك" : "Gift your loved ones"}
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Transaction History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="text-gray-400 w-5 h-5" />
                            <h3 className="font-black text-white">
                                {language === "ar" ? "سجل المعاملات" : "Transaction History"}
                            </h3>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                            <RefreshCw size={15} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="py-16 flex justify-center">
                            <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
                        </div>
                    ) : txns.length === 0 ? (
                        <div className="py-16 text-center">
                            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 font-bold text-sm">
                                {language === "ar" ? "لا توجد معاملات حتى الآن" : "No transactions yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {[...txns].reverse().map((tx: any, i: number) => {
                                const isCredit = tx.amount > 0;
                                return (
                                    <div key={tx.id ?? i} className="flex items-center gap-4 p-5 hover:bg-gray-800/30 transition-colors">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                                            {isCredit ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">
                                                {tx.description || (isCredit ? (language === "ar" ? "إيداع" : "Deposit") : (language === "ar" ? "خصم" : "Deduction"))}
                                            </p>
                                            <p className="text-xs text-gray-500 font-bold mt-0.5">
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(language === "ar" ? "ar-AE" : "en-AE", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                            </p>
                                        </div>
                                        <span className={`font-black text-base shrink-0 ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                                            {isCredit ? "+" : ""}{tx.amount?.toFixed(2)} AED
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
