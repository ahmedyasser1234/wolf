import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Layers, Package2 } from "lucide-react";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
    const { language } = useLanguage();
    const isAr = language === "ar";

    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: () => endpoints.categories.list(),
    });

    return (
        <>
            <SEO
                title={isAr ? "الأقسام | Wolf Techno" : "Categories | Wolf Techno"}
                description={
                    isAr
                        ? "تصفح جميع أقسام منتجاتنا الإلكترونية"
                        : "Browse all our electronics product categories"
                }
            />

            <div className="min-h-screen bg-background">
                {/* Header Banner — matches CollectionHero style */}
                <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-gray-900 flex items-center">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <img
                            src="/categories-hero.png"
                            alt={isAr ? "أقسام Wolf Techno" : "Wolf Techno Categories"}
                            className="w-full h-full object-cover opacity-60"
                            loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative h-full container mx-auto px-4 flex flex-col items-center justify-center text-center text-white z-10 pt-20 md:pt-0">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="flex flex-col items-center space-y-4">
                                <h1 className="text-5xl md:text-7xl font-serif font-black mb-4 tracking-tight drop-shadow-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent">
                                    {isAr ? "تصفح الأقسام" : "Browse Categories"}
                                </h1>
                                <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-bold leading-relaxed mb-6">
                                    {isAr
                                        ? "اكتشف تشكيلة مميزة من أحدث الأجهزة الذكية"
                                        : "Discover our electronics organized by category"}
                                </p>
                                {!isLoading && categories && (
                                    <div className="inline-block px-6 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white">
                                        <span className="font-bold">{(categories as any[]).length}</span>{" "}
                                        {isAr ? "قسم" : "Categories"}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>


                {/* Categories Grid */}
                <div className="container mx-auto px-4 md:px-8 max-w-[1400px] py-12 md:py-16">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-52 md:h-64 rounded-3xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : !categories || (categories as any[]).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                <Layers size={32} className="text-white/30" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">
                                {isAr ? "لا توجد أقسام بعد" : "No Categories Yet"}
                            </h3>
                            <p className="text-white/40 text-sm font-medium">
                                {isAr
                                    ? "سيتم إضافة الأقسام قريباً"
                                    : "Categories will be added soon"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {(categories as any[]).map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                >
                                    <Link href={`/categories/${category.slug}`}>
                                        <div className="group relative rounded-3xl overflow-hidden border border-white/8 bg-white/3 hover:border-primary/40 hover:bg-white/5 transition-all duration-400 cursor-pointer h-52 md:h-64 flex flex-col">
                                            {/* Background Image */}
                                            {category.image ? (
                                                <div className="absolute inset-0">
                                                    <img
                                                        src={category.image}
                                                        alt={isAr ? category.nameAr : category.nameEn}
                                                        className="w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/20" />
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent">
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Package2 size={80} className="text-primary" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Glow border on hover */}
                                            <div className="absolute inset-0 rounded-3xl ring-0 group-hover:ring-1 group-hover:ring-primary/30 transition-all duration-400" />

                                            {/* Content */}
                                            <div className="relative z-10 flex flex-col justify-end h-full p-5 md:p-6">
                                                <h3
                                                    className={`font-black text-white text-base md:text-lg leading-tight mb-1 group-hover:text-primary transition-colors duration-300 ${isAr ? "text-right" : "text-left"}`}
                                                >
                                                    {isAr
                                                        ? category.nameAr || category.nameEn
                                                        : category.nameEn || category.nameAr}
                                                </h3>
                                                {(isAr ? category.descriptionAr : category.descriptionEn) && (
                                                    <p
                                                        className={`text-white/50 text-xs font-medium line-clamp-2 mb-3 ${isAr ? "text-right" : "text-left"}`}
                                                    >
                                                        {isAr
                                                            ? category.descriptionAr
                                                            : category.descriptionEn}
                                                    </p>
                                                )}
                                                <div
                                                    className={`flex items-center gap-1.5 text-primary text-xs font-black ${isAr ? "flex-row-reverse justify-end" : ""}`}
                                                >
                                                    <span>
                                                        {isAr ? "استعرض المجموعات" : "Browse Groups"}
                                                    </span>
                                                    <ChevronRight
                                                        size={14}
                                                        className={`group-hover:translate-x-1 transition-transform ${isAr ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : ""}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
