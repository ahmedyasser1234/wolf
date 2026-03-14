import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/lib/i18n";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchResults() {
    const [location] = useLocation();
    const searchString = useSearch();
    const { language, t } = useLanguage();
    const queryParams = new URLSearchParams(searchString);
    const query = queryParams.get("q") || "";

    const { data: resultsData, isLoading } = useQuery({
        queryKey: ['products', 'search', query],
        queryFn: () => endpoints.products.list({ search: query }),
        enabled: query.length > 0
    });

    const products = resultsData?.data || [];

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20 pt-24 md:pt-32">
            <SEO
                title={language === 'ar' ? `نتائج البحث عن: ${query}` : `Search results for: ${query}`}
                description={language === 'ar' ? `اكتشف أفضل الأجهزة المتعلقة بـ ${query}` : `Discover the best devices related to ${query}`}
            />

            <div className="container mx-auto px-4">
                {/* Search Header */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent">
                                <Search className="text-[#D4AF37]" size={32} />
                                {language === 'ar' ? "نتائج البحث" : "Search Results"}
                            </h1>
                            <p className="text-slate-500 font-bold text-lg">
                                {language === 'ar' ? `عرض النتائج لـ: "${query}"` : `Showing results for: "${query}"`}
                                <span className="mr-3 text-primary bg-white/5 px-3 py-1 rounded-full text-sm">
                                    {products.length} {language === 'ar' ? "منتج" : "products"}
                                </span>
                            </p>
                        </div>

                        <Button variant="outline" className="rounded-full h-12 px-6 font-bold border-gray-200 hover:bg-gray-50 flex items-center gap-2">
                            <SlidersHorizontal size={18} />
                            {language === 'ar' ? "تصفية متطورة" : "Advanced Filters"}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array(4).fill(0).map((_, i) => (
                            <Skeleton key={i} className="aspect-[3/4] rounded-3xl w-full" />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product: any, index: number) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <PackageSearch size={48} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">
                            {language === 'ar' ? "عذراً، لم نجد ما تبحثي عنه" : "Sorry, we couldn't find what you're looking for"}
                        </h2>
                        <p className="text-slate-500 font-bold mb-8 max-w-md">
                            {language === 'ar'
                                ? "جربي كلمات بحث مختلفة أو تصفحي مجموعاتنا الأحدث"
                                : "Try different keywords or browse our latest collections"}
                        </p>
                        <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 font-black shadow-lg shadow-primary/20">
                            {language === 'ar' ? "تصفح كافة المنتجات" : "Browse All Products"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
