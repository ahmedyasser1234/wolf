import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

import { Star, ChevronRight, ChevronLeft, ShieldCheck, Truck, RefreshCw, Headset, Instagram } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewModal } from "@/components/home/ReviewModal";
import { QuickViewModal } from "@/components/home/QuickViewModal";
import { FlashSalesSection } from "@/components/home/FlashSalesSection";
import { AppointmentSection } from "@/components/home/AppointmentSection";
import { HomeFAQ } from "@/components/home/HomeFAQ";
import { SEO } from "@/components/SEO";
import { BackToTop } from "@/components/ui/BackToTop";

import { useRef } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const { user } = useAuth();
  const { t, language, formatPrice, dir } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentFlowerIndex, setCurrentFlowerIndex] = useState(0);
  const [currentArchedIndex, setCurrentArchedIndex] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const productsPerPage = 4;

  const videos = ["/1.mp4", "/2.mp4", "/3.mp4"];

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => endpoints.categories.list()
  });

  // Fetch Collections
  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => endpoints.collections.list()
  });

  // Fetch Featured Products (Limited to 4)
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => endpoints.products.list({ limit: 4 })
  });

  // Fetch New Arrivals (Latest products)
  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => endpoints.products.list({ limit: 6, orderBy: 'createdAt' })
  });

  // Fetch Best Sellers (Most viewed/popular products)
  const { data: bestSellers, isLoading: bestSellersLoading } = useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: () => endpoints.products.list({ limit: 6 })
  });

  // Fetch All/Filtered Products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => endpoints.products.list({ collectionId: selectedCategory ?? undefined, limit: 12 })
  });

  // Fetch Store Reviews
  const { data: storeReviews, isLoading: storeReviewsLoading } = useQuery({
    queryKey: ['storeReviews'],
    queryFn: endpoints.storeReviews.list
  });

  const { data: socialFeedData, isLoading: socialLoading } = useQuery({
    queryKey: ['content', 'social_feed'],
    queryFn: () => endpoints.content.list('social_feed')
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 10000);
    return () => clearTimeout(timer);
  }, [currentVideo, videos.length]);

  const handleNextProduct = () => {
    if (!featuredProducts) return;
    setCurrentProductIndex((prev) => (prev + 1) % Math.ceil((featuredProducts.length || 1) / productsPerPage));
  };

  const handlePrevProduct = () => {
    if (!featuredProducts) return;
    setCurrentProductIndex((prev) => (prev - 1 + Math.ceil((featuredProducts.length || 1) / productsPerPage)) % Math.ceil((featuredProducts.length || 1) / productsPerPage));
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      const currentScroll = tabsRef.current.scrollLeft;
      // For RTL, scroll direction might be inverted depending on browser implementation,
      // but standard scrollTo handles this if dir="rtl" is set on parent.
      // We use a safe approach for both LTR/RTL.
      const isRTL = language === 'ar';
      let offset = direction === 'right' ? scrollAmount : -scrollAmount;
      if (isRTL) offset = -offset;

      tabsRef.current.scrollBy({
        left: offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`min-h-screen bg-[#fafafa] pb-24 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={dir}>
      <SEO />
      {/* Ultra-Premium Tech Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
        {/* Modern Tech Background with Video Carousel */}
        <div className="absolute inset-0 z-0 bg-[#05050A]">
          <AnimatePresence mode="wait">
            <motion.video
              key={currentVideo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              autoPlay
              muted
              playsInline
              onEnded={() => setCurrentVideo((prev) => (prev + 1) % videos.length)}
              src={videos[currentVideo]}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-[#05050A]/80 via-transparent to-[#05050A]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-transparent to-[#05050A]/40"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMUUyOTNCIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik02MCAwaE0wIDB2NjAiLz48L2c+PC9zdmc+')] opacity-20 Mix-blend-overlay"></div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-4 relative z-20 h-full flex flex-col justify-center items-center text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-sm md:text-base mb-6"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              {language === 'ar' ? 'مستقبل التكنولوجيا بين يديك' : 'The Future of Tech in Your Hands'}
            </motion.div>

            <h2 className="leading-tight flex flex-col items-center">
              <span className="text-6xl sm:text-8xl lg:text-[120px] font-black tracking-tight bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent mb-2 drop-shadow-2xl">WOLF</span>
              <span className="text-3xl sm:text-5xl lg:text-[60px] font-medium bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent tracking-[0.2em] uppercase">{language === 'ar' ? 'تكنو' : 'Techno'}</span>
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-lg lg:text-xl text-white/70 max-w-2xl leading-relaxed mx-auto"
            >
              {language === 'ar'
                ? 'اختبر قمة التكنولوجيا مع مجموعتنا الفاخرة من الإلكترونيات. حيث يلتقي الأداء بالتصميم العصري.'
                : 'Experience the pinnacle of technology with our luxury electronics collection. Where performance meets modern design.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-4 sm:gap-6 flex-wrap justify-center pt-8 w-full"
            >
              <Link href="/products">
                <Button size="lg" className="h-14 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white text-base font-bold shadow-lg transition-all hover:-translate-y-1">
                  {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                </Button>
              </Link>
              <Link href="/about-us">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-lg border border-white/20 text-white hover:text-white bg-white/5 backdrop-blur-md text-base font-bold hover:bg-white/10 transition-all hover:-translate-y-1">
                  {language === 'ar' ? 'استكشف المزيد' : 'Explore More'}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features / Trust Signals Section */}
      < section className="bg-white py-12 border-b border-gray-50 relative z-20" >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, titleAr: "شحن سريع ومجاني", titleEn: "Fast & Free Shipping", descAr: "للطلبات فوق 500 د.إ", descEn: "Orders over 500 AED" },
              { icon: ShieldCheck, titleAr: "ضمان الجودة", titleEn: "Quality Guarantee", descAr: "منتجات أصلية 100%", descEn: "100% Authentic" },
              { icon: RefreshCw, titleAr: "استبدال سهل", titleEn: "Easy Returns", descAr: "خلال 14 يوم", descEn: "Within 14 days" },
              { icon: Headset, titleAr: "دعم 24/7", titleEn: "24/7 Support", descAr: "نحن هنا لمساعدتك", descEn: "Here to help you" },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary/5">
                  <feature.icon size={28} />
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-2">{language === 'ar' ? feature.titleAr : feature.titleEn}</h3>
                <p className="text-gray-500 font-bold text-sm">{language === 'ar' ? feature.descAr : feature.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Featured Products */}
      <section className="pt-20 pb-0 relative z-20" >
        <div className="absolute inset-x-0 top-0 bottom-[200px] bg-white -z-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 pt-20 flex flex-col items-center relative"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              {t('mostFeatured')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4 max-w-2xl mx-auto">{t('mostFeaturedDesc')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {(featuredLoading ? Array(4).fill({}) : (featuredProducts as any[] || [])).map((product: any, i: number) => (
              featuredLoading ? (
                <div key={i} className="space-y-6">
                  <Skeleton className="aspect-[2/3] w-full rounded-[40px]" />
                  <div className="space-y-3 px-4">
                    <Skeleton className="h-6 w-3/4 mr-auto" />
                    <Skeleton className="h-4 w-1/2 mr-auto" />
                  </div>
                </div>
              ) : (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative w-full aspect-[2/3]"
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="relative z-10 h-full w-full rounded-[30px] overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-500">
                      <div className="h-full w-full relative flex flex-col">
                        <div className="flex-grow w-full relative h-full overflow-hidden bg-white">
                          <img
                            src={product.images?.[0] || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"}
                            alt={language === 'ar' ? product.nameAr : product.nameEn}
                            className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-110"
                            onError={(e: any) => {
                              e.target.src = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80";
                            }}
                          />
                        </div>

                        {/* Gold Bottom Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-0 opacity-0 bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 transition-all duration-300 group-hover:h-[40%] group-hover:opacity-100 overflow-hidden">
                          <h3 className="text-2xl font-bold text-primary-foreground mb-2 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            {language === 'ar' ? product.nameAr : product.nameEn}
                          </h3>
                          <p className="text-primary-foreground/90 text-lg font-medium mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                            {formatPrice(product.price)}
                          </p>
                          <Button className="bg-primary-foreground text-primary hover:bg-white rounded-full px-8 py-1 h-8 text-sm font-bold shadow-sm transition-transform hover:scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                            {t('more')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="pt-0 pb-24 relative z-20" >
        <div className="absolute inset-x-0 top-0 bottom-0 bg-[#f8f8f8] -z-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 pt-20 flex flex-col items-center relative"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              {t('shopByOccasion')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4 max-w-2xl mx-auto">{t('shopByOccasionDesc')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(collectionsLoading ? Array(3).fill({}) : (collections as any[] || [])).map((collection: any, i: number) => (
              collectionsLoading ? (
                <Skeleton key={i} className="aspect-[2/3] w-full rounded-[40px]" />
              ) : (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative w-full aspect-[2/3]"
                >
                  <Link href={`/products?collection=${collection.id}`}>
                    <div className="relative z-10 h-full w-full rounded-[40px] overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-500 bg-white">
                      <div className="h-full w-full relative flex flex-col">
                        <div className="flex-grow w-full relative h-full overflow-hidden">
                          <img
                            src={collection.coverImage || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"}
                            alt={language === 'ar' ? collection.nameAr : collection.nameEn}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                            onError={(e: any) => {
                              e.target.src = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80";
                            }}
                          />
                        </div>

                        {/* Gold Bottom Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-0 opacity-0 bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 transition-all duration-300 group-hover:h-[45%] group-hover:opacity-100 overflow-hidden">
                          <h3 className="text-2xl md:text-3xl font-black text-primary-foreground mb-2 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            {language === 'ar' ? collection.nameAr : collection.nameEn}
                          </h3>
                          <div className="flex items-center gap-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                            <div className="h-1 w-12 bg-primary-foreground rounded-full" />
                            <p className="text-primary-foreground/90 text-lg font-bold">
                              {collection.productsCount || 0} {language === 'ar' ? 'منتج' : 'Products'}
                            </p>
                          </div>
                          <Button className="bg-primary-foreground text-primary hover:bg-white rounded-full px-8 py-1 h-8 text-sm font-black shadow-sm transition-transform hover:scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                            {t('shopNow')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Split Banner Section (Exceptional Performance) */}
      <section className="py-24 bg-background relative overflow-hidden text-foreground border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/2 relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden relative shadow-2xl border border-white/10">
                <img
                  src="/high-performance-tech.png"
                  alt="High Performance Tech"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              {/* Floating Element */}
              <div className="absolute -bottom-12 -right-12 w-48 h-48 hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop"
                  alt="Smartwatch"
                  className="w-full h-full object-cover rounded-full border-4 border-background shadow-xl"
                />
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/2 text-center lg:text-left rtl:lg:text-right relative flex flex-col"
            >
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight max-w-full">
                {language === 'ar' ? "أداء استثنائي" : "Exceptional Performance"}
              </h2>
              <p className="text-2xl lg:text-4xl text-primary font-bold mb-6">
                {language === 'ar' ? "تكنولوجيا متطورة" : "Cutting-edge Tech"}
              </p>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                {language === 'ar' ? "اكتشف مجموعتنا المميزة التي تجمع بين القوة والأناقة العصرية، مصممة خصيصاً لتلبية احتياجاتك الرقمية." : "Discover our premium collection that combines power with modern elegance, designed specifically to meet your digital needs."}
              </p>
              <Link href="/products" className="relative z-10 w-fit mx-auto lg:mx-0">
                <Button className="bg-primary text-primary-foreground px-10 py-6 rounded-lg text-lg font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-primary/20 shadow-lg">
                  {t('shopNow')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Products Tabbed Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 flex flex-col items-center relative">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              {language === 'ar' ? "أحدث الإصدارات تقنياً" : "Shop the Latest Tech"}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">{t('trendingProducts')}</p>
          </div>

          <Tabs defaultValue="all" value={selectedCategory === null ? "all" : selectedCategory.toString()} onValueChange={(val) => setSelectedCategory(val === 'all' ? null : Number(val))} className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="relative group/tabs flex items-center">
              <button
                onClick={() => scrollTabs('left')}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 md:hidden hover:-white/5 transition-colors text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="w-full overflow-hidden relative">
                <TabsList
                  ref={tabsRef}
                  className="w-full flex justify-start md:justify-center bg-transparent border-b border-gray-100 mb-12 h-auto p-0 gap-4 md:gap-8 flex-nowrap overflow-x-auto no-scrollbar scroll-smooth"
                >
                  <TabsTrigger
                    value="all"
                    className="bg-transparent border-b-4 border-transparent data-[state=active]:-primary data-[state=active]:-primary rounded-none px-4 py-4 text-base md:text-lg font-bold text-gray-400 hover:-primary/80 transition-all uppercase tracking-wider whitespace-nowrap"
                  >
                    {t('all')}
                  </TabsTrigger>
                  {collections?.map((col: any) => (
                    <TabsTrigger
                      key={col.id}
                      value={col.id.toString()}
                      className="bg-transparent border-b-4 border-transparent data-[state=active]:-primary data-[state=active]:-primary rounded-none px-4 py-4 text-base md:text-lg font-bold text-gray-400 hover:-primary/80 transition-all uppercase tracking-wider whitespace-nowrap"
                    >
                      {language === 'ar' ? col.nameAr : col.nameEn}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <button
                onClick={() => scrollTabs('right')}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 md:hidden hover:-white/5 transition-colors text-gray-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <TabsContent value={selectedCategory === null ? "all" : selectedCategory.toString()} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {(productsLoading ? Array(8).fill({}) : (products as any[] || [])).map((product: any, i: number) => (
                  <ProductCard key={i} product={product} loading={productsLoading} onQuickView={setQuickViewProduct} />
                ))}
              </div>
              {!productsLoading && (!products || products.length === 0) && (
                <div className="w-full py-20 text-center text-gray-400 bg-gray-50 rounded-[3rem]">
                  <p className="text-xl font-bold">{t('noProductsInCollection')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section >

      {/* Flash Sales Section */}
      <FlashSalesSection onQuickView={setQuickViewProduct} />

      {/* Appointment Booking Section */}
      <AppointmentSection />

      {/* New Arrivals Section */}
      <section className="bg-white relative overflow-hidden pb-32 z-10 pt-0" >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 flex flex-col items-center relative"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              {t('newArrivals')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">{t('newArrivalsDesc')}</p>
          </motion.div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {newArrivalsLoading ? (
                Array(3).fill({}).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full rounded-[45px]" />
                ))
              ) : (
                (() => {
                  const items = newArrivals as any[] || [];
                  if (items.length === 0) return null;
                  const visible = [];
                  for (let i = 0; i < 3; i++) {
                    if (items.length > 0) visible.push(items[(currentFlowerIndex + i) % items.length]);
                  }
                  return visible.map((product: any, i: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex flex-col drop-shadow-2xl"
                    >
                      <Link href={`/products/${product.id}`}>
                        <div className="relative group cursor-pointer h-full flex flex-col shadow-2xl rounded-[45px] overflow-hidden">
                          <div className="bg-transparent aspect-[3/4] overflow-hidden">
                            <img
                              src={product.images?.[0]}
                              alt={product.nameAr}
                              className="w-full h-full object-contain object-bottom transition-transform duration-700 group-hover:scale-110"
                              onError={(e: any) => {
                                e.target.src = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80";
                              }}
                            />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-0 opacity-0 bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 transition-all duration-300 group-hover:h-[40%] group-hover:opacity-100 overflow-hidden z-20">
                            <h3 className="text-2xl font-black text-primary-foreground mb-2 leading-tight">
                              {language === 'ar' ? product.nameAr : product.nameEn}
                            </h3>
                            <p className="text-primary-foreground/90 text-lg font-bold mb-4">
                              {formatPrice(product.price)}
                            </p>
                            <Button className="bg-primary-foreground text-primary hover:bg-white rounded-full px-8 py-2 h-10 text-base font-black shadow-lg transition-transform hover:scale-105">
                              {t('more')}
                            </Button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="pt-0 pb-24 relative z-20" >
        <div className="absolute inset-0 bg-[#0A0A0A] -z-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 pt-20 flex flex-col items-center relative"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {t('bestSellers')}
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">{t('bestSellersDesc')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(bestSellersLoading ? Array(3).fill({}) : (bestSellers as any[] || []).slice(0, 3)).map((product: any, i: number) => (
              bestSellersLoading ? (
                <Skeleton key={i} className="aspect-[2/3] w-full rounded-[40px]" />
              ) : (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative w-full aspect-[2/3]"
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="relative z-10 h-full w-full rounded-[40px] overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-500 bg-[#0D0D0D] border border-white/5">
                      <div className="h-full w-full relative flex flex-col">
                        <div className="flex-grow w-full relative h-full overflow-hidden">
                          <img
                            src={product.images?.[0]}
                            alt={language === 'ar' ? product.nameAr : product.nameEn}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                            onError={(e: any) => {
                              e.target.src = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80";
                            }}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-0 opacity-0 bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 transition-all duration-300 group-hover:h-[45%] group-hover:opacity-100 overflow-hidden">
                          <h3 className="text-2xl md:text-3xl font-black text-primary-foreground mb-2">
                            {language === 'ar' ? product.nameAr : product.nameEn}
                          </h3>
                          <p className="text-primary-foreground/90 text-lg font-bold mb-4">
                            {formatPrice(product.price)}
                          </p>
                          <Button className="bg-primary-foreground text-primary hover:bg-white rounded-full px-8 py-1 h-8 text-sm font-black shadow-sm transition-transform hover:scale-105">
                            {t('more')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>


      {/* Tech Ecosystem Banner */}
      <section className="py-12 md:py-24 container mx-auto px-4 max-w-7xl">
        <div className="relative h-[450px] md:h-[650px] rounded-[3rem] overflow-hidden group shadow-2xl transition-all duration-700 border border-white/10 group">
          {/* Animated Background Image */}
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop"
            alt="Tech Ecosystem"
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s] ease-out ${language === 'ar' ? 'object-left' : 'object-right'}`}
          />

          {/* Decorative Corner Accents */}
          <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-primary/30 rounded-tr-[3rem] pointer-events-none group-hover:border-primary/60 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-primary/30 rounded-bl-[3rem] pointer-events-none group-hover:border-primary/60 transition-colors duration-500" />

          {/* Luxury Overlay with Gradient */}
          <div className={`absolute inset-0 ${language === 'ar'
            ? 'bg-gradient-to-l from-black/95 via-black/40 to-transparent justify-start'
            : 'bg-gradient-to-r from-black/95 via-black/40 to-transparent justify-start'
            } flex items-center p-4 sm:p-12 md:p-20`}>

            {/* Glass Box Content Wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`max-w-2xl p-8 md:p-12 ${language === 'ar' ? 'text-right' : 'text-left'} relative overflow-hidden`}
            >
              {/* Subtle light effect inside the box */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 sm:mb-8 leading-tight tracking-tight drop-shadow-2xl"
                >
                  <span className="bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                    {t('exclusiveExperience')}
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base sm:text-xl text-gray-200/90 mb-8 sm:mb-12 leading-relaxed font-medium max-w-md md:max-w-xl"
                >
                  {t('exclusiveExperienceDesc')}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="h-14 sm:h-18 px-10 sm:px-14 rounded-2xl bg-primary text-white hover:bg-primary/90 text-lg sm:text-2xl font-black shadow-primary/30 shadow-2xl transition-all relative group overflow-hidden"
                  >
                    <span className="relative z-10">{t('discoverExclusive')}</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-24 bg-[#05050A] relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 flex flex-col items-center relative">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {language === 'ar' ? "تجارب التسوق" : "Shopping Experiences"}
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto px-4">
              {language === 'ar' ? "آراء عملائنا بعد تجربة أجهزتنا" : "Customer reviews after experiencing our devices"}
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <ReviewModal />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 px-4">
            {storeReviewsLoading ? (
              Array(3).fill({}).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-[3rem] bg-white/10 backdrop-blur-sm" />
              ))
            ) : (storeReviews?.length === 0 ? (
              <div className="col-span-3 text-center text-white/80 text-xl py-12 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10">
                {language === 'ar' ? "كن أول من يقيمنا!" : "Be the first to review us!"}
              </div>
            ) : (
              (storeReviews as any[])?.slice(0, 3).map((review: any, i: number) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative group hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="absolute top-10 right-10 text-6xl text-primary/10 opacity-50 font-black">"</div>

                  <div className="flex gap-1 mb-6 text-yellow-500">
                    {Array(review.rating).fill(0).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>

                  <p className="text-white/70 text-lg leading-relaxed mb-8 font-medium line-clamp-4">
                    {review.comment}
                  </p>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-primary border border-white/10">
                      {review.guestName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{review.guestName}</h4>
                      <p className="text-sm text-white/40 font-medium">{review.city}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ))}
          </div>
        </div>
      </section >

      {/* Social Feed Section */}
      <section className="py-12 relative z-20" >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                <Instagram className="text-primary" size={32} />
                @ahmedkrishna
              </h2>
              <p className="text-gray-500 font-bold">{language === 'ar' ? "تابعينا على انستقرام" : "Follow us on Instagram"}</p>
            </div>
            <a href="https://www.instagram.com/ahmedkrishna/ogdg" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full px-8 h-12 border-2 border-gray-200 text-gray-900 dark:text-gray-100 hover:border-primary hover:text-primary font-bold">
                {language === 'ar' ? "مشاهدة الكل" : "View All"}
              </Button>
            </a>
          </div>

          {socialLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-[2rem]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(socialFeedData as any[] || []).map((item: any, i: number) => (
                <a
                  key={i}
                  href={item.data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-[2rem] overflow-hidden group relative cursor-pointer block"
                >
                  <img src={item.data.imageUrl} alt="Instagram" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Instagram size={28} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Professional Newsletter - Elite Club Design */}
      <section className="py-24 bg-black relative z-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[3rem] bg-[#0A0A0A] shadow-2xl isolate border border-white/5">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full" />

            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />

            <div className="relative z-10 px-6 py-20 md:px-20 md:py-24 text-center">
              <span className="inline-block py-1 px-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase mb-6 backdrop-blur-md">
                {t('exclusiveInvitation')}
              </span>

              <h2 className="text-4xl md:text-6xl text-white mb-6 leading-tight font-black">
                {t('joinElite')}
              </h2>

              <p className="text-white/70 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                {t('joinEliteDesc')}
              </p>

              <form className="max-w-md mx-auto flex flex-col gap-4">
                <div className="relative group">
                  <input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    className="w-full px-8 py-5 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all duration-300 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-full ring-1 ring-white/10 group-hover:ring-white/20 pointer-events-none transition-all" />
                </div>

                <Button className="w-full py-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1 h-auto">
                  {t('subscribe')}
                </Button>
              </form>

              <p className="text-white/30 text-xs mt-6">
                {t('noSpam')}
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ Section */}
      <HomeFAQ />

      <BackToTop />

      <QuickViewModal
        initialProduct={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
