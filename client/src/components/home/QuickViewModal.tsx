import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, X, Check, Heart, Minimize2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAddToCart } from "@/hooks/useAddToCart";
import { toast } from "sonner";

interface QuickViewModalProps {
    initialProduct: any;
    isOpen: boolean;
    onClose: () => void;
}

export function QuickViewModal({ initialProduct, isOpen, onClose }: QuickViewModalProps) {
    const { language, t } = useLanguage();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const addToCartMutation = useAddToCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    // Fetch full product details when modal is open
    const { data: fullProduct, isLoading } = useQuery({
        queryKey: ['product', initialProduct?.id],
        queryFn: () => endpoints.products.get(initialProduct.id),
        enabled: isOpen && !!initialProduct?.id,
    });

    const product = fullProduct || initialProduct;

    // Reset state when product changes
    if (!product) return null;

    const name = language === 'ar' ? product.nameAr : product.nameEn;
    const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
    const price = language === 'ar'
        ? Number(product.price).toLocaleString('ar-SA')
        : Number(product.price).toLocaleString();

    // Parse options
    const sizes = Array.isArray(product.sizes) ? product.sizes : JSON.parse(product.sizes || '[]');
    // Handle colors from relation (array of objects) or legacy/prop (if any)
    // The backend getter returns 'colors' property which is array of ProductColor
    const colors = product.colors || [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-[2rem] border-none shadow-2xl h-[90vh] md:h-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    {/* Image Section */}
                    <div className="relative bg-gray-50 h-[40vh] md:h-[600px] overflow-hidden group">
                        <img
                            src={product.images?.[selectedImage] || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"}
                            alt={name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Thumbnails Overlay */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/50 backdrop-blur-md rounded-full">
                            {product.images?.map((img: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${selectedImage === i ? '-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>

                        {product.discount > 0 && (
                            <Badge className="absolute top-4 left-4 -primary text-white border-none px-3 py-1 text-sm font-bold">
                                -{product.discount}%
                            </Badge>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-4">
                            <DialogHeader className="text-start">
                                <DialogTitle className="text-2xl md:text-3xl font-black text-gray-900 mb-2 leading-tight">
                                    {name}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex text-yellow-400">
                                        {Array(5).fill(0).map((_, i) => (
                                            <Star key={i} size={16} className={i < (product.rating || 5) ? "fill-current" : "text-gray-200"} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-400 font-bold">({product.reviewsCount || 12} {language === 'ar' ? 'تقييم' : 'reviews'})</span>
                                </div>
                            </DialogHeader>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="text-3xl font-black -primary mb-6 flex items-center gap-3">
                            {price} {t('currency')}
                            {product.originalPrice && (
                                <span className="text-lg text-gray-300 line-through font-bold">
                                    {Number(product.originalPrice).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <p className="text-gray-500 mb-8 leading-relaxed line-clamp-3">
                            {description}
                        </p>



                        {/* Colors */}
                        {colors.length > 0 && (
                            <div className="mb-8">
                                <span className="text-sm font-bold text-gray-900 mb-3 block">{t('color')}</span>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((color: any) => (
                                        <button
                                            key={color.id || color.colorCode || color}
                                            onClick={() => setSelectedColor(color.colorCode || color)} // Use Code or Value
                                            className={`w-10 h-10 rounded-full border-2 transition-all relative ${selectedColor === (color.colorCode || color)
                                                ? 'border-gray-900 scale-110'
                                                : 'border-transparent hover:scale-110'
                                                }`}
                                            title={color.colorName || color}
                                            style={{ backgroundColor: color.colorCode || color }}
                                        >
                                            {selectedColor === (color.colorCode || color) && (
                                                <Check size={16} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${['white', '#fff', '#ffffff'].includes((color.colorCode || color).toLowerCase()) ? 'text-black' : 'text-white'}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user?.role !== 'admin' && user?.role !== 'vendor' && (
                            <div className="mt-auto flex gap-4 pt-6 border-t border-gray-100">
                                <Button
                                    size="lg"
                                    className="flex-1 rounded-full h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800"
                                    onClick={() => {
                                        addToCartMutation.mutate({
                                            productId: product.id,
                                            quantity: 1,
                                            color: selectedColor || undefined,
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
                                        if (addToCartMutation.isSuccess) onClose();
                                    }}
                                    disabled={addToCartMutation.isPending}
                                >
                                    {addToCartMutation.isPending ? (
                                        language === 'ar' ? 'جاري الإضافة...' : 'Adding...'
                                    ) : (
                                        <>
                                            {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                                            <ShoppingCart className="ml-2" size={20} />
                                        </>
                                    )}
                                </Button>

                                <Link href={`/products/${product.id}`}>
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                                        <Minimize2 size={24} />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
