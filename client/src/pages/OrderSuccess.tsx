import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, ArrowLeft, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import confetti from "canvas-confetti";

export default function OrderSuccess() {
    const { t, language } = useLanguage();

    useEffect(() => {
        // Fire confetti for a premium feel
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // --- NEW: Trigger Backend Confirmation ---
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        if (orderId) {
            import("@/lib/api").then(({ endpoints }) => {
                endpoints.orders.confirmPayment(parseInt(orderId))
                    .catch(e => console.error("Error confirming payment on success page:", e));
            });
        }

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center pt-20 pb-32 overflow-hidden relative">
            {/* Decorative Orbs */}
            <div className="absolute top-20 left-10 w-64 h-64 -white/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-50" />

            <div className="container mx-auto px-4 max-w-2xl text-center relative z-10">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-100"
                >
                    <CheckCircle2 size={48} className="text-white" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl font-black text-gray-900 mb-6 font-arabic"
                >
                    {t('orderSuccess')}
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-gray-500 mb-12 font-medium"
                >
                    {t('orderSuccessDesc')}
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid gap-4"
                >
                    <Link href="/orders">
                        <Button className="w-full h-16 rounded-full -primary hover:-primary text-xl font-bold shadow-xl -white/10 gap-3">
                            <ShoppingBag size={24} />
                            {t('trackOrder')}
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="w-full h-16 rounded-full border-2 text-xl font-bold gap-3 group">
                            <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180 group-hover:translate-x-2 transition-transform' : 'group-hover:-translate-x-2 transition-transform'} />
                            {t('backToHome')}
                        </Button>
                    </Link>
                </motion.div>

                {/* Premium Badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-20 flex items-center justify-center gap-6 text-gray-400"
                >
                    <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">Premium Quality</span>
                    </div>
                    <div className="w-px h-4 bg-gray-100" />
                    <div className="flex items-center gap-2">
                        <Heart size={16} className="-primary -primary" />
                        <span className="text-xs font-bold uppercase tracking-widest">Handled with Care</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
