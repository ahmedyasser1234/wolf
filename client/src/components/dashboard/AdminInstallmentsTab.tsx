import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    Calendar,
    CreditCard,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function AdminInstallmentsTab({
    showConfirm
}: {
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
}) {
    const queryClient = useQueryClient();
    const { language, t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [name, setName] = useState("");
    const [months, setMonths] = useState<string>("");
    const [interestRate, setInterestRate] = useState<string>("0");
    const [downPaymentPercentage, setDownPaymentPercentage] = useState<string>("0");
    const [minQuantity, setMinQuantity] = useState<string>("1");
    const [maxQuantity, setMaxQuantity] = useState<string>("0");
    const [isActive, setIsActive] = useState(true);
    const [collectionId, setCollectionId] = useState<string>("all");

    const { data: plans, isLoading } = useQuery({
        queryKey: ['admin', 'installments'],
        queryFn: () => endpoints.installments.list(),
    });

    const { data: collections } = useQuery({
        queryKey: ['categories'], // Using categories key because we need all collections usually tied to them
        queryFn: () => endpoints.collections.list(),
    });

    const createPlan = useMutation({
        mutationFn: (data: any) => endpoints.installments.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'installments'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم إنشاء الخطة بنجاح' : 'Installment plan created successfully');
        },
    });

    const updatePlan = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => endpoints.installments.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'installments'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم تحديث الخطة بنجاح' : 'Installment plan updated successfully');
        },
    });

    const deletePlan = useMutation({
        mutationFn: (id: number) => endpoints.installments.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'installments'] });
            toast.success(language === 'ar' ? 'تم حذف الخطة بنجاح' : 'Installment plan deleted successfully');
        },
    });

    const resetForm = () => {
        setName("");
        setMonths("3");
        setInterestRate("0");
        setDownPaymentPercentage("0");
        setMinQuantity("1");
        setMaxQuantity("0");
        setIsActive(true);
        setCollectionId("all");
        setEditingPlan(null);
    };

    const handleSubmit = () => {
        const data = {
            name,
            months: Number(months),
            interestRate: Number(interestRate),
            downPaymentPercentage: Number(downPaymentPercentage),
            minQuantity: Number(minQuantity),
            maxQuantity: Number(maxQuantity),
            collectionId: collectionId === "all" ? null : Number(collectionId),
            isActive
        };

        if (editingPlan) {
            updatePlan.mutate({ id: editingPlan.id, data });
        } else {
            createPlan.mutate(data);
        }
    };

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setName(plan.name || "");
        setMonths(plan.months.toString());
        setInterestRate(plan.interestRate?.toString() || "0");
        setDownPaymentPercentage(plan.downPaymentPercentage?.toString() || "0");
        setMinQuantity(plan.minQuantity?.toString() || "1");
        setMaxQuantity(plan.maxQuantity?.toString() || "0");
        setIsActive(plan.isActive);
        setCollectionId(plan.collectionId?.toString() || "all");
        setIsModalOpen(true);
    };

    const handleDelete = (id: number, plan: any) => {
        showConfirm(
            language === 'ar' ? 'حذف خطة التقسيط' : 'Delete Plan',
            `${language === 'ar' ? 'هل أنت متأكد من حذف الخطة' : 'Are you sure you want to delete plan'} "${plan.name}"?`,
            () => deletePlan.mutate(id)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">{language === 'ar' ? 'إدارة خطط التقسيط' : 'Manage Installment Plans'}</h2>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Plus size={18} className="mr-2" />
                    {language === 'ar' ? 'إضافة خطة جديدة' : 'Add New Plan'}
                </Button>
            </div>

            <Card className="border-0 shadow-none overflow-hidden bg-background border border-gray-800">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-64 text-start">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="text"
                                placeholder={language === 'ar' ? 'بحث عن خطة...' : 'Search plan...'}
                                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-gray-900 border-gray-800 text-white`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto text-start">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="py-3 px-6 font-semibold text-white text-start">{language === 'ar' ? 'اسم الخطة' : 'Plan Name'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-start">{language === 'ar' ? 'المجموعة' : 'Collection'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'المدة (أشهر)' : 'Period (Months)'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'الفائدة' : 'Interest Rate'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'المقدم %' : 'Down Payment %'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{t('tableStatus')}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-end">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-800">
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-32 bg-gray-800" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-24 bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-12 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-12 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-12 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-12 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-20 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-16 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 justify-end flex gap-2"><Skeleton className="h-8 w-8 rounded-lg bg-gray-800" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    plans
                                        ?.filter((p: any) =>
                                            (p.name || '').toLowerCase().includes(search.toLowerCase())
                                        )
                                        .map((plan: any) => (
                                            <tr key={plan.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                                <td className="py-4 px-6 font-bold text-white">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="w-4 h-4 text-purple-600" />
                                                        {plan.name}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-start text-sm text-gray-300">
                                                    {plan.collectionName || (language === 'ar' ? 'عام' : 'Global')}
                                                </td>
                                                <td className="py-4 px-6 text-center font-black text-white">
                                                    {plan.months} {language === 'ar' ? 'شهر' : 'Months'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${plan.interestRate === 0 ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>
                                                        {plan.interestRate === 0 ? (language === 'ar' ? 'بدون فوائد' : 'Interest Free') : `${plan.interestRate}%`}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-orange-400">
                                                    {plan.downPaymentPercentage}%
                                                </td>
                                                <td className="py-4 px-6 text-center text-white">
                                                    {plan.minQuantity || 1} - {plan.maxQuantity === 0 ? (language === 'ar' ? '∞' : '∞') : plan.maxQuantity}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {plan.isActive ? (
                                                        <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold">
                                                            <CheckCircle2 size={14} /> {language === 'ar' ? 'نشط' : 'Active'}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1 text-red-400 text-xs font-bold">
                                                            <XCircle size={14} /> {language === 'ar' ? 'معطل' : 'Disabled'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-end">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(plan)}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(plan.id, plan)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                                {plans?.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-500 italic">
                                            {language === 'ar' ? 'لا توجد خطط تقسيط مضافة بعد.' : 'No installment plans added yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800">
                        <div className="p-6 border-b border-gray-800">
                            <h3 className="text-xl font-bold text-white text-start">
                                {editingPlan ? (language === 'ar' ? 'تعديل خطة التقسيط' : 'Edit Installment Plan') : (language === 'ar' ? 'إضافة خطة تقسيط جديدة' : 'Add New Installment Plan')}
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'اسم الخطة' : 'Plan Name'}</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={language === 'ar' ? 'مثال: تقسيط 6 أشهر بدون فوائد' : 'e.g. 6 Months Interest Free'}
                                        className="bg-gray-900 border-gray-800 text-white"
                                    />
                                </div>

                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'المجموعة (الماركة)' : 'Collection (Brand)'}</label>
                                    <Select
                                        value={collectionId}
                                        onValueChange={(val) => {
                                            setCollectionId(val);
                                            if (val !== "all") {
                                                const selected = collections?.find((c: any) => c.id.toString() === val);
                                                if (selected && selected.downPaymentPercentage !== undefined) {
                                                    setDownPaymentPercentage(selected.downPaymentPercentage.toString());
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                                            <SelectValue placeholder={language === 'ar' ? 'اختر المجموعة' : 'Select Collection'} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                            <SelectItem value="all">{language === 'ar' ? 'كل المجموعات (عام)' : 'All Collections (Global)'}</SelectItem>
                                            {collections?.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {language === 'ar' ? c.nameAr : c.nameEn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2 text-start">
                                        <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'نسبة المقدم (%)' : 'Down Payment (%)'}</label>
                                        <Input
                                            type="number"
                                            value={downPaymentPercentage}
                                            onChange={(e) => setDownPaymentPercentage(e.target.value)}
                                            className="bg-gray-900 border-gray-800 text-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2 text-start">
                                            <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'أقل كمية' : 'Min Qty'}</label>
                                            <Input
                                                type="number"
                                                value={minQuantity}
                                                onChange={(e) => setMinQuantity(e.target.value)}
                                                className="bg-gray-900 border-gray-800 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2 text-start">
                                            <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'أقصى كمية' : 'Max Qty'}</label>
                                            <Input
                                                type="number"
                                                value={maxQuantity}
                                                onChange={(e) => setMaxQuantity(e.target.value)}
                                                placeholder="0 = ∞"
                                                className="bg-gray-900 border-gray-800 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2 text-start">
                                        <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'المدة (بالشهور)' : 'Period (Months)'}</label>
                                        <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="6" className="text-left bg-gray-900 border-gray-800 text-white" />
                                    </div>
                                    <div className="space-y-2 text-start">
                                        <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'نسبة الفائدة' : 'Interest Rate %'}</label>
                                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="0" className="text-left bg-gray-900 border-gray-800 text-white" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-5 bg-gray-900/50 border border-gray-800 rounded-2xl">
                                    <div className="space-y-1">
                                        <label className="text-base font-black text-white tracking-tight">{language === 'ar' ? 'حالة الخطة' : 'Plan Status'}</label>
                                        <p className="text-xs text-gray-400">{language === 'ar' ? 'تفعيل أو تعطيل هذه الخطة للعملاء' : 'Enable or disable this plan for customers'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
                                            {isActive ? (language === 'ar' ? 'منشور' : 'Public') : (language === 'ar' ? 'مخفي' : 'Private')}
                                        </span>
                                        <Switch
                                            checked={isActive}
                                            onCheckedChange={setIsActive}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800">
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!name || !months || createPlan.isPending || updatePlan.isPending}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {(createPlan.isPending || updatePlan.isPending) ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
