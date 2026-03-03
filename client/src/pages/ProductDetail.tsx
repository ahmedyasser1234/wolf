import { useState, useEffect, useMemo } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Share2,
  Ruler,
  Store,
  ZoomIn,
  User,
  Plus,
  Minus,
  MessageSquare,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Tag,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAddToCart } from "@/hooks/useAddToCart";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useChat } from "@/contexts/ChatContext";
import { ProductCard } from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { QuickViewModal } from "@/components/home/QuickViewModal";

function RelatedProducts({ collectionId, currentProductId, language }: { collectionId?: number, currentProductId: number, language: string }) {
  const { t } = useLanguage();
  const { data: relatedProducts, isLoading } = useQuery({
    queryKey: ['products', 'related', collectionId],
    queryFn: () => endpoints.products.list({ collectionId }),
    enabled: !!collectionId
  });

  if (isLoading || !relatedProducts || !Array.isArray(relatedProducts) || relatedProducts.length <= 1) return null;

  // Filter out the current product
  const productsToShow = relatedProducts.filter((p: any) => p.id !== currentProductId).slice(0, 4);

  if (productsToShow.length === 0) return null;

  return (
    <div className="mt-32 border-t border-gray-100 pt-20">
      <div className="flex items-center justify-between mb-12" dir="rtl">
        <h2 className="text-3xl font-black text-gray-900">{language === 'ar' ? "منتجات قد تعجبك" : "Products You May Like"}</h2>
        <Link href="/products">
          <Button variant="ghost" className="-primary font-bold hover:-white/5 rounded-full">
            {t('viewAll')} <ChevronRight className={`mr-2 w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {productsToShow.map((product: any, idx: number) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </div>
  );
}

function OffersDisplay({ productId, language }: { productId: number, language: string }) {
  const { data: offers } = useQuery({
    queryKey: ['offers', 'product', productId],
    queryFn: async () => {
      // Fetch all global offers and filter for this product
      const res = await api.get(`/offers`);
      const allOffers = res.data;
      const now = new Date();

      return allOffers.filter((o: any) => {
        const now = new Date();
        const startDate = new Date(o.startDate);
        const endDate = new Date(o.endDate);
        endDate.setHours(23, 59, 59, 999);

        return o.isActive &&
          startDate <= now &&
          endDate >= now &&
          (!o.productIds || o.productIds.length === 0 || o.productIds.includes(productId));
      });
    }
  });

  if (!offers || offers.length === 0) return null;

  return (
    <div className="container mx-auto px-4 mt-6">
      <div className="grid gap-4">
        {offers.map((offer: any) => (
          <div key={offer.id} className="bg-gradient-to-r -white/5 to-orange-50 border -white/10 p-4 rounded-xl flex items-center justify-between shadow-sm animate-pulse" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="-primary text-white p-2 rounded-full">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="font-bold -primary text-lg">
                  {language === 'ar' ? offer.nameAr : offer.nameEn}
                </h3>
                <p className="-primary text-sm font-medium">
                  {language === 'ar' ? "خصم " : "OFF "} <span className="font-black text-xl">{offer.discountPercent}%</span>
                  {offer.minQuantity > 1 ? (language === 'ar' ? ` عند شراء ${offer.minQuantity} قطع فأكثر` : ` for ${offer.minQuantity} items or more`) : ''}
                </p>
              </div>
            </div>
            <div className="text-center bg-white/50 p-2 rounded-lg">
              <span className="block text-xs text-gray-500 font-bold">{language === 'ar' ? "ينتهي في" : "Ends on"}</span>
              <span className="font-mono -primary font-bold">{new Date(offer.endDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<any>(null);

  // Multi-size quantity state: { "M": 2, "L": 1 }
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  // Payment method selection state
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<'cash' | 'installment' | null>(null);
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { openChat } = useChat();

  const productId = params?.id ? parseInt(params.id) : 0;

  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => endpoints.products.get(productId),
    enabled: !!productId,
  });

  // Automatically set selected color if available
  useEffect(() => {
    if (productData?.colors?.length > 0 && !selectedColor) {
      // Don't auto-select to keep default images first
    }
  }, [productData]);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: () => endpoints.reviews.product.list(productId),
    enabled: !!productId,
  });

  const addToCartMutation = useAddToCart();

  // Fetch installment plans for BNPL display
  const { data: installmentPlans } = useQuery({
    queryKey: ['installments', 'active', productData?.product?.collectionId],
    queryFn: () => endpoints.installments.active(productData?.product?.collectionId),
    staleTime: 1000 * 60 * 10,
    enabled: !!productData?.product?.collectionId
  });

  const submitReviewMutation = useMutation({
    mutationFn: (data: { productId: number; rating: number; comment?: string }) =>
      endpoints.reviews.product.create(data),
    onSuccess: () => {
      toast.success("تم إضافة تقييمك بنجاح");
      queryClient.invalidateQueries({ queryKey: ["reviews", "product", productId] });
      setReviewComment("");
      setReviewRating(5);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "حدث خطأ. تأكد من تسجيل الدخول");
    },
  });



  const { data: navData } = useQuery({
    queryKey: ['products', 'navigation', productData?.collectionId, productData?.categoryId],
    queryFn: async () => {
      let result;
      if (productData?.collectionId) {
        result = await endpoints.products.list({ collectionId: productData.collectionId });
      } else if (productData?.categoryId) {
        result = await endpoints.products.list({ categoryId: productData.categoryId });
      } else {
        result = await endpoints.products.list();
      }
      // Handle potential { products: [], total: 0 } structure or direct array
      return Array.isArray(result) ? result : (result?.products || []);
    },
    enabled: !!productData
  });

  const navigation = useMemo(() => {
    if (!navData || !Array.isArray(navData) || navData.length <= 1) return null;
    const currentIndex = navData.findIndex((p: any) => String(p.id) === String(productId));
    if (currentIndex === -1) return null;

    const prevIndex = (currentIndex - 1 + navData.length) % navData.length;
    const nextIndex = (currentIndex + 1) % navData.length;

    return {
      prevId: navData[prevIndex].id,
      nextId: navData[nextIndex].id,
    };
  }, [navData, productId]);

  const handleSizeQtyChange = (size: string, delta: number) => {
    setSizeQuantities(prev => {
      const current = prev[size] || 0;
      const maxStock = product.sizes?.find((s: any) => s.size === size)?.quantity || 0;
      const next = Math.max(0, Math.min(maxStock, current + delta));
      return { ...prev, [size]: next };
    });
  };

  const totalSelectedItems = Object.values(sizeQuantities).reduce((a, b) => a + b, 0);

  const handleAddToCartMulti = async () => {
    // Check if user is admin
    if (user && user.role === 'admin') {
      toast.error(language === 'ar' ? "لا يمكن للمسؤول إضافة منتجات للسلة" : "Admins cannot add items to cart");
      return;
    }

    if (product.sizes && product.sizes.length > 0) {
      if (totalSelectedItems === 0) {
        toast.error(language === 'ar' ? "الرجاء اختيار الكمية والمقاس" : "Please select quantity and size");
        return;
      }

      const promises = Object.entries(sizeQuantities).map(async ([size, qty]) => {
        if (qty > 0) {
          return addToCartMutation.mutateAsync({
            productId,
            quantity: qty,
            size,
            color: selectedColor?.colorName,
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
        }
      });

      await Promise.all(promises);
      setSizeQuantities({});
      setSelectedSize(null);
    } else {
      addToCartMutation.mutate({
        productId,
        quantity,
        size: undefined,
        color: selectedColor?.colorName,
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
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = language === 'ar' ? product.nameAr : product.nameEn;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // Silently fail or fallback
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(language === 'ar' ? "تم نسخ الرابط" : "Link copied to clipboard");
    }
  };

  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-status', productId],
    queryFn: () => endpoints.wishlist.check(productId),
    enabled: !!user && !!productId && productId > 0,
  });

  const isFavorite = wishlistStatus?.isFavorite;

  const toggleWishlistMutation = useMutation({
    mutationFn: () => isFavorite
      ? endpoints.wishlist.remove(productId)
      : endpoints.wishlist.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-status', productId] });
      toast.success(isFavorite
        ? (language === 'ar' ? "تمت الإزالة من المفضلة" : "Removed from wishlist")
        : (language === 'ar' ? "تمت الإضافة للمفضلة" : "Added to wishlist")
      );
    }
  });

  const handleToggleWishlist = () => {
    if (!user) return toast.error(language === 'ar' ? "يرجى تسجيل الدخول أولاً" : "Please login first");
    toggleWishlistMutation.mutate();
  };

  const handleToggleFavorite = handleToggleWishlist;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">المنتج غير موجود</h1>
          <Link href="/products">
            <Button size="lg" className="rounded-full bg-primary text-primary-foreground">العودة للمنتجات</Button>
          </Link>
        </div>
      </div>
    );
  }

  const product = productData.product;
  const collection = productData.collection;
  const category = productData.category;
  const colors = productData.colors || [];

  // Image selection logic
  const galleryImages = (selectedColor && selectedColor.images && selectedColor.images.length > 0)
    ? selectedColor.images
    : (product.images?.slice(1) || []); // Treat images[0] as cover only, excluding from detail gallery

  const displayImage = galleryImages[selectedImage] || galleryImages[0] || (product.images?.[0]) || "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=1200&h=1500&fit=crop";

  return (
    <div className="min-h-screen bg-white pb-20 overflow-x-hidden">
      <section className="pt-4">
        <OffersDisplay productId={product.id} language={language} />
      </section>

      <section className="container mx-auto px-4 mt-4">
        <div className="grid lg:grid-cols-[1fr_550px] gap-12 relative items-start">
          {/* Left: Product Media */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="lg:sticky lg:top-20 h-fit"
            >
              <div
                className="aspect-[3/4] md:aspect-[3/4] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] md:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] mb-6 md:mb-10 relative group cursor-zoom-in max-w-2xl mx-auto"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={displayImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    src={displayImage}
                    alt={language === 'ar' ? product.nameAr : product.nameEn}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.src = "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=1200&h=1500&fit=crop";
                    }}
                    style={isZoomed ? {
                      transform: `scale(2.2)`,
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    } : {}}
                  />
                </AnimatePresence>

                {product.discount > 0 && (
                  <div className="absolute top-10 right-10 z-20">
                    <div className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-2xl font-black shadow-[0_15px_30px_rgba(212,175,55,0.4)] transform rotate-3">
                      -{product.discount}%
                    </div>
                  </div>
                )}

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2 rounded-full text-sm font-black flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ZoomIn className="w-5 h-5" />
                  {t('scrollZoom')}
                </div>

                {/* Gallery Navigation Arrows */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev > 0 ? prev - 1 : galleryImages.length - 1); }}
                    variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/50 backdrop-blur-md hover:bg-white text-gray-900 pointer-events-auto shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev < galleryImages.length - 1 ? prev + 1 : 0); }}
                    variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-white/50 backdrop-blur-md hover:bg-white text-gray-900 pointer-events-auto shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6 rotate-180" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Thumbnails */}
              <div className="flex gap-3 md:gap-6 justify-start md:justify-center overflow-x-auto py-4 md:py-6 px-4 no-scrollbar scroll-pl-4">
                {galleryImages.map((img: string, idx: number) => (
                  <button
                    key={`thumb-${idx}`}
                    onClick={() => {
                      setSelectedImage(idx);
                    }}
                    className={`relative w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 transition-all duration-500 shrink-0 ${selectedImage === idx ? "border-primary scale-105 md:scale-110 shadow-lg md:shadow-2xl bg-white/10" : "border-transparent opacity-50 hover:opacity-100 scale-100 hover:scale-105"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=300&h=400&fit=crop";
                      }}
                    />
                  </button>
                ))}

                {/* Independent Color Quick-Switchers (If not already selected) */}
                {!selectedColor && colors.map((color: any, idx: number) => (
                  <button
                    key={`color-thumb-${idx}`}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedImage(0);
                    }}
                    className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-transparent opacity-50 hover:opacity-100 scale-100 hover:scale-105 transition-all duration-500 shrink-0"
                  >
                    <img src={color.images?.[0] || product.images?.[0]} alt={color.colorName} className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?w=300&h=400&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color.colorCode }} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Product Details */}
          <div className="space-y-6 md:space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-right"
            >
              <div className="flex items-center justify-between gap-4 mb-4 md:mb-6" dir="rtl">
                <div className="flex bg-gray-50/50 backdrop-blur-sm px-3 py-1.5 rounded-full items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-gray-500 border border-gray-100/50 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar whitespace-nowrap">
                  <Link href="/">
                    <span className="hover:text-primary transition-colors">الرئيسية</span>
                  </Link>
                  <ChevronRight className="w-3 h-3 translate-y-[1px]" />
                  {category && (
                    <>
                      <span className="truncate max-w-[80px] md:max-w-none">{language === 'ar' ? category.nameAr : category.nameEn}</span>
                      <ChevronRight className="w-3 h-3 translate-y-[1px]" />
                    </>
                  )}
                  <span className="text-primary truncate max-w-[100px] md:max-w-none">{language === 'ar' ? product.nameAr : product.nameEn}</span>
                </div>

                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!navigation?.prevId}
                    onClick={() => navigation?.prevId && setLocation(`/products/${navigation.prevId}`)}
                    className="w-8 h-8 rounded-full hover:bg-white/5 text-gray-400 hover:text-primary transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!navigation?.nextId}
                    onClick={() => navigation?.nextId && setLocation(`/products/${navigation.nextId}`)}
                    className="w-8 h-8 rounded-full hover:bg-white/5 text-gray-400 hover:text-primary transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="flex gap-3 md:gap-4 self-end md:self-auto">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-gray-100 hover:bg-primary/20 hover:text-primary transition-all shadow-sm"
                  >
                    <Share2 size={20} className="md:w-6 md:h-6" />
                  </Button>
                  {user?.role !== 'admin' && (
                    <Button
                      onClick={handleToggleFavorite}
                      variant="outline"
                      size="icon"
                      className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-gray-100 hover:bg-primary/20 hover:text-red-500 transition-all shadow-sm ${isFavorite ? 'bg-red-50 text-red-500 border-red-100' : ''}`}
                    >
                      <Heart size={20} className={`md:w-6 md:h-6 ${isFavorite ? "fill-current" : ""}`} />
                    </Button>
                  )}
                </div>

              </div>

              <div className="inline-block bg-white/5 text-primary px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm font-black tracking-widest uppercase mb-4 md:mb-6 border border-white/10">
                {collection ? (language === 'ar' ? collection.nameAr : collection.nameEn) : 'Exclusive Edition'}
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 md:mb-6 leading-[1.2] md:leading-[1.1] tracking-tighter text-right">
                {language === 'ar' ? product.nameAr : product.nameEn}
              </h1>

              <div className="flex flex-wrap items-center justify-start gap-3 md:gap-6 mb-8 md:mb-12" dir="rtl">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[10px] md:text-xs shrink-0">
                  {t('inStock')}
                </Badge>
                <div className="hidden md:block h-4 w-px bg-gray-200"></div>
                <span className="text-gray-500 font-bold text-xs md:text-sm lg:text-lg shrink-0">
                  {product.reviewCount} {t('verifiedReviews')}
                </span>
                <div className="h-4 w-px bg-gray-200"></div>
                <div className="flex items-center gap-1 direction-ltr">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 md:w-6 md:h-6 ${i < Math.round(Number(product.rating)) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] md:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-50 mb-8 md:mb-12 relative overflow-hidden ring-1 ring-gray-100 md:ring-0">
                <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 -white/5/50 blur-2xl md:blur-3xl -mr-10 -mt-10 rounded-full"></div>

                <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-10 relative z-10" dir="rtl">
                  <div className="text-right">
                    <p className="text-gray-400 font-bold text-sm md:text-lg mb-1 md:mb-2">{t('currentPrice')}</p>
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                        {language === 'ar' ? Number(product.price).toLocaleString('ar-SA') : Number(product.price).toLocaleString()}
                      </span>
                      <span className="text-lg md:text-2xl font-black text-primary mt-2 md:mt-4 uppercase">{t('currency')}</span>
                    </div>
                  </div>
                  {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                    <div className="bg-gray-50 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border border-gray-100">
                      <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5 md:mb-1">{t('originalPrice')}</p>
                      <span className="text-base md:text-xl text-gray-400 line-through font-bold">
                        {language === 'ar' ? Number(product.originalPrice).toLocaleString('ar-SA') : Number(product.originalPrice).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>


                {/* ===== INSTALLMENT / PAYMENT SECTION ===== */}
                {installmentPlans && (installmentPlans as any[]).filter((p: any) => p.isActive && product.price >= (p.minOrderAmount || 0)).length > 0 && (
                  <div className="mb-6 md:mb-8 relative z-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>

                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard size={16} className="text-green-600 shrink-0" />
                      <p className="text-sm font-black text-gray-700">
                        {language === 'ar' ? 'قسّط الآن — اختر خطتك' : 'Pay in Installments — Choose Your Plan'}
                      </p>
                    </div>

                    {/* Clickable Plan Cards */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(installmentPlans as any[])
                        .filter((p: any) => p.isActive && product.price >= (p.minAmount || 0))
                        .map((plan: any) => {
                          const interestAmount = product.price * (plan.interestRate || 0) / 100;
                          const total = product.price + interestAmount;
                          const monthly = total / plan.months;
                          const isZeroInterest = !plan.interestRate || plan.interestRate === 0;
                          const isSelected = selectedPlanId === plan.id;
                          return (
                            <button
                              key={plan.id}
                              onClick={() => {
                                setSelectedPlanId(isSelected ? null : plan.id);
                                setPaymentChoice(null); // reset choice when plan changes
                              }}
                              className={`relative border-2 rounded-xl p-3 text-center transition-all duration-200 ${isSelected
                                ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                : isZeroInterest
                                  ? 'border-green-200 bg-green-50 hover:border-green-400'
                                  : 'border-orange-200 bg-orange-50 hover:border-orange-400'
                                }`}
                            >
                              {/* Selected checkmark */}
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <p className={`text-[10px] font-black uppercase mb-1 ${isSelected ? 'text-primary' : isZeroInterest ? 'text-green-600' : 'text-orange-600'}`}>
                                {plan.months} {language === 'ar' ? 'شهر' : 'Months'}
                              </p>
                              <p className={`text-lg font-black ${isSelected ? 'text-primary' : isZeroInterest ? 'text-green-800' : 'text-orange-800'}`}>
                                {monthly.toLocaleString(language === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 0 })}
                              </p>
                              <p className={`text-[10px] font-bold mb-1.5 ${isSelected ? 'text-primary' : isZeroInterest ? 'text-green-600' : 'text-orange-600'}`}>
                                {t('currency')}/{language === 'ar' ? 'شهر' : 'mo'}
                              </p>
                              <div className={`w-full h-px mb-1.5 ${isSelected ? 'bg-primary/30' : isZeroInterest ? 'bg-green-200' : 'bg-orange-200'}`} />
                              <p className="text-[10px] text-gray-500 font-bold">
                                {language === 'ar' ? 'الإجمالي:' : 'Total:'} <span className="font-black text-gray-700">{total.toLocaleString(language === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 0 })} {t('currency')}</span>
                              </p>
                              {isZeroInterest ? (
                                <span className="text-[9px] text-green-600 font-black bg-green-100 px-1.5 py-0.5 rounded-full">
                                  {language === 'ar' ? '0% فوائد' : '0% interest'}
                                </span>
                              ) : (
                                <span className="text-[9px] text-orange-600 font-black">
                                  +{interestAmount.toLocaleString('en', { maximumFractionDigits: 0 })} {t('currency')} {language === 'ar' ? 'فوائد' : 'interest'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>

                    {/* Down Payment info */}
                    {selectedPlanId && (() => {
                      const plan = (installmentPlans as any[]).find((p: any) => p.id === selectedPlanId);
                      if (!plan) return null;

                      const interestAmount = product.price * (plan.interestRate || 0) / 100;
                      const totalWithInterest = product.price + interestAmount;

                      const dpPct = plan.downPaymentPercentage > 0 ? plan.downPaymentPercentage : (category?.downPaymentPercentage || 0);

                      if (dpPct <= 0) return null;

                      const dpAmount = totalWithInterest * dpPct / 100;
                      const financedAmount = totalWithInterest - dpAmount;
                      return (
                        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black text-purple-700">
                              💳 {language === 'ar' ? 'الدفعة الأولى المطلوبة' : 'Required Down Payment'}
                            </span>
                            <span className="ms-auto text-xs font-black bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{dpPct}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-center">
                              <p className="text-[10px] text-purple-500 font-bold">{language === 'ar' ? 'الدفعة الأولى' : 'Down Payment'}</p>
                              <p className="text-base font-black text-purple-800">
                                {dpAmount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 0 })} {t('currency')}
                              </p>
                            </div>
                            <div className="text-purple-300 font-black">+</div>
                            <div className="text-center">
                              <p className="text-[10px] text-purple-500 font-bold">{language === 'ar' ? 'المبلغ المتبقي للأقساط' : 'Financed Amount'}</p>
                              <p className="text-base font-black text-purple-800">
                                {financedAmount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 0 })} {t('currency')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedPlanId && (() => {
                      const plan = (installmentPlans as any[]).find((p: any) => p.id === selectedPlanId);
                      const minQ = plan?.minQuantity || 1;
                      const maxQ = plan?.maxQuantity || 0;
                      const isLow = quantity < minQ;
                      const isHigh = maxQ > 0 && quantity > maxQ;
                      const isInvalid = isLow || isHigh;

                      if (!isInvalid) return null;

                      return (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 font-bold text-xs" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          <AlertTriangle size={16} />
                          <span>
                            {language === 'ar'
                              ? `هذا النظام متاح فقط لكمية بين ${minQ} و ${maxQ > 0 ? maxQ : '∞'} قطع. يرجى تعديل الكمية لاستخدام التقسيط.`
                              : `This plan is only available for quantities between ${minQ} and ${maxQ > 0 ? maxQ : 'unlimited'}. Please adjust quantity to use installments.`}
                          </span>
                        </div>
                      );
                    })()}

                    {/* ===== PAYMENT METHOD CHOICE ===== */}
                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                      <p className="text-xs font-black text-gray-500 mb-3 text-center uppercase tracking-wider">
                        {language === 'ar' ? 'اختر طريقة الدفع' : 'Choose Payment Method'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Cash Button */}
                        <button
                          onClick={() => {
                            setPaymentChoice('cash');
                            // Go directly to checkout - no intent needed
                            localStorage.removeItem('wolf_payment_intent');
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-bold transition-all duration-200 ${paymentChoice === 'cash'
                            ? 'border-green-500 bg-green-50 text-green-800 scale-[1.02] shadow-md'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50/50'
                            }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 ${paymentChoice === 'cash' ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-sm font-black">{language === 'ar' ? 'دفع كاش' : 'Pay Cash'}</span>
                          <span className="text-[10px] font-medium text-gray-400">{language === 'ar' ? 'الدفع الكامل فوراً' : 'Full payment now'}</span>
                        </button>

                        {/* Installment Button */}
                        <button
                          disabled={selectedPlanId ? (() => {
                            const plan = (installmentPlans as any[]).find((p: any) => p.id === selectedPlanId);
                            if (!plan) return false;
                            const minQ = plan.minQuantity || 1;
                            const maxQ = plan.maxQuantity || 0;
                            return quantity < minQ || (maxQ > 0 && quantity > maxQ);
                          })() : false}
                          onClick={() => {
                            if (!selectedPlanId) {
                              // flash message to pick a plan
                              const el = document.getElementById('installment-plans-hint');
                              if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2500); }
                              return;
                            }
                            const plan = (installmentPlans as any[]).find((p: any) => p.id === selectedPlanId);
                            if (!plan) return;

                            const basePrice = product.price * quantity;
                            const interestAmount = basePrice * (plan.interestRate || 0) / 100;
                            const totalWithInterest = basePrice + interestAmount;
                            const dpPct = plan.downPaymentPercentage > 0 ? plan.downPaymentPercentage : (category?.downPaymentPercentage || 0);
                            const downPayment = totalWithInterest * dpPct / 100;
                            const financedAmount = totalWithInterest - downPayment;
                            const monthly = financedAmount / plan.months;

                            const intent = {
                              paymentMethod: 'installments',
                              planId: plan.id,
                              planMonths: plan.months,
                              interestRate: plan.interestRate || 0,
                              downPaymentPct: dpPct,
                              downPayment: Math.round(downPayment),
                              financedAmount: Math.round(financedAmount),
                              monthly: Math.round(monthly),
                              total: Math.round(totalWithInterest),
                              productPrice: basePrice, // Now base price of all quantity
                              minQuantity: plan.minQuantity || 1,
                              maxQuantity: plan.maxQuantity,
                              itemQuantity: quantity
                            };
                            localStorage.setItem('wolf_payment_intent', JSON.stringify(intent));
                            setPaymentChoice('installment');
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-bold transition-all duration-200 ${paymentChoice === 'installment'
                            ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-md'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 ${paymentChoice === 'installment' ? 'text-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-sm font-black">{language === 'ar' ? 'تقسيط' : 'Installments'}</span>
                          <span className="text-[10px] font-medium text-gray-400">
                            {selectedPlanId
                              ? (() => {
                                const plan = (installmentPlans as any[]).find((p: any) => p.id === selectedPlanId);
                                const interestAmount = product.price * (plan.interestRate || 0) / 100;
                                const monthly = Math.round((product.price + interestAmount) / plan.months);
                                return `${monthly.toLocaleString()} ${t('currency')}/${language === 'ar' ? 'شهر' : 'mo'}`;
                              })()
                              : language === 'ar' ? 'اختر خطة أولاً ↑' : 'Select plan ↑'}
                          </span>
                        </button>
                      </div>

                      {/* Hint: pick a plan first */}
                      <p id="installment-plans-hint" className="hidden text-center text-xs font-black text-orange-500 mt-2 animate-pulse">
                        ⬆ {language === 'ar' ? 'اختر خطة تقسيط أولاً' : 'Please select a plan first'}
                      </p>

                      {/* Proceed Button — shows once both selected */}
                      {paymentChoice && (
                        <button
                          onClick={() => {
                            if (paymentChoice === 'cash') {
                              localStorage.removeItem('wolf_payment_intent');
                            }

                            // Check quantity limit again
                            if (paymentChoice === 'installment') {
                              const plan = (installmentPlans as any[]).find((p: any) => p.id === selectedPlanId);
                              if (plan?.maxQuantity > 0 && quantity > plan.maxQuantity) {
                                toast.error(language === 'ar' ? 'الكمية تتجاوز الحد المسموح لهذه الخطة' : 'Quantity exceeds limit for this plan');
                                return;
                              }

                              // REFRESH INTENT right before moving to ensure it's fresh for Checkout.tsx
                              const basePrice = product.price * quantity;
                              const interestAmount = basePrice * (plan.interestRate || 0) / 100;
                              const totalWithInterest = basePrice + interestAmount;
                              const dpPct = plan.downPaymentPercentage > 0 ? plan.downPaymentPercentage : (category?.downPaymentPercentage || 0);
                              const downPayment = totalWithInterest * dpPct / 100;
                              const financedAmount = totalWithInterest - downPayment;
                              const monthly = financedAmount / plan.months;

                              const intent = {
                                paymentMethod: 'installments',
                                planId: plan.id,
                                planMonths: plan.months,
                                interestRate: plan.interestRate || 0,
                                downPaymentPct: dpPct,
                                downPayment: Math.round(downPayment),
                                financedAmount: Math.round(financedAmount),
                                monthly: Math.round(monthly),
                                total: Math.round(totalWithInterest),
                                productPrice: basePrice,
                                minQuantity: plan.minQuantity || 1,
                                maxQuantity: plan.maxQuantity,
                                itemQuantity: quantity
                              };
                              localStorage.setItem('wolf_payment_intent', JSON.stringify(intent));
                            }

                            // Add product to cart via existing mutation then navigate
                            addToCartMutation.mutate(
                              {
                                productId,
                                quantity,
                                color: selectedColor?.colorName,
                              },
                              {
                                onSuccess: () => setLocation('/checkout'),
                                onError: () => {
                                  // Already in cart or other error — navigate anyway
                                  setLocation('/checkout');
                                }
                              }
                            );
                          }}
                          className="w-full mt-4 h-12 rounded-xl font-black text-sm bg-primary text-background hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          {paymentChoice === 'cash'
                            ? (language === 'ar' ? '💵 متابعة للدفع الكاش' : '💵 Continue to Cash Checkout')
                            : (language === 'ar' ? '📋 متابعة وتحميل المستندات' : '📋 Continue & Upload Documents')}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {colors && colors.length > 0 && (
                  <div className="mb-6 md:mb-10 relative z-10" dir="rtl">
                    <p className="text-base md:text-lg font-black text-gray-900 mb-3 md:mb-5">{language === 'ar' ? "اللون:" : "Color:"} <span className="text-primary">{selectedColor?.colorName || (language === 'ar' ? "الكل" : "All")}</span></p>
                    <div className="flex flex-wrap gap-3 md:gap-4">
                      {/* Optional: Add a "Show All" or "Reset" button if desired, or just allow toggling */}
                      {colors.map((color: any) => (
                        <button
                          key={color.id}
                          onClick={() => {
                            if (selectedColor?.id === color.id) {
                              setSelectedColor(null);
                              setSelectedImage(0);
                            } else {
                              setSelectedColor(color);
                              setSelectedImage(0);
                            }
                          }}
                          className={`group relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedColor?.id === color.id ? "border-primary scale-110 shadow-lg" : "border-gray-100 hover:border-gray-300"}`}
                        >
                          <img src={color.images?.[0] || product.images?.[0]} className="w-full h-full object-cover" alt={color.colorName} />
                          {/* Color indicator dot */}
                          <div className="absolute top-1 left-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: color.colorCode }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && (
                  <div className="mb-6 md:mb-10 relative z-10" dir="rtl">
                    <p className="text-base md:text-lg font-black text-gray-900 mb-3 md:mb-5">{language === 'ar' ? "المقاس:" : "Size:"}</p>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {product.sizes.map((sizeObj: any, idx: number) => {
                        const qty = sizeQuantities[sizeObj.size] || 0;
                        const isSelected = selectedSize === sizeObj.size;
                        return (
                          <div key={idx} className="relative">
                            <button
                              onClick={() => setSelectedSize(sizeObj.size)}
                              className={`min-w-12 h-12 md:min-w-14 md:h-14 px-3 md:px-4 rounded-xl font-black text-base md:text-lg transition-all border-2 ${isSelected ? "-primary -white/5 -primary" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}
                            >
                              {sizeObj.size}
                            </button>
                            {qty > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-gray-900 text-white text-[10px] font-black w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                {qty}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {user?.role !== 'admin' && (
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 mb-0 md:mb-12" dir="rtl">
                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1 border border-gray-100 h-14 md:h-16">
                      <button
                        onClick={() => {
                          if (product.sizes?.length > 0) {
                            if (selectedSize) handleSizeQtyChange(selectedSize, -1);
                            else toast.error(language === 'ar' ? "اختر المقاس أولاً" : "Select size first");
                          } else {
                            setQuantity(q => Math.max(1, q - 1));
                          }
                        }}
                        className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                      >
                        <Minus size={18} strokeWidth={3} />
                      </button>
                      <span className="flex-1 w-10 text-center font-black text-xl text-gray-900">
                        {product.sizes?.length > 0 ? (selectedSize ? (sizeQuantities[selectedSize as string] || 0) : 0) : quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (product.sizes?.length > 0) {
                            if (selectedSize) handleSizeQtyChange(selectedSize, 1);
                            else toast.error(language === 'ar' ? "اختر المقاس أولاً" : "Select size first");
                          } else {
                            setQuantity(q => q + 1);
                          }
                        }}
                        className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        onClick={handleAddToCartMulti}
                        disabled={addToCartMutation.isPending}
                        className="flex-1 h-14 md:h-16 rounded-[2rem] md:rounded-[4rem] bg-gray-800 hover:bg-black text-white text-lg md:text-xl font-black shadow-xl shadow-gray-200 gap-3 md:gap-4 w-full md:w-auto"
                      >
                        {addToCartMutation.isPending ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ShoppingCart size={20} strokeWidth={2.5} />
                        )}
                        {t('addToCart')}
                      </Button>


                      <Button
                        onClick={handleToggleWishlist}
                        variant="outline"
                        className={cn(
                          "w-14 h-14 md:w-16 md:h-16 rounded-full border-2 transition-all flex items-center justify-center p-0 md:hidden shrink-0",
                          isFavorite ? "bg-white/5 bg-primary/20 text-primary" : "bg-white border-gray-100 text-gray-400 hover:text-primary hover:bg-white/10"
                        )}
                      >
                        <Heart size={24} className={isFavorite ? "fill-current" : ""} />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-8 space-y-4" dir="rtl">
                  {product.sku && (
                    <p className="text-sm font-bold text-gray-500">
                      <span className="text-gray-900 ml-2 uppercase">SKU:</span>
                      {product.sku}
                    </p>
                  )}
                  {category && (
                    <p className="text-sm font-bold text-gray-500">
                      <span className="text-gray-900 ml-2 uppercase">Categories:</span>
                      {language === 'ar' ? category.nameAr : category.nameEn}
                    </p>
                  )}
                  {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                      <span className="text-gray-900 ml-2 uppercase">Tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-600 hover:-white/5 hover:-primary border-0 rounded-lg px-3 py-1 transition-colors">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-4">
                    <span className="text-sm font-bold text-gray-900 uppercase">Share:</span>
                    <div className="flex gap-3">
                      {[
                        { Icon: Facebook, color: "hover:text-blue-600" },
                        { Icon: Twitter, color: "hover:text-sky-400" },
                        { Icon: Instagram, color: "hover:text-pink-600" },
                        { Icon: Linkedin, color: "hover:text-blue-700" }
                      ].map((social, i) => (
                        <button key={i} className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 transition-colors ${social.color}`}>
                          <social.Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>


        {/* Tabs System */}
        <div className="mt-16">
          <div className="flex items-center justify-center gap-12 mb-16 border-b border-gray-100 pb-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`text-2xl font-bold transition-colors relative ${activeTab === "details"
                ? "text-primary font-black after:absolute after:bottom-[-33px] after:left-0 after:w-full after:h-1.5 after:bg-primary after:rounded-full"
                : "text-gray-400 hover:text-gray-900"
                }`}
            >
              {t('details')}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`text-2xl font-bold transition-colors relative ${activeTab === "reviews"
                ? "text-primary font-black after:absolute after:bottom-[-33px] after:left-0 after:w-full after:h-1.5 after:bg-primary after:rounded-full"
                : "text-gray-400 hover:text-gray-900"
                }`}
            >
              {t('reviews')} ({reviews?.length || 0})
            </button>
          </div>

          <div className="max-w-4xl mx-auto text-right">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-50 leading-[2.2]">
                <p className="text-xl text-gray-700 whitespace-pre-wrap">
                  {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                </p>

                {product.specifications && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                    {Object.entries(product.specifications).map(([key, val]: any) => (
                      <div key={key} className="flex justify-between items-center border-b border-gray-50 py-4">
                        <span className="text-gray-900 font-bold">{val}</span>
                        <span className="text-gray-400 font-medium">{key}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{language === 'ar' ? "تقييمات العملاء" : "Customer Reviews"}</h3>

                {/* Submit Review */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4">{language === 'ar' ? "أضف تقييمك" : "Add Your Review"}</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium">{language === 'ar' ? "التقييم" : "Rating"}</label>
                        <div className="flex gap-2 justify-end">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setReviewRating(rating)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${rating <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium">{language === 'ar' ? "التعليق" : "Comment"}</label>
                        <Textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder={language === 'ar' ? "شاركنا تجربتك مع المنتج..." : "Share your experience..."}
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={() => submitReviewMutation.mutate({
                          productId,
                          rating: reviewRating,
                          comment: reviewComment || undefined,
                        })}
                        disabled={submitReviewMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        إرسال التقييم
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <Card key={review.id} className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-8 h-8 text-gray-400" />
                              <div>
                                <p className="font-semibold">{review.customerName || 'عميل'}</p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد تقييمات بعد. كن أول من يقيّم!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      <section className="container mx-auto px-4 mt-0 border-t border-gray-100 pt-0">
        <RelatedProducts
          collectionId={product.collectionId}
          currentProductId={product.id}
          language={language}
        />
      </section>
    </div>
  );
}

