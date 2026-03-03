import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Calendar, Tag, Users, Search, Zap, Package, Clock, ShieldCheck, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { format, isAfter, isBefore } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OffersTabProps {
    vendorId: number;
}

export default function OffersTab({ vendorId }: OffersTabProps) {
    const { language, t } = useLanguage();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [minQuantity, setMinQuantity] = useState("1");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [isFlashSale, setIsFlashSale] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    // Fetch Offers
    const { data: offers, isLoading: offersLoading } = useQuery({
        queryKey: ['vendor', 'offers', vendorId],
        queryFn: () => endpoints.offers.list(),
    });

    // Fetch Products for Selection
    const { data: products } = useQuery({
        queryKey: ['vendor', 'products', vendorId],
        queryFn: async () => await endpoints.products.list({ vendorId }),
    });

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter((p: any) =>
            (p.nameAr + p.nameEn).toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [products, productSearch]);

    const createOffer = useMutation({
        mutationFn: async (data: any) => await endpoints.offers.create(data),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم إنشاء العرض بنجاح" : "Offer created successfully");
            handleClose();
            queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', vendorId] });
        },
        onError: () => {
            toast.error(language === 'ar' ? "فشل إنشاء العرض" : "Failed to create offer");
        }
    });

    const updateOffer = useMutation({
        mutationFn: async (data: any) => await endpoints.offers.update(editingOffer.id, data),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم تحديث العرض بنجاح" : "Offer updated successfully");
            handleClose();
            queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', vendorId] });
        },
        onError: () => {
            toast.error(language === 'ar' ? "فشل تحديث العرض" : "Failed to update offer");
        }
    });

    const deleteOffer = useMutation({
        mutationFn: async (id: number) => await endpoints.offers.delete(id),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم حذف العرض" : "Offer deleted");
            queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', vendorId] });
        },
    });

    const resetForm = () => {
        setNameAr("");
        setNameEn("");
        setDiscountPercent("");
        setUsageLimit("");
        setMinQuantity("1");
        setStartDate("");
        setEndDate("");
        setSelectedProducts([]);
        setIsFlashSale(false);
        setProductSearch("");
        setEditingOffer(null);
    };

    const handleClose = () => {
        setIsCreateOpen(false);
        resetForm();
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (offer: any) => {
        setEditingOffer(offer);
        setNameAr(offer.nameAr);
        setNameEn(offer.nameEn);
        setDiscountPercent(offer.discountPercent.toString());
        setUsageLimit(offer.usageLimit ? offer.usageLimit.toString() : "");
        setMinQuantity(offer.minQuantity ? offer.minQuantity.toString() : "1");
        setStartDate(format(new Date(offer.startDate), "yyyy-MM-dd"));
        setEndDate(format(new Date(offer.endDate), "yyyy-MM-dd"));
        setSelectedProducts(offer.productIds || []);
        setIsFlashSale(offer.type === 'flash_sale');
        setIsCreateOpen(true);
    };

    const handleSubmit = () => {
        if (!nameAr || !nameEn || !discountPercent || !startDate || !endDate) {
            toast.error(language === 'ar' ? "يرجى ملء جميع الحقول" : "Please fill all fields");
            return;
        }

        const data = {
            vendorId, // Ensure vendorId is passed
            nameAr,
            nameEn,
            discountPercent: parseInt(discountPercent),
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            minQuantity: parseInt(minQuantity) || 1,
            startDate,
            endDate,
            productIds: selectedProducts,
            type: isFlashSale ? 'flash_sale' : 'discount'
        };

        if (editingOffer) {
            updateOffer.mutate(data);
        } else {
            createOffer.mutate(data);
        }
    };

    const toggleProduct = (productId: number) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    if (offersLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 text-pink-600 animate-spin" />
                <p className="text-gray-500 font-bold animate-pulse">جاري جلب العروض...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h2 className="text-3xl font-black text-white">{t('offersTitle')}</h2>
                    <p className="text-gray-400 text-sm">{t('offersDesc')}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenCreate} className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 h-12 px-8 rounded-2xl font-black text-lg gap-2 shadow-none transition-all active:scale-95">
                            <Plus className="w-6 h-6" />
                            {t('addOffer')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95%] bg-background/95 backdrop-blur-xl border border-gray-800 shadow-2xl rounded-[24px] md:rounded-3xl overflow-hidden p-0">
                        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 md:p-8 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <DialogHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white">
                                    {editingOffer ? t('editOffer') : t('createOfferTitle')}
                                </DialogTitle>
                                <p className="text-white/80 text-xs md:text-sm">{language === 'ar' ? "حدد تفاصيل العرض والمنتجات المشمولة لتجذب أكبر عدد من العملاء" : "Set offer details and included products to attract more customers"}</p>
                            </DialogHeader>
                        </div>

                        <div className="p-4 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            {/* Offer Type Selector */}
                            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl", isFlashSale ? "bg-amber-900/30" : "bg-blue-900/30")}>
                                        <Zap className={cn("w-6 h-6", isFlashSale ? "text-amber-400" : "text-blue-400")} />
                                    </div>
                                    <div>
                                        <p className="font-black text-white">{t('flashSale')}</p>
                                        <p className="text-xs text-gray-400">{t('flashSaleDesc')}</p>
                                    </div>
                                </div>
                                <Switch checked={isFlashSale} onCheckedChange={setIsFlashSale} className="data-[state=checked]:bg-amber-500" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('offerNameAr')}</Label>
                                    <Input placeholder="مثال: خصم الجمعة البيضاء" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('offerNameEn')}</Label>
                                    <Input placeholder="Example: Black Friday Sale" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('discountPercent')}</Label>
                                    <div className="relative">
                                        <Input type="number" min="1" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white pl-10 font-black text-lg" />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('maxUsage')}</Label>
                                    <Input type="number" min="1" placeholder={language === 'ar' ? "اختياري" : "Optional"} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('minQty')}</Label>
                                    <Input type="number" min="1" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('startDate')}</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-white">{t('endDate')}</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-12 rounded-xl border-gray-800 bg-gray-900 text-white font-bold" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="font-black text-white">{t('productsIncluded')}</Label>
                                    <Badge variant="secondary" className="bg-pink-900/30 text-pink-400 font-bold">
                                        {selectedProducts.length} {language === 'ar' ? "مختار" : "Selected"}
                                    </Badge>
                                </div>
                                <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-4">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input
                                            placeholder={t('searchProduct')}
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="h-10 pr-10 bg-background border-gray-800 text-white text-sm rounded-xl"
                                        />
                                    </div>
                                    <ScrollArea className="h-40">
                                        <div className="grid gap-2 pr-2">
                                            {filteredProducts.map((product: any) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => toggleProduct(product.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                                                        selectedProducts.includes(product.id)
                                                            ? "bg-gray-800 border-pink-900/50 ring-2 ring-pink-500/5 shadow-sm"
                                                            : "bg-transparent border-transparent hover:bg-gray-800 hover:border-gray-700"
                                                    )}
                                                >
                                                    <Checkbox
                                                        id={`prod-${product.id}`}
                                                        checked={selectedProducts.includes(product.id)}
                                                        onCheckedChange={() => toggleProduct(product.id)}
                                                        className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                                                    />
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {product.images?.[0] && <img src={product.images[0]} className="w-8 h-8 rounded-lg object-cover" />}
                                                        <span className="text-xs font-bold text-gray-300 truncate">
                                                            {language === 'ar' ? product.nameAr : product.nameEn}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-900/50 border-t border-gray-800 flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={createOffer.isPending || updateOffer.isPending || (selectedProducts.length === 0)}
                                className="bg-white hover:bg-gray-100 text-black h-12 px-12 rounded-2xl font-black text-lg shadow-none"
                            >
                                {createOffer.isPending || updateOffer.isPending ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('saving')}</>
                                ) : (
                                    editingOffer ? (language === 'ar' ? "تحديث العرض" : "Update Offer") : (language === 'ar' ? "تثبيت العرض الآن" : "Launch Offer Now")
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {offers?.map((offer: any) => {
                    const isUpcoming = isAfter(new Date(offer.startDate), new Date());
                    const isExpired = isBefore(new Date(offer.endDate), new Date());
                    const isActive = !isUpcoming && !isExpired;
                    const typeFlash = offer.type === 'flash_sale';

                    return (
                        <Card key={offer.id} className={cn(
                            "relative border border-gray-800 shadow-none rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 group",
                            typeFlash ? "bg-gradient-to-br from-amber-900/20 to-background" : "bg-background"
                        )}>
                            <div className={cn(
                                "h-2 w-full",
                                typeFlash ? "bg-amber-500" : (isActive ? "bg-emerald-500" : "bg-gray-700")
                            )} />

                            <CardHeader className="relative pb-2">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={cn("p-2.5 rounded-2xl", typeFlash ? "bg-amber-900/30 text-amber-400" : "bg-blue-900/30 text-blue-400")}>
                                        {typeFlash ? <Zap className="w-6 h-6" /> : <Tag className="w-6 h-6" />}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={cn(
                                            "font-black text-lg px-4 py-1.5 shadow-md",
                                            typeFlash ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
                                        )}>
                                            %{offer.discountPercent} OFF
                                        </Badge>
                                        {isActive && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {t('activeNow')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-black text-white leading-tight">
                                    {language === 'ar' ? offer.nameAr : offer.nameEn}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1.5 pt-2 text-gray-500 font-bold">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(offer.startDate), 'dd MMM', { locale: ar })} - {format(new Date(offer.endDate), 'dd MMM', { locale: ar })}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800">
                                        <p className="text-[10px] font-black text-gray-500 mb-1">{t('usage')}</p>
                                        <p className="text-sm font-black text-white flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {offer.usedCount || 0} / {offer.usageLimit || '∞'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800">
                                        <p className="text-[10px] font-black text-gray-500 mb-1">{t('minQty')}</p>
                                        <p className="text-sm font-black text-white flex items-center gap-1.5">
                                            <Package className="w-3.5 h-3.5" />
                                            {offer.minQuantity} {language === 'ar' ? "قطعة" : "items"}
                                        </p>
                                    </div>
                                </div>

                                {offer.usageLimit && (
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-500", typeFlash ? "bg-amber-500" : "bg-blue-500")}
                                            style={{ width: `${Math.min(((offer.usedCount || 0) / offer.usageLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="bg-gray-900/50 pt-4 flex items-center justify-between group-hover:bg-gray-900 transition-colors">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={cn("w-4 h-4", isActive ? "text-emerald-500" : "text-gray-700")} />
                                    <span className="text-[10px] font-bold text-gray-400">{t('verifiedOffer')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-xl transition-all"
                                        onClick={() => handleOpenEdit(offer)}
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-xl transition-all"
                                        onClick={() => {
                                            if (confirm(t('deleteOfferConfirm'))) {
                                                deleteOffer.mutate(offer.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
                {offers?.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-gray-900 border-2 border-dashed border-gray-800 rounded-[40px] text-center px-6">
                        <div className="w-24 h-24 bg-background border border-gray-800 rounded-3xl shadow-none flex items-center justify-center mb-6">
                            <Tag className="w-10 h-10 text-gray-700" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">{t('noOffers')}</h3>
                        <p className="text-gray-500 max-w-sm mb-8">{t('offersDesc')}</p>
                        <Button onClick={handleOpenCreate} className="bg-pink-600 hover:bg-pink-700 text-white h-12 px-8 rounded-2xl font-bold">{t('startOffer')}</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
