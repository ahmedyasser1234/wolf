import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, ShoppingBag, ArrowRight, Share2, Copy, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";

export default function Wishlist() {
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();
    const [copied, setCopied] = useState(false);

    const { data: items, isLoading } = useQuery({
        queryKey: ["wishlist"],
        queryFn: () => endpoints.wishlist.list(),
    });

    const { data: settings } = useQuery({
        queryKey: ["wishlist", "settings"],
        queryFn: () => endpoints.wishlist.getSettings(),
    });

    const updateSharing = useMutation({
        mutationFn: (isPublic: boolean) => endpoints.wishlist.updateSettings(isPublic),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist", "settings"] });
            toast.success(language === 'ar' ? "تم تحديث إعدادات المشاركة" : "Sharing settings updated");
        }
    });

    const handleCopy = () => {
        const url = `${window.location.origin}/wishlist/shared/${settings?.shareToken}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(language === 'ar' ? "تم نسخ الرابط" : "Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="h-10 w-48 bg-gray-200 animate-pulse rounded mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-[400px] bg-white rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasItems = items && Array.isArray(items) && items.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center md:text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        {language === 'ar' ? "قائمة أمنياتي" : "My Wishlist"}
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl">
                        {language === 'ar'
                            ? "الفساتين التي نالت إعجابكِ. يمكنكِ إضافتها للسلة في أي وقت."
                            : "Dresses you loved. You can add them to your cart anytime."}
                    </p>
                </header>

                {/* Sharing Controls */}
                <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 -white/5 -primary rounded-2xl flex items-center justify-center">
                            <Share2 size={28} />
                        </div>
                        <div className="text-start">
                            <h3 className="text-xl font-black text-gray-900 leading-tight">
                                {language === 'ar' ? "مشاركة قائمتكِ" : "Share Your List"}
                            </h3>
                            <p className="text-sm font-bold text-gray-400">
                                {language === 'ar'
                                    ? "اجعلي قائمتكِ عامة لمشاركتها مع صديقاتكِ"
                                    : "Make your list public to share it with your friends"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                        <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 w-full md:w-auto justify-between">
                            <span className="text-sm font-black text-gray-600">
                                {language === 'ar' ? "عامة" : "Public"}
                            </span>
                            <Switch
                                checked={settings?.isPublic || false}
                                onCheckedChange={(checked) => updateSharing.mutate(checked)}
                                disabled={updateSharing.isPending}
                            />
                        </div>

                        <AnimatePresence>
                            {settings?.isPublic && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="w-full md:w-auto"
                                >
                                    <Button
                                        onClick={handleCopy}
                                        variant="outline"
                                        className="h-14 px-8 rounded-2xl font-black gap-3 -primary/20 -primary hover:-white/5 w-full"
                                    >
                                        {copied ? <Check size={20} /> : <Copy size={20} />}
                                        {language === 'ar' ? "نسخ رابط المشاركة" : "Copy Share Link"}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {!hasItems ? (
                    <div className="bg-white rounded-[3rem] p-12 md:p-20 text-center shadow-sm border border-gray-100">
                        <div className="w-24 h-24 -white/5 rounded-full flex items-center justify-center mx-auto mb-8 -primary">
                            <Heart size={40} className="fill-current" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">
                            {language === 'ar' ? "قائمتكِ فارغة" : "Your list is empty"}
                        </h2>
                        <p className="text-gray-500 text-xl mb-12 max-w-md mx-auto">
                            {language === 'ar'
                                ? "ابدئي باكتشاف مجموعتنا المميزة وأضيفي لمساتكِ المفضلة هنا."
                                : "Start exploring our unique collection and add your favorite touches here."}
                        </p>
                        <Link href="/products">
                            <Button size="lg" className="h-16 px-12 rounded-full bg-gray-900 hover:bg-black text-white text-xl font-black group">
                                {language === 'ar' ? "اكتشفي المجموعة" : "Explore Collection"}
                                <ArrowRight className={`mr-3 h-6 w-6 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180' : ''}`} />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {items.map((item: any, idx: number) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="relative group">
                                    <ProductCard product={item.product} />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-10 h-10 p-0"
                                        onClick={async () => {
                                            await endpoints.wishlist.remove(item.productId);
                                            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
                                        }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
