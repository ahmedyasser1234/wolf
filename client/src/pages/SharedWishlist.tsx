import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import { Heart, Loader2 } from "lucide-react";

export default function SharedWishlist() {
    const { token } = useParams();
    const { language } = useLanguage();

    const { data: items, isLoading, error } = useQuery({
        queryKey: ["shared-wishlist", token],
        queryFn: () => endpoints.wishlist.getShared(token!),
        enabled: !!token,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 -primary animate-spin" />
            </div>
        );
    }

    if (error || !items) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                        <Heart size={40} className="fill-current opacity-20" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4">
                        {language === 'ar' ? "قائمة غير موجودة" : "Wishlist Not Found"}
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {language === 'ar'
                            ? "عذراً، هذا الرابط غير صالح أو أن القائمة تم جعلها خاصة."
                            : "Sorry, this link is invalid or the wishlist has been made private."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center md:text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        {language === 'ar' ? "قائمة أمنيات مشتركة" : "Shared Wishlist"}
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl">
                        {language === 'ar'
                            ? "اكتشفي الفساتين المختارة في هذه القائمة."
                            : "Discover the dresses selected in this wishlist."}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {items.map((item: any, idx: number) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <ProductCard product={item.product} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
