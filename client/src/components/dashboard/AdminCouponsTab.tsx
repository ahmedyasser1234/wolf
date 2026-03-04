import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    Ticket,
    Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function AdminCouponsTab({
    showConfirm
}: {
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
}) {
    const queryClient = useQueryClient();
    const { language, t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [code, setCode] = useState("");
    const [type, setType] = useState<"percentage" | "fixed">("percentage");
    const [discountPercent, setDiscountPercent] = useState<string>("");
    const [discountAmount, setDiscountAmount] = useState<string>("");
    const [maxUses, setMaxUses] = useState<string>("");

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['admin', 'coupons'],
        queryFn: () => endpoints.coupons.list(),
    });

    const createCoupon = useMutation({
        mutationFn: (data: any) => endpoints.coupons.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم إنشاء الكوبون بنجاح' : 'Coupon created successfully');
        },
    });

    const updateCoupon = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => endpoints.coupons.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم تحديث الكوبون بنجاح' : 'Coupon updated successfully');
        },
    });

    const deleteCoupon = useMutation({
        mutationFn: (id: number) => endpoints.coupons.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
            toast.success(language === 'ar' ? 'تم حذف الكوبون بنجاح' : 'Coupon deleted successfully');
        },
    });

    const resetForm = () => {
        setCode("");
        setType("percentage");
        setDiscountPercent("");
        setDiscountAmount("");
        setMaxUses("");
        setEditingCoupon(null);
    };

    const handleSubmit = () => {
        const data = {
            code,
            type,
            discountPercent: type === 'percentage' ? Number(discountPercent) : null,
            discountAmount: type === 'fixed' ? Number(discountAmount) : null,
            maxUses: maxUses ? Number(maxUses) : null,
            isActive: true
        };

        if (editingCoupon) {
            updateCoupon.mutate({ id: editingCoupon.id, data });
        } else {
            createCoupon.mutate(data);
        }
    };

    const handleEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setCode(coupon.code || "");
        setType(coupon.type || "percentage");
        setDiscountPercent(coupon.discountPercent?.toString() || "");
        setDiscountAmount(coupon.discountAmount?.toString() || "");
        setMaxUses(coupon.maxUses?.toString() || "");
        setIsModalOpen(true);
    };

    const handleDelete = (id: number, coupon: any) => {
        showConfirm(
            language === 'ar' ? 'حذف الكوبون' : 'Delete Coupon',
            `${language === 'ar' ? 'هل أنت متأكد من حذف الكود' : 'Are you sure you want to delete code'} "${coupon.code}"?`,
            () => deleteCoupon.mutate(id)
        );
    };

    const generateCode = () => {
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        setCode(random);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white">{language === 'ar' ? 'إدارة الكوبونات والجيفت كارت' : 'Manage Coupons & Gift Cards'}</h2>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Plus size={18} className="mr-2" />
                    {language === 'ar' ? 'إنشاء كود جديد' : 'Create New Code'}
                </Button>
            </div>

            <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-64 text-start">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="text"
                                placeholder={language === 'ar' ? 'بحث عن كود...' : 'Search code...'}
                                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-gray-900 border-gray-800 text-white font-bold h-11 sm:h-12 rounded-xl text-base`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="py-3 px-6 font-semibold text-white text-start">{language === 'ar' ? 'الكود' : 'Code'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'النوع' : 'Type'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'الخصم' : 'Discount'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'الاستخدام' : 'Usage'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-800">
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-24 bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-16 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-12 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-20 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-end"><Skeleton className="h-8 w-20 ml-auto bg-gray-800" /></td>
                                        </tr>
                                    ))
                                ) : coupons?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
                                            {language === 'ar' ? 'لا توجد كوبونات حالياً' : 'No coupons found'}
                                        </td>
                                    </tr>
                                ) : (
                                    coupons?.filter((c: any) =>
                                        c.code.toLowerCase().includes(search.toLowerCase())
                                    ).map((coupon: any) => (
                                        <tr key={coupon.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                                                {coupon.type === 'fixed' && <Gift className="w-4 h-4 text-emerald-400" />}
                                                {coupon.code}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.type === 'percentage' ? 'bg-blue-900/40 text-blue-400' : 'bg-emerald-900/40 text-emerald-400'
                                                    }`}>
                                                    {coupon.type === 'percentage' ? (language === 'ar' ? 'نسبة' : 'Percent') : (language === 'ar' ? 'جيفت كارد' : 'Gift Card')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-gray-300">
                                                {coupon.type === 'percentage' ? `${coupon.discountPercent}%` : `${coupon.discountAmount} AED`}
                                            </td>
                                            <td className="py-4 px-6 text-center text-gray-300">
                                                {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                                            </td>
                                            <td className="py-4 px-6 text-end">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(coupon)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id, coupon)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                                {editingCoupon ? (language === 'ar' ? 'تعديل الكوبون' : 'Edit Coupon') : (language === 'ar' ? 'إنشاء كود جديد' : 'Create New Code')}
                            </h3>
                            <div className="p-2 bg-purple-900/30 rounded-lg shrink-0">
                                <Ticket className="text-purple-400 w-5 h-5" />
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="space-y-2 text-start">
                                <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'كود الخصم' : 'Coupon Code'}</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="SUMMER2024"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="uppercase font-mono tracking-wider bg-gray-900 border-gray-800 text-white"
                                    />
                                    <Button variant="outline" size="icon" onClick={generateCode} className="shrink-0 border-gray-800 hover:bg-gray-800">
                                        <Plus className="w-4 h-4 text-purple-400" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                            <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية' : 'Percentage'}</SelectItem>
                                            <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {type === 'percentage' ? (
                                    <div className="space-y-2 text-start">
                                        <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount (%)'}</label>
                                        <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="20" className="text-left bg-gray-900 border-gray-800 text-white" />
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-start">
                                        <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'مبلغ الخصم' : 'Discount Amount'}</label>
                                        <Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="50" className="text-left bg-gray-900 border-gray-800 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-start">
                                <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'أقصى عدد مرات استخدام' : 'Max Usage Count'}</label>
                                <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="100" className="text-left bg-gray-900 border-gray-800 text-white" />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!code || (type === 'percentage' ? !discountPercent : !discountAmount) || createCoupon.isPending || updateCoupon.isPending}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {(createCoupon.isPending || updateCoupon.isPending) ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
