import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Check, Ticket, Calendar, Users, AlertCircle, Edit, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function CouponsTab({ vendorId }: { vendorId: number }) {
    const { language, t } = useLanguage();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [code, setCode] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['vendor', 'coupons', vendorId],
        queryFn: () => endpoints.coupons.list(),
    });

    const createCoupon = useMutation({
        mutationFn: async (data: any) => await endpoints.coupons.create(data),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم إنشاء الكوبون بنجاح" : "Coupon created successfully");
            handleClose();
            queryClient.invalidateQueries({ queryKey: ['vendor', 'coupons', vendorId] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || (language === 'ar' ? "فشل إنشاء الكوبون" : "Failed to create coupon"));
        }
    });

    const updateCoupon = useMutation({
        mutationFn: async (data: any) => await endpoints.coupons.update(editingCoupon.id, data),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم تحديث الكوبون بنجاح" : "Coupon updated successfully");
            handleClose();
            queryClient.invalidateQueries({ queryKey: ['vendor', 'coupons', vendorId] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || (language === 'ar' ? "فشل تحديث الكوبون" : "Failed to update coupon"));
        }
    });

    const deleteCoupon = useMutation({
        mutationFn: async (id: number) => await endpoints.coupons.delete(id),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم حذف الكوبون" : "Coupon deleted");
            queryClient.invalidateQueries({ queryKey: ['vendor', 'coupons', vendorId] });
        },
    });

    const resetForm = () => {
        setCode("");
        setDiscountPercent("");
        setMaxUses("");
        setEditingCoupon(null);
    };

    const handleClose = () => {
        setIsCreateOpen(false);
        resetForm();
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setCode(coupon.code);
        setDiscountPercent(coupon.discountPercent.toString());
        setMaxUses(coupon.maxUses ? coupon.maxUses.toString() : "");
        setIsCreateOpen(true);
    };

    const handleSubmit = () => {
        if (!code || !discountPercent) {
            toast.error(language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill required fields");
            return;
        }

        const data = {
            code,
            discountPercent: Number(discountPercent),
            maxUses: maxUses ? Number(maxUses) : null,
            vendorId
        };

        if (editingCoupon) {
            updateCoupon.mutate(data);
        } else {
            createCoupon.mutate(data);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
        toast.success(t('copySuccess'));
    };

    const getStatus = (coupon: any) => {
        if (!coupon.isActive) return { label: t('inactive'), variant: 'secondary' as const };
        if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) return { label: t('full'), variant: 'destructive' as const };
        return { label: t('active'), variant: 'default' as const };
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row' : 'flex-row'}`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h2 className="text-2xl font-black text-white">{t('couponsTitle')}</h2>
                    <p className="text-gray-400 text-sm">{t('couponsDesc')}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenCreate} className="bg-purple-600 hover:bg-purple-700 h-11 px-6 rounded-xl font-bold gap-2 shadow-none">
                            <Plus className="w-5 h-5" />
                            {t('newCoupon')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <DialogHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
                            <DialogTitle className="text-xl font-black">
                                {editingCoupon ? t('editCoupon') : t('createCouponTitle')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="font-bold">{t('couponCode')}</Label>
                                <Input
                                    placeholder={t('couponCodePlaceholder')}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="uppercase font-black text-lg tracking-widest h-12 border-gray-800 bg-gray-900 text-white focus:ring-purple-500"
                                />
                                <p className="text-[10px] text-gray-500">{t('couponCodeNote')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold">{t('discountPercent')}</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            placeholder="10"
                                            value={discountPercent}
                                            onChange={(e) => setDiscountPercent(e.target.value)}
                                            className={`h-12 border-gray-800 bg-gray-900 text-white focus:ring-purple-500 ${language === 'ar' ? 'pl-8' : 'pr-8'}`}
                                            min="1"
                                            max="100"
                                        />
                                        <span className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 font-bold text-gray-500`}>%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">{t('maxUses')}</Label>
                                    <Input
                                        type="number"
                                        placeholder={language === 'ar' ? "اختياري" : "Optional"}
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        className="h-12 border-gray-800 bg-gray-900 text-white focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleSubmit}
                                className="w-full h-12 rounded-xl font-bold bg-purple-600 hover:bg-purple-700"
                                disabled={createCoupon.isPending || updateCoupon.isPending}
                            >
                                {createCoupon.isPending || updateCoupon.isPending ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('saving')}</>
                                ) : (
                                    editingCoupon ? (language === 'ar' ? "تحديث الكوبون" : "Update Coupon") : (language === 'ar' ? "إنشاء الكوبون" : "Create Coupon")
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-background rounded-2xl shadow-none border border-gray-800 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <thead>
                            <tr className="bg-gray-900 border-b border-gray-800">
                                <th className={`py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('tableCoupon')}</th>
                                <th className={`py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('tableDiscount')}</th>
                                <th className={`py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('tableUsage')}</th>
                                <th className={`py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('tableStatus')}</th>
                                <th className={`py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('tableActions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                            <span className="text-sm font-bold text-gray-500">{t('fetchingCoupons')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : coupons?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 grayscale opacity-30">
                                            <Ticket className="w-16 h-16 text-purple-900/40" />
                                            <div className="space-y-1">
                                                <p className="font-black text-gray-600">{t('noCoupons')}</p>
                                                <p className="text-xs text-gray-500">{t('noCouponsDesc')}</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                coupons?.map((coupon: any) => {
                                    const status = getStatus(coupon);
                                    return (
                                        <tr key={coupon.id} className="hover:bg-gray-800/30 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                        <Ticket className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-white tracking-wider">
                                                                {coupon.code}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(coupon.code)}
                                                                className="text-gray-300 hover:text-purple-600 transition-colors p-1"
                                                            >
                                                                {copiedCode === coupon.code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium">
                                                            {language === 'ar' ? `أنشئ في ${format(new Date(coupon.createdAt), 'dd MMMM yyyy', { locale: ar })}` : `Created at ${format(new Date(coupon.createdAt), 'dd MMMM yyyy')}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="inline-flex items-center px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-md font-black text-sm">
                                                    %{coupon.discountPercent}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                        <Users className="w-3 h-3" />
                                                        {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                                                    </div>
                                                    {coupon.maxUses && (
                                                        <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-purple-500 transition-all"
                                                                style={{ width: `${Math.min(((coupon.usedCount || 0) / coupon.maxUses) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant={status.variant} className="font-bold px-3 py-1 rounded-full text-[10px]">
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="w-9 h-9 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-xl transition-all"
                                                        onClick={() => handleOpenEdit(coupon)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="w-9 h-9 text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-xl transition-all"
                                                        onClick={() => {
                                                            if (confirm(t('deleteCouponConfirm'))) {
                                                                deleteCoupon.mutate(coupon.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-4 p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 py-10">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                            <p className="text-sm font-bold text-gray-400">{t('fetchingCoupons')}</p>
                        </div>
                    ) : coupons?.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-10 grayscale opacity-30 text-center">
                            <Ticket className="w-12 h-12 text-purple-900/40" />
                            <div className="space-y-1">
                                <p className="font-black text-gray-600">{t('noCoupons')}</p>
                                <p className="text-xs text-gray-500">{t('noCouponsDesc')}</p>
                            </div>
                        </div>
                    ) : (
                        coupons?.map((coupon: any) => {
                            const status = getStatus(coupon);
                            return (
                                <div key={coupon.id} className="bg-background rounded-2xl border border-gray-800 p-4 shadow-none space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                                                <Ticket className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-lg tracking-wider">
                                                        {coupon.code}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(coupon.code)}
                                                        className="text-gray-500 hover:text-purple-400 transition-colors p-1"
                                                    >
                                                        {copiedCode === coupon.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium block">
                                                    {language === 'ar' ? `أنشئ في ${format(new Date(coupon.createdAt), 'dd MMMM yyyy', { locale: ar })}` : `Created at ${format(new Date(coupon.createdAt), 'dd MMMM yyyy')}`}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant={status.variant} className="font-bold px-2 py-1 rounded-lg text-[10px]">
                                            {status.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-gray-800">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{t('tableDiscount')}</p>
                                            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded-md font-black text-sm">
                                                %{coupon.discountPercent}
                                            </span>
                                        </div>
                                        <div className="text-center border-l border-gray-800 border-r-0 rtl:border-r rtl:border-l-0">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{t('tableUsage')}</p>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-black text-white">
                                                    {coupon.usedCount || 0} <span className="text-gray-500 font-medium">/ {coupon.maxUses || '∞'}</span>
                                                </span>
                                                {coupon.maxUses && (
                                                    <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500 transition-all"
                                                            style={{ width: `${Math.min(((coupon.usedCount || 0) / coupon.maxUses) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 h-10 rounded-xl font-bold bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border-0"
                                            variant="outline"
                                            onClick={() => handleOpenEdit(coupon)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? "تعديل" : "Edit"}
                                        </Button>
                                        <Button
                                            className="flex-1 h-10 rounded-xl font-bold bg-red-900/30 text-red-500 hover:bg-red-900/50 border-0"
                                            variant="outline"
                                            onClick={() => {
                                                if (confirm(t('deleteCouponConfirm'))) {
                                                    deleteCoupon.mutate(coupon.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? "حذف" : "Delete"}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Hint Card */}
            <div className="bg-amber-900/30 border border-amber-800 p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 space-y-1">
                    <p className="font-bold">{t('couponHintTitle')}</p>
                    <p>{t('couponHintDesc')}</p>
                </div>
            </div>
        </div>
    );
}
