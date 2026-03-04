import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, Loader2, Save, X, Image as ImageIcon, CheckCircle2, Eye, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductsTabProps {
    vendorId?: number;
    collectionId?: number | null;
    onProductClick: (id: number) => void;
    onPreview?: (id: number) => void;
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
}

export default function ProductsTab({ vendorId, collectionId, onProductClick, onPreview, showConfirm }: ProductsTabProps) {
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();

    // Modal & Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Form State
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [descriptionAr, setDescriptionAr] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [price, setPrice] = useState("");
    const [discount, setDiscount] = useState("0");
    const [collectionIdState, setCollectionId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [aiQualifiedImage, setAiQualifiedImage] = useState<File | null>(null);
    const [sizes, setSizes] = useState<{ size: string; quantity: number }[]>([{ size: "", quantity: 0 }]);
    const [cutType, setCutType] = useState("");
    const [bodyShape, setBodyShape] = useState("");
    const [impression, setImpression] = useState("");
    const [occasion, setOccasion] = useState("");
    const [silhouette, setSilhouette] = useState("");
    const [colorVariants, setColorVariants] = useState<{ id?: number; colorName: string; colorCode: string; imageFiles: File[]; existingImages?: string[] }[]>([]);
    const [sku, setSku] = useState("");
    const [tags, setTags] = useState("");

    // Queries
    const { data: products, isLoading } = useQuery({
        queryKey: ['products', vendorId, collectionId],
        queryFn: async () => await endpoints.products.list({ vendorId: vendorId || undefined, collectionId: collectionId || undefined }),
    });

    const { data: collections } = useQuery({
        queryKey: ['collections', vendorId],
        queryFn: async () => await endpoints.collections.list(vendorId || undefined),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => await endpoints.categories.list(),
    });

    // Auto-select Category when Collection changes
    useEffect(() => {
        if (collectionIdState && collections) {
            const selectedCollection = collections.find((c: any) => c.id.toString() === collectionIdState);
            if (selectedCollection?.categoryId) {
                setCategoryId(selectedCollection.categoryId.toString());
            }
        }
    }, [collectionIdState, collections]);

    const deleteProduct = useMutation({
        mutationFn: async (id: number) => await endpoints.products.delete(id),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم حذف المنتج بنجاح" : "Product deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['products', vendorId] });
        },
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!aiQualifiedImage && !editingProduct?.aiQualifiedImage) {
                toast.error(language === 'ar' ? "صورة AI مطلوبة للميزة التجريبية" : "AI-Ready image is required for Try-On feature");
                throw new Error("AI Image required");
            }

            const formData = new FormData();
            if (vendorId) formData.append("vendorId", vendorId.toString());
            formData.append("nameAr", nameAr);
            formData.append("nameEn", nameEn);
            formData.append("descriptionAr", descriptionAr);
            formData.append("descriptionEn", descriptionEn);
            formData.append("price", calculateFinalPrice());
            formData.append("originalPrice", price);
            formData.append("discount", discount.toString());
            if (collectionIdState) formData.append("collectionId", collectionIdState.toString());
            if (categoryId) formData.append("categoryId", categoryId.toString());
            formData.append("sizes", JSON.stringify(sizes));
            formData.append("cutType", cutType);
            formData.append("bodyShape", bodyShape);
            formData.append("impression", impression);
            formData.append("occasion", occasion);
            formData.append("silhouette", silhouette);
            formData.append("sku", sku);
            // Convert tags string to array before sending
            const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t !== "");
            formData.append("tags", JSON.stringify(tagsArray));

            images.forEach((image) => {
                formData.append("images", image);
            });

            if (aiQualifiedImage) {
                formData.append("aiQualifiedImage", aiQualifiedImage);
            }

            // Process and append Color Variants
            const processedVariants = colorVariants.map((v, idx) => {
                const prefix = `v${idx}_`;
                v.imageFiles.forEach((file, fileIdx) => {
                    formData.append(`${prefix}${fileIdx}`, file);
                });
                return {
                    id: v.id,
                    colorName: v.colorName,
                    colorCode: v.colorCode,
                    imageFieldPrefix: prefix,
                    existingImages: v.existingImages || []
                };
            });
            // Log FormData content for debugging
            console.log("📤 [Products Tab] Submitting Product...");
            const logFormData: any = {};
            formData.forEach((value, key) => {
                if (value instanceof File) {
                    logFormData[key] = `File: ${value.name} (${value.size} bytes)`;
                } else {
                    logFormData[key] = value;
                }
            });
            console.log("   - FormData Payload:", logFormData);

            formData.append("colorVariants", JSON.stringify(processedVariants));

            if (editingProduct) {
                return await endpoints.products.update(editingProduct.id, formData);
            }
            return (await endpoints.products.create(formData)).data;
        },
        onSuccess: () => {
            toast.success(editingProduct ?
                (language === 'ar' ? "تم تعديل المنتج بنجاح" : "Product updated successfully") :
                (language === 'ar' ? "تم إضافة المنتج بنجاح" : "Product added successfully")
            );
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: ['products', vendorId] });
        },
        onError: (err) => {
            console.error(err);
            toast.error(language === 'ar' ? "فشل حفظ المنتج" : "Failed to save product");
        }
    });

    const calculateFinalPrice = () => {
        const p = parseFloat(price);
        const d = parseFloat(discount);
        if (!isNaN(p) && !isNaN(d)) {
            return (p * (1 - d / 100)).toFixed(2);
        }
        return isNaN(p) ? "0.00" : p.toFixed(2);
    };

    const handleEdit = async (e: React.MouseEvent, product: any) => {
        e.stopPropagation();
        setEditingProduct(product);
        setNameAr(product.nameAr);
        setNameEn(product.nameEn);
        setDescriptionAr(product.descriptionAr);
        setDescriptionEn(product.descriptionEn);
        setPrice(product.originalPrice?.toString() || product.price.toString());
        setDiscount(product.discount?.toString() || "0");
        setCollectionId(product.collectionId?.toString() || "");
        setCategoryId(product.categoryId?.toString() || "");
        setSizes(product.sizes || [{ size: "", quantity: 0 }]);
        setCutType(product.cutType || "");
        setBodyShape(product.bodyShape || "");
        setImpression(product.impression || "");
        setOccasion(product.occasion || "");
        setSilhouette(product.silhouette || "");
        setSku(product.sku || "");
        setTags(Array.isArray(product.tags) ? product.tags.join(', ') : "");
        setImages([]); // Reset for new uploads

        // Fetch existing colors
        try {
            const colors = await endpoints.products.getColors(product.id);
            setColorVariants(colors.map((c: any) => ({
                id: c.id,
                colorName: c.colorName,
                colorCode: c.colorCode,
                imageFiles: [],
                existingImages: c.images || []
            })));
        } catch (error) {
            console.error("Failed to fetch colors:", error);
            setColorVariants([]);
        }

        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        showConfirm(
            language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Delete Product?',
            language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this product? This action cannot be undone.',
            () => deleteProduct.mutate(id)
        );
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setNameAr(""); setNameEn(""); setDescriptionAr(""); setDescriptionEn("");
        setPrice(""); setDiscount("0"); setImages([]); setAiQualifiedImage(null); setSizes([{ size: "", quantity: 0 }]);
        setCategoryId(""); setCollectionId("");
        setCutType(""); setBodyShape(""); setImpression(""); setOccasion(""); setSilhouette("");
        setSku(""); setTags("");
        setColorVariants([]);
    };

    const handleAddSize = () => {
        setSizes([...sizes, { size: "", quantity: 0 }]);
    };

    const handleRemoveSize = (index: number) => {
        const newSizes = [...sizes];
        newSizes.splice(index, 1);
        setSizes(newSizes);
    };

    const handleSizeChange = (index: number, field: "size" | "quantity", value: string | number) => {
        const newSizes = [...sizes];
        // @ts-ignore
        newSizes[index][field] = value;
        setSizes(newSizes);
    };

    const seedMutation = useMutation({
        mutationFn: () => endpoints.admin.seedCatalog(),
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم تفعيل الكتالوج بنجاح! يتم الآن تحديث البيانات...' : 'Catalog seeded successfully! Updating data...');
            // Invalidate all relevant queries at once
            queryClient.invalidateQueries({ queryKey: ['vendor'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-profile'] });
        },
        onError: (err: any) => {
            console.error("Seed error:", err);
            toast.error(err.response?.data?.message || (language === 'ar' ? 'فشل تفعيل الكتالوج' : 'Failed to seed catalog'));
        }
    });

    if (isLoading) return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-14 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-none rounded-[40px] overflow-hidden bg-background border border-gray-800">
                        <Skeleton className="aspect-[3/4] w-full" />
                        <CardContent className="p-6 space-y-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-7 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className={`w-full sm:w-auto ${language === 'ar' ? 'text-center sm:text-right' : 'text-center sm:text-left'}`}>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">{language === 'ar' ? "إدارة المنتجات" : "Product Management"}</h2>
                    <p className="text-gray-500 font-bold text-xs sm:text-sm md:text-base">{language === 'ar' ? "أضف، عدل وأدر منتجاتك التقنية في مكان واحد" : "Add, edit and manage your tech products in one place"}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 h-11 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-full text-sm sm:text-lg font-black shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 group">
                    <Plus className={`w-4 h-4 sm:w-6 sm:h-6 ${language === 'ar' ? 'ml-2' : 'mr-2'} group-hover:rotate-90 transition-transform`} />
                    {language === 'ar' ? "منتج جديد" : "New Product"}
                </Button>
            </div>

            {collectionId && (
                <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    <p className="text-sm font-bold text-purple-900">
                        {language === 'ar' ? `تصفية حسب المجموعة: ` : `Filtering by Collection: `}
                        <span className="font-black underline mx-1 underline-offset-4 cursor-pointer hover:text-purple-700" onClick={() => window.location.search = "?tab=products"}>
                            {collections?.find((c: any) => c.id === collectionId)?.nameAr || collectionId}
                        </span>
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => window.location.search = "?tab=products"} className={`h-8 px-4 rounded-xl text-xs font-black text-purple-600 hover:bg-purple-100 ${language === 'ar' ? 'mr-auto' : 'ml-auto'}`}>
                        <X className={`w-3 h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} /> {language === 'ar' ? "إلغاء الفلتر" : "Clear Filter"}
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products?.map((product: any) => (
                    <Card
                        key={product.id}
                        className="group border-0 shadow-none rounded-[1.5rem] md:rounded-[40px] overflow-hidden bg-background border border-gray-800 hover:scale-[1.02] transition-all duration-500 cursor-pointer"
                        onClick={() => onProductClick(product.id)}
                    >
                        <div className="aspect-[3/4] bg-gray-900 relative overflow-hidden">
                            {product.images?.[0] ? (
                                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.nameEn} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <Package className="w-16 h-16" />
                                </div>
                            )}

                            <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 z-10">
                                <Button size="icon" className="h-11 w-11 bg-gray-800/90 rounded-xl shadow-lg border border-gray-700 transition-all hover:bg-gray-700 active:scale-95" onClick={(e) => { e.stopPropagation(); onPreview?.(product.id); }}>
                                    <Eye className="w-5 h-5 text-purple-400" />
                                </Button>
                                <Button size="icon" className="h-11 w-11 bg-gray-800/90 rounded-xl shadow-lg border border-gray-700 transition-all hover:bg-gray-700 active:scale-95" onClick={(e) => handleEdit(e, product)}>
                                    <Edit className="w-5 h-5 text-blue-400" />
                                </Button>
                                <Button size="icon" className="h-11 w-11 bg-gray-800/90 rounded-xl shadow-lg border border-gray-700 transition-all hover:bg-red-900/40 active:scale-95" onClick={(e) => handleDelete(e, product.id)}>
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </Button>
                            </div>

                            {product.discount > 0 && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">
                                    -{product.discount}% OFF
                                </div>
                            )}
                        </div>
                        <CardContent className={`p-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                                {collections?.find((c: any) => c.id === product.collectionId)?.nameAr || (language === 'ar' ? 'عام' : 'General')}
                            </p>
                            <h3 className="font-black text-lg text-white line-clamp-1 mb-2">
                                {language === 'ar' ? product.nameAr : product.nameEn}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-xl text-[#e91e63]">{product.price} {t('currency')}</span>
                                {product.originalPrice > product.price && (
                                    <span className="text-gray-500 line-through text-xs font-bold">{product.originalPrice} {t('currency')}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {products?.length === 0 && (
                <div className="py-20 text-center bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-800 animate-in fade-in zoom-in duration-500">
                    <Package size={64} className="text-gray-700 mx-auto mb-6" />
                    <h3 className="text-lg sm:text-2xl font-black text-white mb-3">
                        {language === 'ar' ? "لا توجد منتجات بعد" : "No products found yet"}
                    </h3>
                    <p className="text-gray-500 font-bold mb-10 max-w-lg mx-auto leading-relaxed text-xs sm:text-base px-4">
                        {language === 'ar'
                            ? "ابدأ بإضافة منتجاتك يدوياً أو استخدم نظام التعبئة التلقائي لتحميل كتالوج كامل من الأجهزة التقنية (هواتف، لابتوبات، ساعات) مع الصور والأسعار."
                            : "Start adding your products manually or use our automated system to load a complete catalog of tech devices (phones, laptops, watches) with professional images and pricing."}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="h-14 px-10 rounded-2xl font-black border-gray-800 text-white hover:bg-gray-800">
                            {language === 'ar' ? "إضافة منتج يدوي" : "Add Product Manually"}
                        </Button>
                        <Button
                            onClick={() => seedMutation.mutate()}
                            disabled={seedMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700 h-14 px-10 rounded-2xl font-black text-white shadow-xl shadow-purple-900/20"
                        >
                            {seedMutation.isPending ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                            {language === 'ar' ? "تعبئة الكتالوج التقني تلقائياً" : "Seed Tech Catalog Automatically"}
                        </Button>
                    </div>
                </div>
            )}

            {/* CREATE/EDIT PRODUCT MODAL */}
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="w-full h-full sm:h-[92vh] sm:max-w-7xl sm:w-[95vw] p-0 overflow-hidden shadow-2xl transition-all duration-700 animate-in zoom-in-95 rounded-none sm:rounded-[2.5rem] border-gray-800 flex flex-col">
                    <div className="flex flex-col h-full bg-gray-900 border-0">
                        {/* Custom Header */}
                        <div className="bg-background px-4 py-4 md:px-8 md:py-6 flex items-center justify-between border-b border-gray-800 sticky top-0 z-[60]">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white">
                                    {editingProduct ? (language === 'ar' ? 'تعديل منتج' : 'Edit Product') : (language === 'ar' ? 'إضافة منتج جديد' : 'New Product')}
                                </h3>
                                <p className="text-xs sm:text-sm font-bold text-gray-500">{language === 'ar' ? "املأ البيانات التالية لعرض منتجك في المتجر" : "Fill in the details to list your product in the store"}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-2xl hover:bg-gray-800 h-12 w-12 transition-all">
                                <X className="w-6 h-6 text-gray-500" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                                {/* Media Section (Left/Top) */}
                                <div className="md:col-span-4 bg-background p-5 md:p-8 border-b md:border-b-0 md:border-l border-gray-800 flex flex-col gap-8 md:gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <h4 className="font-black text-white uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-2 pt-1">
                                                <ImageIcon className="w-4 h-4 text-purple-400" />
                                                {language === 'ar' ? "صور المنتج" : "Media Library"}
                                            </h4>
                                            <div className="h-7 px-3 bg-purple-900/40 text-[10px] font-black text-purple-300 rounded-full flex items-center shrink-0 border border-purple-800/50">
                                                {images.length || editingProduct?.images?.length || 0} / 6
                                            </div>
                                        </div>

                                        {/* Dropzone/Main Image Area */}
                                        <div className="aspect-[3/4] bg-gray-900 rounded-[1.5rem] md:rounded-[32px] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center overflow-hidden relative group transition-all duration-500 hover:border-purple-300">
                                            {images.length > 0 ? (
                                                <img src={URL.createObjectURL(images[0])} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                                            ) : editingProduct?.images?.[0] ? (
                                                <img src={editingProduct.images[0]} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-8 space-y-4 pointer-events-none">
                                                    <div className="w-16 h-16 bg-gray-800 rounded-3xl shadow-sm flex items-center justify-center mx-auto transition-transform group-hover:translate-y-[-4px]">
                                                        <Plus className="w-8 h-8 text-purple-400" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-white">{language === 'ar' ? "تحميل صورة الغلاف" : "Upload Cover Photo"}</p>
                                                        <p className="text-[10px] font-bold text-gray-500">{language === 'ar' ? "اسحب وأفلت أو اضغط هنا" : "Tap to browse files"}</p>
                                                        <p className="text-[9px] font-black text-purple-400 mt-2 bg-purple-900/30 px-2 py-0.5 rounded-full inline-block">
                                                            {language === 'ar' ? "الأبعاد المنصوح بها: 1200 × 1600 (3:4)" : "Recommended: 1200 x 1600 (3:4)"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500 cursor-pointer text-white flex-col gap-2">
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="font-black text-sm uppercase tracking-widest underline underline-offset-8">
                                                    {language === 'ar' ? "تغيير الصورة" : "Update Cover"}
                                                </span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        const newFiles = Array.from(e.target.files);
                                                        setImages(prev => [newFiles[0], ...prev.slice(1)]);
                                                    }
                                                }} tabIndex={0} />
                                            </label>
                                        </div>

                                        {/* Thumbnails */}
                                        <div className="grid grid-cols-4 gap-3">
                                            {images.slice(1).map((img, i) => (
                                                <div key={i} className="aspect-square bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden relative group shadow-sm">
                                                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => {
                                                            const newImages = [...images];
                                                            newImages.splice(i + 1, 1);
                                                            setImages(newImages);
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {images.length < 6 && (
                                                <label className="aspect-square bg-gray-900 rounded-2xl border border-dashed border-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-800 hover:border-purple-300 transition-all active:scale-95">
                                                    <Plus className="w-6 h-6 text-gray-700" />
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            setImages(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                                                        }
                                                    }} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Try-On Feature Section */}
                                    <div className="space-y-4 pt-4 border-t border-gray-800 px-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                                {language === 'ar' ? "صورة التجربة الافتراضية (AI)" : "AI Try-On Image"}
                                            </h4>
                                            <span className="text-[9px] font-black bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full uppercase">
                                                {language === 'ar' ? "إلزامي" : "Required"}
                                            </span>
                                        </div>

                                        <div className="aspect-[4/3] bg-gray-900 rounded-[28px] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center overflow-hidden relative group transition-all duration-500 hover:border-purple-400">
                                            {aiQualifiedImage ? (
                                                <img src={URL.createObjectURL(aiQualifiedImage)} className="w-full h-full object-cover" />
                                            ) : editingProduct?.aiQualifiedImage ? (
                                                <img src={editingProduct.aiQualifiedImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <div className="w-12 h-12 bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-2">
                                                        <Upload className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-white">{language === 'ar' ? "تحميل صورة AI" : "Upload AI Image"}</p>
                                                    <p className="text-[8px] font-bold text-gray-500 mt-1">{language === 'ar' ? "صورة واضحة للفستان على مانيكان" : "Clear dress on mannequin"}</p>
                                                </div>
                                            )}
                                            <label className="absolute inset-0 cursor-pointer">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setAiQualifiedImage(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mt-auto p-6 bg-gray-900 rounded-[32px] border border-gray-800 space-y-4">
                                        <h5 className="font-black text-[10px] text-gray-500 uppercase tracking-widest">{language === 'ar' ? "تلميح العرض" : "Photography Tip"}</h5>
                                        <p className="text-xs font-bold text-gray-300 leading-relaxed italic">{language === 'ar' ? '"المنتجات المصورة بجودة عالية وخلفية بيضاء تحقق مبيعات أعلى بنسبة 40%."' : '"Products photographed on a clean white background achieve 40% higher sales."'}</p>
                                    </div>
                                </div>

                                {/* Form Section (Right/Bottom) */}
                                <div className="md:col-span-8 p-4 md:p-12 space-y-10 md:space-y-16 pb-40 md:pb-24">
                                    {/* Global Sections */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                                        {/* Basic Info */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-8 bg-purple-600 rounded-full" />
                                                <h4 className="font-black text-white uppercase tracking-widest text-xs">{language === 'ar' ? "المعلومات الأساسية" : "Identity"}</h4>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500">{language === 'ar' ? "اسم المنتج (بالعربية)" : "ARABIC NAME"}</label>
                                                    <Input className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-gray-800 bg-gray-900 shadow-sm font-bold text-base sm:text-lg px-6 focus:ring-4 focus:ring-purple-900/20 text-white" value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" placeholder="آيفون 16 برو ماكس..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500">{language === 'ar' ? "ENGLISH NAME" : "ENGLISH NAME"}</label>
                                                    <Input className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-gray-800 bg-gray-900 shadow-sm font-bold text-base sm:text-lg px-6 focus:ring-4 focus:ring-purple-900/20 text-white" value={nameEn} onChange={e => setNameEn(e.target.value)} dir="ltr" placeholder="iPhone 16 Pro Max..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500">{language === 'ar' ? "الرمز (SKU)" : "SKU"}</label>
                                                    <Input className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-gray-800 bg-gray-900 shadow-sm font-bold text-base sm:text-lg px-6 focus:ring-4 focus:ring-purple-900/20 text-white" value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-1234..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500">{language === 'ar' ? "الوسوم (مفصولة بفاصلة)" : "Tags (comma separated)"}</label>
                                                    <Input className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-gray-800 bg-gray-900 shadow-sm font-bold text-base sm:text-lg px-6 focus:ring-4 focus:ring-purple-900/20 text-white" value={tags} onChange={e => setTags(e.target.value)} placeholder="فستان, زفاف, دانتيل..." />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-8 bg-[#e91e63] rounded-full" />
                                                <h4 className="font-black text-white uppercase tracking-widest text-xs">{language === 'ar' ? "التسعير والخصم" : "Pricing System"}</h4>
                                            </div>

                                            <div className="bg-gray-900 p-6 rounded-[32px] border border-gray-800 grid grid-cols-2 gap-6 relative overflow-hidden">
                                                <div className="space-y-2 relative z-10">
                                                    <label className="text-[10px] font-black text-gray-500">{language === 'ar' ? "السعر الأصلي" : "BASE PRICE"}</label>
                                                    <div className="relative">
                                                        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-14 rounded-2xl border-gray-800 bg-gray-800 shadow-sm font-black text-xl px-6 pr-14 focus:ring-4 focus:ring-pink-900/20 text-white text-base" />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-700 pointer-events-none">{t('currency')}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 relative z-10">
                                                    <label className="text-[10px] font-black text-gray-500">{language === 'ar' ? "الخصم %" : "DISCOUNT %"}</label>
                                                    <div className="relative">
                                                        <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="h-14 rounded-2xl border-gray-800 bg-gray-800 shadow-sm font-black text-xl px-6 pr-14 focus:ring-4 focus:ring-pink-900/20 text-white text-base" />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-700 pointer-events-none">%</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 mt-4 pt-6 border-t border-gray-800/50 flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm font-black text-gray-500">{language === 'ar' ? "السعر النهائي للمشتري:" : "Final Listing Price:"}</span>
                                                    <span className="text-xl sm:text-3xl font-black text-[#e91e63]">{calculateFinalPrice()} <span className="text-xs">{t('currency')}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categorization Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-8 bg-blue-600 rounded-full" />
                                            <h4 className="font-black text-white uppercase tracking-widest text-xs">{language === 'ar' ? "التصنيف والذكاء" : "Product Intelligence"}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500">{language === 'ar' ? "القسم (Section)" : "SECTION"}</label>
                                                <Select value={categoryId} onValueChange={(val) => {
                                                    setCategoryId(val);
                                                    setCollectionId(""); // Reset collection when section changes
                                                }}>
                                                    <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-gray-800 shadow-sm font-bold bg-gray-900 text-white focus:ring-4 focus:ring-blue-900/20 text-base">
                                                        <SelectValue placeholder={language === 'ar' ? "اختر القسم" : "Select Section"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl shadow-xl border-gray-800 bg-gray-900">
                                                        {categories?.map((c: any) => (
                                                            <SelectItem key={c.id} value={c.id.toString()} className="font-bold py-3 text-white focus:bg-gray-800">
                                                                {language === 'ar' ? c.nameAr : c.nameEn}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500">{language === 'ar' ? "المجموعة (Collection)" : "COLLECTION"}</label>
                                                <Select
                                                    value={collectionIdState}
                                                    onValueChange={setCollectionId}
                                                    disabled={!categoryId}
                                                >
                                                    <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-gray-800 shadow-sm font-bold bg-gray-900 text-white focus:ring-4 focus:ring-blue-900/20 text-base">
                                                        <SelectValue placeholder={language === 'ar' ? "اختر مجموعة" : "Select Collection"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl shadow-xl border-gray-800 bg-gray-900">
                                                        {collections
                                                            ?.filter((c: any) => !categoryId || c.categoryId?.toString() === categoryId)
                                                            ?.map((c: any) => (
                                                                <SelectItem key={c.id} value={c.id.toString()} className="font-bold py-3 text-white focus:bg-gray-800">
                                                                    {language === 'ar' ? c.nameAr : c.nameEn}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Color Variants Section */}
                                    <div className="space-y-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 p-4 sm:p-12 rounded-[1.5rem] md:rounded-[40px] border border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
                                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">{language === 'ar' ? "الألوان المتوفرة (اختيارية)" : "Color Variants (Optional)"}</h4>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setColorVariants([...colorVariants, { colorName: "", colorCode: "#000000", imageFiles: [], existingImages: [] }])}
                                                className="rounded-xl bg-white border-blue-200 text-blue-700 hover:bg-blue-50 h-10 px-4"
                                            >
                                                <Plus className="w-4 h-4 ml-2" /> {language === 'ar' ? "إضافة لون" : "Add Color"}
                                            </Button>
                                        </div>
                                        {colorVariants.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {colorVariants.map((variant, idx) => (
                                                    <div key={idx} className="bg-white p-6 rounded-3xl border border-blue-100 space-y-4 relative group/color">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-2 left-2 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/color:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                const newVariants = [...colorVariants];
                                                                newVariants.splice(idx, 1);
                                                                setColorVariants(newVariants);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400">{language === 'ar' ? "اسم اللون" : "COLOR NAME"}</label>
                                                                <Input
                                                                    className="h-10 rounded-xl border-slate-200 font-bold"
                                                                    value={variant.colorName}
                                                                    onChange={e => {
                                                                        const newVariants = [...colorVariants];
                                                                        newVariants[idx].colorName = e.target.value;
                                                                        setColorVariants(newVariants);
                                                                    }}
                                                                    placeholder={language === 'ar' ? "أحمر، أزرق..." : "Red, Blue..."}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400">{language === 'ar' ? "كود اللون" : "COLOR CODE"}</label>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        type="color"
                                                                        className="h-11 w-14 rounded-xl border-slate-200 cursor-pointer p-1 min-h-[44px]"
                                                                        value={variant.colorCode}
                                                                        onChange={e => {
                                                                            const newVariants = [...colorVariants];
                                                                            newVariants[idx].colorCode = e.target.value;
                                                                            setColorVariants(newVariants);
                                                                        }}
                                                                    />
                                                                    <Input
                                                                        className="h-11 flex-1 rounded-xl border-slate-200 font-mono text-base"
                                                                        value={variant.colorCode}
                                                                        onChange={e => {
                                                                            const newVariants = [...colorVariants];
                                                                            newVariants[idx].colorCode = e.target.value;
                                                                            setColorVariants(newVariants);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "صور هذا اللون" : "COLOR IMAGES"}</label>
                                                                <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                    {language === 'ar' ? "1200 × 1600 (3:4)" : "1200 x 1600 (3:4)"}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                                {/* Existing Images */}
                                                                {variant.existingImages?.map((url, imgIdx) => (
                                                                    <div key={`existing-${imgIdx}`} className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden group/img border border-slate-100">
                                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newVariants = [...colorVariants];
                                                                                newVariants[idx].existingImages?.splice(imgIdx, 1);
                                                                                setColorVariants(newVariants);
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {/* New Image Files */}
                                                                {variant.imageFiles.map((file, imgIdx) => (
                                                                    <div key={`new-${imgIdx}`} className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden group/img border border-blue-100">
                                                                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newVariants = [...colorVariants];
                                                                                newVariants[idx].imageFiles.splice(imgIdx, 1);
                                                                                setColorVariants(newVariants);
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {/* Upload Placeholder */}
                                                                <label className="aspect-square bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group/upload">
                                                                    <Plus className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                                                                    <span className="text-[10px] font-black text-blue-500 mt-1 uppercase">{language === 'ar' ? "إضافة" : "ADD"}</span>
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={e => {
                                                                            if (e.target.files) {
                                                                                const newFiles = Array.from(e.target.files);
                                                                                const newVariants = [...colorVariants];
                                                                                newVariants[idx].imageFiles = [...newVariants[idx].imageFiles, ...newFiles];
                                                                                setColorVariants(newVariants);
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {colorVariants.length === 0 && (
                                            <div className="text-center py-12">
                                                <p className="text-sm font-bold text-slate-400">{language === 'ar' ? "لم تقم بإضافة أي ألوان بعد. اضغط \"إضافة لون\" للبدء." : "No colors added yet. Click \"Add Color\" to start."}</p>
                                            </div>
                                        )}
                                    </div>


                                    {/* Final Description Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-8 bg-emerald-600 rounded-full" />
                                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">{language === 'ar' ? "التفاصيل والوصف" : "Copywriting"}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-2 text-start">
                                                <label className="text-[10px] font-black text-gray-500 tracking-widest">{language === 'ar' ? "وصف المنتج (بالعربية)" : "ARABIC DESCRIPTION"}</label>
                                                <Textarea className="min-h-[160px] rounded-2xl sm:rounded-[32px] border-gray-800 bg-gray-900 text-white shadow-sm p-4 sm:p-6 font-bold leading-relaxed focus:ring-4 focus:ring-emerald-900/10 text-base" value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} dir="rtl" placeholder="صف مواصفات الجهاز ومميزاته وما يجعله فريداً..." />
                                            </div>
                                            <div className="space-y-2 text-start">
                                                <label className="text-[10px] font-black text-gray-500 tracking-widest">{language === 'ar' ? "ENGLISH DESCRIPTION" : "ENGLISH DESCRIPTION"}</label>
                                                <Textarea className="min-h-[160px] rounded-2xl sm:rounded-[32px] border-gray-800 bg-gray-900 text-white shadow-sm p-4 sm:p-6 font-bold leading-relaxed focus:ring-4 focus:ring-emerald-900/10 text-base" value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} dir="ltr" placeholder="Describe the fabrics, the fit, and the feeling..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="bg-white px-4 py-5 md:px-12 md:py-8 flex flex-col-reverse sm:flex-row items-center justify-between border-t border-slate-100 gap-4 sticky bottom-0 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                            <Button variant="ghost" onClick={handleCloseModal} className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-full font-black text-slate-400 hover:bg-slate-50">
                                {language === 'ar' ? "تجاهل" : "Discard"}
                            </Button>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <div className="text-center sm:text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "حالة المنتج" : "Visibility"}</p>
                                    <p className="text-sm font-black text-emerald-500">{language === 'ar' ? "متاح للعرض فوراً" : "Ready for Listing"}</p>
                                </div>
                                <Button
                                    onClick={() => {
                                        if (!nameAr) return toast.error("يرجى إدخال الاسم بالعربية");
                                        if (!price || parseFloat(price) <= 0) return toast.error("يرجى إدخال سعر صحيح");
                                        if (!collectionIdState) return toast.error(language === 'ar' ? "يرجى اختيار مجموعة" : "Please select a collection");
                                        submitMutation.mutate();
                                    }}
                                    disabled={submitMutation.isPending}
                                    className="bg-slate-900 hover:bg-black w-full sm:w-auto h-14 md:h-16 px-8 md:px-16 rounded-[20px] md:rounded-[28px] text-base md:text-lg font-black text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {submitMutation.isPending ? (
                                        <div className="flex items-center gap-3 justify-center">
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span>{language === 'ar' ? "جاري الحفظ..." : "Processing..."}</span>
                                        </div>
                                    ) : (
                                        editingProduct ? (language === 'ar' ? "حفظ التعديلات" : "Save Changes") : (language === 'ar' ? "نشر المنتج" : "Publish Product")
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
