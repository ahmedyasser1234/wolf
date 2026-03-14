import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

interface CollectionProductsViewProps {
    vendorId: number;
    collectionId: number;
    onBack: () => void;
    onProductClick: (id: number) => void;
    onPreview?: (id: number) => void;
}

export default function CollectionProductsView({ vendorId, collectionId, onBack, onProductClick, onPreview }: CollectionProductsViewProps) {
    const { t, language } = useLanguage();

    const { data: collection } = useQuery({
        queryKey: ['collection', collectionId],
        queryFn: async () => await endpoints.collections.get(collectionId),
    });

    const { data: products, isLoading } = useQuery({
        queryKey: ['vendor', 'products', vendorId, 'collection', collectionId],
        queryFn: async () => await endpoints.products.list({ vendorId, collectionId }),
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500" dir="rtl">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 hover:bg-slate-50 hover:scale-105 transition-all"
                >
                    <ArrowRight className="w-6 h-6 text-slate-600" />
                </Button>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">
                        {collection ? (language === 'ar' ? collection.nameAr : collection.nameEn) : "..."}
                    </h2>
                    <p className="text-slate-400 font-bold">{language === 'ar' ? "استعرض المنتجات المنتمية لهذه المجموعة" : "Browse products belonging to this collection"}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                    <p className="text-slate-400 font-black">{language === 'ar' ? "تحميل منتجات المجموعة..." : "Loading products..."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {(products as any)?.data?.length === 0 ? (
                        <div className="col-span-full py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">{language === 'ar' ? "المجموعة فارغة" : "Collection is empty"}</h3>
                            <p className="text-slate-400 font-bold max-w-xs mx-auto">
                                {language === 'ar' ? "لا توجد منتجات مرتبطة بهذه المجموعة حالياً" : "No products are currently linked to this collection"}
                            </p>
                        </div>
                    ) : (
                        (products as any)?.data?.map((product: any) => (
                            <Card
                                key={product.id}
                                className="group border-0 shadow-xl shadow-slate-100/50 rounded-[40px] overflow-hidden bg-white hover:scale-[1.02] transition-all duration-500 cursor-pointer"
                                onClick={() => onProductClick(product.id)}
                            >
                                <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden group">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.nameEn} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <Package className="w-16 h-16" />
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 z-10">
                                        <Button size="icon" className="h-10 w-10 bg-white/90 rounded-xl shadow-lg border border-slate-100 transition-all hover:bg-white active:scale-95" onClick={(e) => { e.stopPropagation(); onPreview?.(product.id); }}>
                                            <Eye className="w-4 h-4 text-purple-600" />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-6 text-right">
                                    <h3 className="font-black text-lg text-slate-900 line-clamp-1 mb-2">{language === 'ar' ? product.nameAr : product.nameEn}</h3>
                                    <span className="font-black text-xl text-[#e91e63]">{product.price} {t('currency')}</span>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
