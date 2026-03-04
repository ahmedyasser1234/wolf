import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Package, Tag, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProductPreviewViewProps {
    productId: number;
    onBack: () => void;
}

export default function ProductPreviewView({ productId, onBack }: ProductPreviewViewProps) {
    const { t, language } = useLanguage();
    const [activeImage, setActiveImage] = useState<string | null>(null);

    const { data: productData, isLoading } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => await endpoints.products.get(productId),
        enabled: !!productId,
    });

    const product = productData?.product;
    const colors = productData?.colors;
    const collection = productData?.collection;
    const category = productData?.category;

    useEffect(() => {
        if (product?.images?.[0]) {
            setActiveImage(product.images[0]);
        }
    }, [product]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            <p className="text-slate-400 font-black">{language === 'ar' ? "تحميل معاينة المنتج..." : "Loading preview..."}</p>
        </div>
    );

    if (!product) return (
        <div className="text-center p-20 bg-white rounded-[40px] shadow-xl">
            <Package className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-800">{language === 'ar' ? "المنتج غير موجود" : "Product Not Found"}</h3>
            <Button onClick={onBack} variant="link" className="text-purple-600 font-black mt-4 underline underline-offset-8">
                {language === 'ar' ? "العودة للقائمة" : "Back to List"}
            </Button>
        </div>
    );

    const galleryImages = product.images?.slice(1) || [];
    const currentImage = activeImage || galleryImages[0] || product.images?.[0];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500" dir="rtl">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all"
                >
                    <ArrowRight className="w-6 h-6 text-slate-600" />
                </Button>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">
                        {language === 'ar' ? product.nameAr : product.nameEn}
                    </h2>
                    <p className="text-slate-400 font-bold">{language === 'ar' ? "معاينة حية للمنتج كما يظهر للمشترين" : "Live preview of how customers see your dress"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Visuals */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <Card className="border-0 shadow-2xl shadow-slate-100/50 rounded-[40px] overflow-hidden bg-white">
                        <div className="aspect-[3/4] bg-slate-50 relative">
                            {currentImage ? (
                                <img src={currentImage} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-20 h-20 text-slate-100" />
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-none">
                        {galleryImages.map((img: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(img)}
                                className={cn(
                                    "w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-4 transition-all duration-300",
                                    (activeImage === img || (!activeImage && i === 0)) ? 'border-purple-600 scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                                )}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`thumb-${i}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-[40px] p-10 bg-white">
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Tag className="w-4 h-4 text-[#e91e63]" />
                                    {language === 'ar' ? "تفاصيل القطعة" : "Dressing Details"}
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">{language === 'ar' ? "السعر النهائي" : "PRICE"}</p>
                                        <p className="text-3xl font-black text-[#e91e63]">{product.price} <span className="text-sm">{t('currency')}</span></p>
                                        {product.originalPrice > product.price && (
                                            <p className="text-sm text-slate-400 line-through font-bold">{product.originalPrice} {t('currency')}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">{language === 'ar' ? "الخصم" : "SAVING"}</p>
                                        <p className="text-2xl font-black text-emerald-500">%{product.discount || 0}</p>
                                    </div>
                                    <div className="col-span-full sm:col-span-1">
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">{language === 'ar' ? "التصنيف" : "CATEGORY"}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Layers className="w-4 h-4 text-purple-600" />
                                            <span className="font-black text-slate-800">{language === 'ar' ? collection?.nameAr || category?.nameAr : collection?.nameEn || category?.nameEn}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-10 border-t border-slate-50">
                                <h4 className="font-black text-slate-900">{language === 'ar' ? "وصف الفستان" : "The Story"}</h4>
                                <p className="text-slate-500 font-bold leading-relaxed text-lg" style={{ whiteSpace: 'pre-wrap' }}>
                                    {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-10">
                                {[
                                    { label: language === 'ar' ? "نوع القصة" : "Cut", value: product.cutType },
                                    { label: language === 'ar' ? "شكل الجسم" : "Body", value: product.bodyShape },
                                    { label: language === 'ar' ? "الخامة" : "Fabric", value: product.impression },
                                    { label: language === 'ar' ? "المناسبة" : "Event", value: product.occasion }
                                ].map((attr, i) => attr.value && (
                                    <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{attr.label}</p>
                                        <p className="font-black text-slate-800 text-lg">{attr.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Stock Overview */}
                    <Card className="border-0 shadow-xl shadow-slate-100/50 rounded-[40px] p-8 bg-slate-900 text-white relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                            <h4 className="text-xl font-black">{language === 'ar' ? "المخزون المتوفر" : "Stock Levels"}</h4>
                            <span className="px-4 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest">Live Inventory</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-white/40 mb-1">{language === 'ar' ? "الكمية" : "QTY"}</p>
                            <p className="text-2xl font-black">{product.stock || 0}</p>
                            <p className="text-[10px] font-bold text-white/30 uppercase">{language === 'ar' ? "متاحة" : "AVAIL"}</p>
                        </div>
                        <Package className="absolute -left-12 -bottom-12 w-48 h-48 text-white/5 rotate-12" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
