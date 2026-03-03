import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Eye, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAddToCart } from "@/hooks/useAddToCart";

interface ProductCardProps {
    product: any;
    index?: number;
    loading?: boolean;
    onQuickView?: (product: any) => void;
}

export function ProductCard({ product, index = 0, loading = false, onQuickView }: ProductCardProps) {
    const { language, t, formatPrice } = useLanguage();
    const queryClient = useQueryClient();

    const { user } = useAuth();

    const { data: wishlistStatus } = useQuery({
        queryKey: ['wishlist-status', product?.id],
        queryFn: () => endpoints.wishlist.check(product.id),
        enabled: !!user && !!product?.id,
    });

    const isFavorite = wishlistStatus?.isFavorite;

    const toggleWishlistMutation = useMutation({
        mutationFn: () => isFavorite
            ? endpoints.wishlist.remove(product.id)
            : endpoints.wishlist.add(product.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist-status', product.id] });
            toast.success(isFavorite ? t('removedFromWishlist') : t('addedToWishlist'));
        }
    });

    const addToCartMutation = useAddToCart();

    const { data: installmentPlans } = useQuery({
        queryKey: ['installments', 'active'],
        queryFn: () => endpoints.installments.active(),
        staleTime: 1000 * 60 * 10, // cache 10 min
    });

    // Calculate lowest monthly payment across all active plans
    const lowestMonthly = (() => {
        if (!installmentPlans || !product.price) return null;
        const activePlans = (installmentPlans as any[]).filter(p => p.isActive && product.price >= (p.minOrderAmount || 0));
        if (!activePlans.length) return null;
        // Pick plan with most months for the lowest monthly payment
        const best = activePlans.reduce((a: any, b: any) => b.months > a.months ? b : a);
        const total = product.price * (1 + (best.interestRate || 0) / 100);
        return { amount: total / best.months, months: best.months };
    })();

    const name = language === 'ar' ? product.nameAr : product.nameEn;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`group ${language === 'ar' ? 'text-right' : 'text-left'}`}
        >
            <div className="cursor-pointer relative">
                <Link href={`/products/${product.id}`}>
                    <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden mb-4 shadow-xl group-hover:shadow-primary/20 transition-all bg-secondary/50 border border-white/5">
                        <img
                            src={product.images?.[0] || "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=600&h=800&fit=crop"}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e: any) => {
                                e.target.src = "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=600&h=800&fit=crop";
                            }}
                        />
                        {product.discount > 0 && (
                            <Badge className={`absolute top-4 ${language === 'ar' ? 'right-4' : 'left-4'} bg-primary text-background border-none px-3 py-1 rounded-full font-black text-sm shadow-lg shadow-primary/20`}>
                                -{product.discount}%
                            </Badge>
                        )}

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            {user?.role !== 'admin' && user?.role !== 'vendor' && (
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addToCartMutation.mutate({
                                            productId: product.id,
                                            quantity: 1,
                                            product: {
                                                id: product.id,
                                                nameAr: product.nameAr,
                                                nameEn: product.nameEn,
                                                price: product.price,
                                                images: product.images,
                                                discount: product.discount,
                                                category: product.category
                                            }
                                        });
                                    }}
                                    size="icon"
                                    className="rounded-full h-12 w-12 bg-white/10 border border-white/20 hover:bg-primary hover:border-primary text-white hover:text-background shadow-2xl scale-0 group-hover:scale-100 transition-all duration-300 delay-100"
                                >
                                    <ShoppingCart size={20} />
                                </Button>
                            )}

                            <div className="rounded-full h-12 w-12 bg-white/10 border border-white/20 hover:bg-primary hover:border-primary text-white hover:text-background shadow-2xl scale-0 group-hover:scale-100 transition-all duration-300 delay-75 flex items-center justify-center pointer-events-none">
                                <Eye size={20} />
                            </div>

                            {user?.role !== 'admin' && user?.role !== 'vendor' && (
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!user) return toast.error(t('loginFirst'));
                                        toggleWishlistMutation.mutate();
                                    }}
                                    size="icon"
                                    className={`rounded-full h-12 w-12 shadow-2xl scale-0 group-hover:scale-100 transition-all duration-300 delay-150 border ${isFavorite ? 'bg-primary border-primary text-background' : 'bg-white/10 border-white/20 hover:bg-primary hover:border-primary text-white hover:text-background'}`}
                                >
                                    <Heart size={20} className={isFavorite ? "fill-current" : ""} />
                                </Button>
                            )}
                        </div>
                    </div>
                </Link>

                <div className={`px-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <Link href={`/products/${product.id}`}>
                        <h3 className="text-lg font-bold text-white mb-1 truncate hover:text-primary transition-colors">{name}</h3>
                    </Link>
                    <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-2 mb-1`}>
                        <div className={`flex items-center gap-1 ${language === 'ar' ? 'ml-auto' : 'mr-auto'}`}>
                            <Star size={14} className="fill-primary text-primary" />
                            <span className="font-bold text-white/70 text-sm">{Number(product.rating || 0).toFixed(1)}</span>
                        </div>
                        {product.originalPrice && (
                            <span className="text-white/40 font-medium line-through text-xs">{formatPrice(product.originalPrice)}</span>
                        )}
                        <span className="text-lg font-black text-primary">{formatPrice(product.price)}</span>
                    </div>
                    {lowestMonthly && (
                        <div className={`flex items-center gap-1.5 mb-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                            <CreditCard size={12} className="text-green-400 shrink-0" />
                            <span className="text-xs font-bold text-green-400">
                                {language === 'ar'
                                    ? `من ${formatPrice(lowestMonthly.amount)} / ${lowestMonthly.months} شهر`
                                    : `From ${formatPrice(lowestMonthly.amount)} / ${lowestMonthly.months} mo`
                                }
                            </span>
                        </div>
                    )}
                    {/* Color Swatches */}
                    {product.colors && product.colors.length > 0 && (
                        <div className={`flex ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-1.5 h-6`}>
                            {product.colors.map((color: any) => (
                                <div
                                    key={color.id}
                                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                    style={{ backgroundColor: color.colorCode }}
                                    title={color.colorName}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
