import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { CollectionHero } from "@/components/products/CollectionHero";
import { CategoryNav } from "@/components/products/CategoryNav";
import { ProductFilters } from "@/components/products/ProductFilters";
import { QuickViewModal } from "@/components/home/QuickViewModal";
import { SEO } from "@/components/SEO";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catId = params.get('category');
      if (catId) return Number(catId);
    }
    return undefined;
  });

  const [selectedCollection, setSelectedCollection] = useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const colId = params.get('collection');
      if (colId) return Number(colId);
    }
    return undefined;
  });

  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catId = params.get('category');
    const colId = params.get('collection');

    setSelectedCategory(catId ? Number(catId) : undefined);
    setSelectedCollection(colId ? Number(colId) : undefined);
  }, [location, window.location.search]);

  const [showFilters, setShowFilters] = useState(false); // Mobile toggle
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "rating">("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [displayCount, setDisplayCount] = useState(12);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  const { language, t } = useLanguage();


  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => endpoints.categories.list()
  });

  const { data: collections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => endpoints.collections.list()
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory, selectedCollection],
    queryFn: () => endpoints.products.list({
      search: searchQuery,
      categoryId: selectedCategory,
      collectionId: selectedCollection,
      limit: 100 // Fetch more to allow client-side filtering safely for now
    }),
    retry: 1,
  });

  // Derived state for UI
  const productData = (products as any)?.data || [];

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...productData];

    // Price & Offers Filter
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');

    result = result.filter(p => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);

    if (filter === 'offers') {
      result = result.filter(p => Number(p.discount) > 0 || Number(p.originalPrice) > Number(p.price));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-low": return Number(a.price) - Number(b.price);
        case "price-high": return Number(b.price) - Number(a.price);
        case "rating": return Number(b.rating) - Number(a.rating);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [productData, priceRange, sortBy]);

  const visibleProducts = filteredProducts.slice(0, displayCount);

  // Get active hero data
  const currentCategory = categories?.find((c: any) => c.id === selectedCategory);
  const currentCollection = collections?.find((c: any) => c.id === selectedCollection);

  const heroTitle = currentCollection
    ? (language === 'ar' ? (currentCollection.nameAr || currentCollection.name) : (currentCollection.nameEn || currentCollection.name))
    : currentCategory
      ? (language === 'ar' ? (currentCategory.nameAr || currentCategory.name) : (currentCategory.nameEn || currentCategory.name))
      : t('latestCollections');

  const heroImage = currentCollection?.coverImage || currentCategory?.image || "/shop-hero.png";

  // Nav Items
  const navItems = [
    { id: 'all', name: t('all'), isActive: !selectedCategory && !selectedCollection, onClick: () => { setSelectedCategory(undefined); setSelectedCollection(undefined); } },
    ...(categories as any[] || []).map((cat: any) => ({
      id: `cat-${cat.id}`,
      name: language === 'ar' ? (cat.nameAr || cat.name) : (cat.nameEn || cat.name),
      isActive: selectedCategory === cat.id,
      onClick: () => { setSelectedCategory(cat.id); setSelectedCollection(undefined); }
    })),
    ...(collections as any[] || []).map((col: any) => ({
      id: `col-${col.id}`,
      name: language === 'ar' ? (col.nameAr || col.name) : (col.nameEn || col.name),
      isActive: selectedCollection === col.id,
      onClick: () => { setSelectedCollection(col.id); setSelectedCategory(undefined); }
    }))
  ];

  const topRated = productData.sort((a: any, b: any) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      <SEO title={heroTitle} description={language === 'ar' ? `تسوق ${heroTitle} من WOLF TECHNO` : `Shop ${heroTitle} from WOLF TECHNO`} />
      {/* 1. Hero Banner */}
      <CollectionHero
        title={heroTitle}
        image={heroImage}
        itemCount={filteredProducts.length}
        description={t('discoverLuxuryDresses')}
      />

      {/* 2. Sub Navigation */}
      <CategoryNav items={navItems} />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* 3. Sidebar (Filters) */}
          <aside className={`lg:w-80 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24">
              {/* Mobile Search - Only visible on sidebar if needed, actually header search is better. Keeping layout clean. */}

              <ProductFilters
                minPrice={0}
                maxPrice={30000}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                topRatedProducts={topRated}
              />
            </div>
          </aside>

          {/* 4. Main Content */}
          <div className="grow">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <Button
                variant="outline"
                className="lg:hidden border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={18} className="mr-2" />
                {t('filter')}
              </Button>

              <p className="text-gray-500 font-medium">
                {t('showingResults')
                  .replace('{count}', Math.min(displayCount, filteredProducts.length).toString())
                  .replace('{total}', filteredProducts.length.toString())
                }
              </p>

              <div className="flex items-center gap-3 ml-auto">
                <span className="text-gray-500 text-sm font-bold uppercase hidden md:inline-block">
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-900 outline-none border-b-2 border-gray-200 focus:border-gray-900 pb-1 transition-colors cursor-pointer"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="price-low">{t('sortPriceLow')}</option>
                  <option value="price-high">{t('sortPriceHigh')}</option>
                  <option value="rating">{t('sortRating')}</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-50 rounded-[2rem] animate-pulse" />
                ))}
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {visibleProducts.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      onQuickView={setQuickViewProduct}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <div className="bg-gray-50 rounded-[3rem] p-20 text-center">
                <h3 className="text-2xl font-black text-gray-400 mb-4">{t('noResults')}</h3>
                <Button onClick={() => { setPriceRange([0, 30000]); setSearchQuery(""); }} variant="outline">
                  {t('resetFilters')}
                </Button>
              </div>
            )}

            {/* Error State */}
            {/* @ts-ignore */}
            {products?.error && (
              <div className="bg-red-50 rounded-[3rem] p-20 text-center">
                <h3 className="text-2xl font-black text-red-500 mb-4">{t('errorLoadingProducts') || "Error loading products"}</h3>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-500 hover:bg-red-50">
                  {t('retry') || "Retry"}
                </Button>
              </div>
            )}

            {/* Load More */}
            {visibleProducts.length < filteredProducts.length && (
              <div className="mt-16 text-center">
                <Button
                  onClick={() => setDisplayCount(prev => prev + 12)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 py-6 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform h-auto"
                >
                  {t('loadMore')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickViewModal
        initialProduct={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
