import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Package } from "lucide-react";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";

export default function GroupProductsPage() {
    const [, params] = useRoute("/groups/:groupSlug");
    const groupSlug = params?.groupSlug || "";
    const { language } = useLanguage();
    const isAr = language === "ar";

    // Fetch all collections to resolve slug → collection info
    const { data: allCollections, isLoading: colLoading } = useQuery({
        queryKey: ["collections", "all"],
        queryFn: () => endpoints.collections.list(),
    });

    const group: any = Array.isArray(allCollections)
        ? allCollections.find((c: any) => c.slug === groupSlug)
        : null;

    // Fetch all categories for breadcrumb (resolve category name from group.categoryId)
    const { data: allCategories } = useQuery({
        queryKey: ["categories"],
        queryFn: () => endpoints.categories.list(),
    });

    const parentCategory: any = group && Array.isArray(allCategories)
        ? allCategories.find((c: any) => c.id === group.categoryId)
        : null;

    // Fetch products for this collection
    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ["products", "collection", group?.id],
        queryFn: () => endpoints.products.list({ collectionId: group?.id }),
        enabled: !!group?.id,
    });

    const isLoading = colLoading || productsLoading;
    const groupName = group
        ? isAr
            ? group.nameAr || group.nameEn
            : group.nameEn || group.nameAr
        : groupSlug;

    const productList: any[] = (products as any)?.data || [];

    return (
        <>
            <SEO
                title={
                    isAr
                        ? `${groupName} - المنتجات | Wolf Techno`
                        : `${groupName} - Products | Wolf Techno`
                }
                description={
                    isAr
                        ? `استعرض منتجات مجموعة ${groupName}`
                        : `Browse products in ${groupName} group`
                }
            />

            <div className="min-h-screen bg-background">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-br from-gray-950 via-background to-gray-950 border-b border-white/5 py-14 md:py-20 overflow-hidden">
                    {group?.coverImage && (
                        <div className="absolute inset-0">
                            <img
                                src={group.coverImage}
                                alt=""
                                className="w-full h-full object-cover opacity-10"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

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
                            {parentCategory && (
                                <>
                                    <ChevronRight
                                        size={14}
                                        className={`text-white/20 ${isAr ? "rotate-180" : ""}`}
                                    />
                                    <Link href={`/categories/${parentCategory.slug}`}>
                                        <span className="hover:text-primary transition-colors cursor-pointer">
                                            {isAr
                                                ? parentCategory.nameAr || parentCategory.nameEn
                                                : parentCategory.nameEn || parentCategory.nameAr}
                                        </span>
                                    </Link>
                                </>
                            )}
                            <ChevronRight
                                size={14}
                                className={`text-white/20 ${isAr ? "rotate-180" : ""}`}
                            />
                            <span className="text-primary font-bold">{groupName}</span>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`${isAr ? "text-right" : "text-left"}`}
                        >
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
                                {groupName}
                            </h1>
                            {group?.description && (
                                <p className="text-base text-white/50 font-medium max-w-xl">
                                    {group.description}
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="container mx-auto px-4 md:px-8 max-w-[1400px] py-10 md:py-14">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-80 rounded-3xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : productList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                <Package size={32} className="text-white/30" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">
                                {isAr ? "لا توجد منتجات بعد" : "No Products Yet"}
                            </h3>
                            <p className="text-white/40 text-sm font-medium mb-6">
                                {isAr
                                    ? "لم يتم إضافة منتجات لهذه المجموعة بعد"
                                    : "No products have been added to this group yet"}
                            </p>
                            <div className="flex gap-3">
                                {parentCategory && (
                                    <Link href={`/categories/${parentCategory.slug}`}>
                                        <button className="border border-white/20 text-white/70 hover:text-primary hover:border-primary/50 font-bold px-5 py-2.5 rounded-full transition-all text-sm">
                                            {isAr ? "← عودة للمجموعات" : "← Back to Groups"}
                                        </button>
                                    </Link>
                                )}
                                <Link href="/products">
                                    <button className="bg-primary text-background font-bold px-5 py-2.5 rounded-full transition-all text-sm hover:bg-primary/90">
                                        {isAr ? "تصفح كل المنتجات" : "Browse All Products"}
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`flex items-center justify-between mb-8 ${isAr ? "flex-row-reverse" : ""}`}
                            >
                                <p className="text-white/40 text-sm font-bold">
                                    {productList.length}{" "}
                                    {isAr ? "منتج متاح" : "products available"}
                                </p>
                                <Link href="/products">
                                    <span className="text-primary text-sm font-bold hover:underline cursor-pointer">
                                        {isAr ? "كل المنتجات ←" : "All Products →"}
                                    </span>
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {productList.map((product: any, index: number) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: index * 0.04 }}
                                    >
                                        <ProductCard product={product} index={index} />
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
