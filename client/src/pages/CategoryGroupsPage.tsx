import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Layers, LayoutGrid } from "lucide-react";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryGroupsPage() {
    const [, params] = useRoute("/categories/:categorySlug");
    const categorySlug = params?.categorySlug || "";
    const { language } = useLanguage();
    const isAr = language === "ar";

    // Fetch all categories to resolve slug → id + name
    const { data: allCategories, isLoading: catLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: () => endpoints.categories.list(),
    });

    const category: any = Array.isArray(allCategories)
        ? allCategories.find((c: any) => c.slug === categorySlug)
        : null;

    // Fetch collections (groups) for this category
    const { data: collections, isLoading: collectionsLoading } = useQuery({
        queryKey: ["collections", "category", category?.id],
        queryFn: () => endpoints.collections.list(category?.id),
        enabled: !!category?.id,
    });

    const isLoading = catLoading || collectionsLoading;
    const categoryName = category
        ? isAr
            ? category.nameAr || category.nameEn
            : category.nameEn || category.nameAr
        : categorySlug;

    return (
        <>
            <SEO
                title={
                    isAr
                        ? `${categoryName} - المجموعات | Wolf Techno`
                        : `${categoryName} - Groups | Wolf Techno`
                }
                description={
                    isAr
                        ? `تصفح مجموعات قسم ${categoryName}`
                        : `Browse groups in ${categoryName} category`
                }
            />

            <div className="min-h-screen bg-background">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-br from-gray-950 via-background to-gray-950 border-b border-white/5 py-16 md:py-24 overflow-hidden">
                    {/* Background image from category */}
                    {category?.image && (
                        <div className="absolute inset-0">
                            <img
                                src={category.image}
                                alt=""
                                className="w-full h-full object-cover opacity-10"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

                    <div className="container mx-auto px-4 md:px-8 max-w-[1400px] relative z-10">
                        {/* Breadcrumb */}
                        <div
                            className={`flex items-center gap-2 text-sm text-white/40 font-medium mb-6 flex-wrap ${isAr ? "flex-row-reverse justify-end" : ""}`}
                        >
                            <Link href="/">
                                <span className="hover:text-primary transition-colors cursor-pointer">
                                    {isAr ? "الرئيسية" : "Home"}
                                </span>
                            </Link>
                            <ChevronRight
                                size={14}
                                className={`text-white/20 ${isAr ? "rotate-180" : ""}`}
                            />
                            <Link href="/categories">
                                <span className="hover:text-primary transition-colors cursor-pointer">
                                    {isAr ? "الأقسام" : "Categories"}
                                </span>
                            </Link>
                            <ChevronRight
                                size={14}
                                className={`text-white/20 ${isAr ? "rotate-180" : ""}`}
                            />
                            <span className="text-primary font-bold">{categoryName}</span>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`${isAr ? "text-right" : "text-left"}`}
                        >
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                                {categoryName}
                            </h1>
                            {category && (isAr ? category.descriptionAr : category.descriptionEn) && (
                                <p className="text-base md:text-lg text-white/50 font-medium max-w-xl">
                                    {isAr ? category.descriptionAr : category.descriptionEn}
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Groups Grid */}
                <div className="container mx-auto px-4 md:px-8 max-w-[1400px] py-12 md:py-16">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-44 md:h-56 rounded-3xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : !collections || (collections as any[]).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                <LayoutGrid size={32} className="text-white/30" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">
                                {isAr ? "لا توجد مجموعات بعد" : "No Groups Yet"}
                            </h3>
                            <p className="text-white/40 text-sm font-medium mb-6">
                                {isAr
                                    ? "لم يتم إضافة مجموعات لهذا القسم بعد"
                                    : "No groups have been added to this category yet"}
                            </p>
                            <Link href="/categories">
                                <button className="border border-primary/50 text-primary hover:bg-primary hover:text-background font-bold px-6 py-2.5 rounded-full transition-all text-sm">
                                    {isAr ? "← العودة للأقسام" : "← Back to Categories"}
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p
                                className={`text-white/40 text-sm font-bold mb-8 ${isAr ? "text-right" : "text-left"}`}
                            >
                                {(collections as any[]).length}{" "}
                                {isAr ? "مجموعة متاحة" : "groups available"}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {(collections as any[]).map((group, index) => (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.06 }}
                                    >
                                        <Link href={`/groups/${group.slug}`}>
                                            <div className="group relative rounded-3xl overflow-hidden border border-white/8 bg-white/3 hover:border-primary/40 hover:bg-white/5 transition-all duration-400 cursor-pointer h-44 md:h-56 flex flex-col">
                                                {/* Background Image */}
                                                {group.coverImage ? (
                                                    <div className="absolute inset-0">
                                                        <img
                                                            src={group.coverImage}
                                                            alt={isAr ? group.nameAr : group.nameEn}
                                                            className="w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500"
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent">
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                                            <Layers size={60} className="text-primary" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 rounded-3xl ring-0 group-hover:ring-1 group-hover:ring-primary/30 transition-all duration-400" />

                                                {/* Content */}
                                                <div className="relative z-10 flex flex-col justify-end h-full p-4 md:p-5">
                                                    <h3
                                                        className={`font-black text-white text-sm md:text-base leading-tight mb-1 group-hover:text-primary transition-colors duration-300 ${isAr ? "text-right" : "text-left"}`}
                                                    >
                                                        {isAr
                                                            ? group.nameAr || group.nameEn
                                                            : group.nameEn || group.nameAr}
                                                    </h3>
                                                    {group.description && (
                                                        <p
                                                            className={`text-white/40 text-[11px] font-medium line-clamp-1 mb-2.5 ${isAr ? "text-right" : "text-left"}`}
                                                        >
                                                            {group.description}
                                                        </p>
                                                    )}
                                                    <div
                                                        className={`flex items-center gap-1 text-primary text-[11px] font-black ${isAr ? "flex-row-reverse justify-end" : ""}`}
                                                    >
                                                        <span>
                                                            {isAr ? "عرض المنتجات" : "View Products"}
                                                        </span>
                                                        <ChevronRight
                                                            size={13}
                                                            className={`group-hover:translate-x-1 transition-transform ${isAr ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : ""}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
