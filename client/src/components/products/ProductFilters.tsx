import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

interface ProductFiltersProps {
    minPrice: number;
    maxPrice: number;
    priceRange: [number, number];
    onPriceChange: (value: [number, number]) => void;
    topRatedProducts?: any[];
}

export function ProductFilters({
    minPrice,
    maxPrice,
    priceRange,
    onPriceChange,
    topRatedProducts = []
}: ProductFiltersProps) {
    const { language, t } = useLanguage();

    return (
        <div className="w-full space-y-10">
            {/* Price Filter */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] shadow-sm backdrop-blur-md">
                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider relative inline-block">
                    {t('filterByPrice')}
                    <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-primary rounded-full"></span>
                </h3>

                <div className="px-2 mb-6">
                    <Slider
                        defaultValue={[minPrice, maxPrice]}
                        value={[priceRange[0], priceRange[1]]}
                        max={maxPrice}
                        min={minPrice}
                        step={10}
                        onValueChange={(val) => onPriceChange([val[0], val[1]])}
                        className="my-6"
                    />
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span>{priceRange[0]} {t('currency')}</span>
                    <span className="text-gray-400">-</span>
                    <span>{priceRange[1]} {t('currency')}</span>
                </div>
            </div>

            {/* Top Rated Products Widget */}
            {topRatedProducts.length > 0 && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] shadow-sm backdrop-blur-md">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider relative inline-block">
                        {t('topRatedWidget')}
                        <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-primary rounded-full"></span>
                    </h3>

                    <div className="space-y-6">
                        {topRatedProducts.map((product) => (
                            <div key={product.id} className="flex gap-4 group cursor-pointer">
                                <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                    <img
                                        src={product.images?.[0]}
                                        alt={language === 'ar' ? product.nameAr : product.nameEn}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white line-clamp-2 mb-1 group-hover:text-primary transition-colors text-sm">
                                        {language === 'ar' ? product.nameAr : product.nameEn}
                                    </h4>
                                    <div className="flex items-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={`fill-current ${i < Math.round(product.rating || 0) ? 'text-primary' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-primary font-black">{product.price} {t('currency')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
