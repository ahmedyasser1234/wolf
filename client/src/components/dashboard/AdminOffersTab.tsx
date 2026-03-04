import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    Calendar,
    Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function AdminOffersTab({
    showConfirm
}: {
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
}) {
    const queryClient = useQueryClient();
    const { language } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [discountPercent, setDiscountPercent] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const { data: offers, isLoading } = useQuery({
        queryKey: ['admin', 'offers'],
        queryFn: () => endpoints.offers.list(),
    });

    const createOffer = useMutation({
        mutationFn: (data: any) => endpoints.offers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم إنشاء العرض بنجاح' : 'Offer created successfully');
        },
    });

    const updateOffer = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => endpoints.offers.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم تحديث العرض بنجاح' : 'Offer updated successfully');
        },
    });

    const deleteOffer = useMutation({
        mutationFn: (id: number) => endpoints.offers.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
            toast.success(language === 'ar' ? 'تم حذف العرض بنجاح' : 'Offer deleted successfully');
        },
    });

    const resetForm = () => {
        setNameAr("");
        setNameEn("");
        setDiscountPercent("");
        setStartDate("");
        setEndDate("");
        setEditingOffer(null);
    };

    const handleSubmit = () => {
        const data = {
            nameAr,
            nameEn,
            discountPercent: Number(discountPercent),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            isActive: true
        };

        if (editingOffer) {
            updateOffer.mutate({ id: editingOffer.id, data });
        } else {
            createOffer.mutate(data);
        }
    };

    const handleEdit = (offer: any) => {
        setEditingOffer(offer);
        setNameAr(offer.nameAr || "");
        setNameEn(offer.nameEn || "");
        setDiscountPercent(offer.discountPercent?.toString() || "");
        setStartDate(offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : "");
        setEndDate(offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : "");
        setIsModalOpen(true);
    };

    const handleDelete = (id: number, offer: any) => {
        const name = language === 'ar' ? offer.nameAr : offer.nameEn;
        showConfirm(
            language === 'ar' ? 'حذف العرض' : 'Delete Offer',
            `${language === 'ar' ? 'هل أنت متأكد من حذف' : 'Are you sure you want to delete'} "${name}"?`,
            () => deleteOffer.mutate(id)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white">{language === 'ar' ? 'إدارة العروض' : 'Manage Offers'}</h2>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                    <Plus size={18} className="mr-2" />
                    {language === 'ar' ? 'إضافة عرض جديد' : 'Add New Offer'}
                </Button>
            </div>

            <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-800">
                        <div className="relative w-full md:w-64 text-start">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="text"
                                placeholder={language === 'ar' ? 'بحث عن عرض...' : 'Search offer...'}
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
                                    <th className="py-3 px-6 font-semibold text-white text-start">{language === 'ar' ? 'اسم العرض' : 'Offer Name'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'الخصم' : 'Discount'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-center">{language === 'ar' ? 'الفترة' : 'Period'}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-800">
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-48 bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-12 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-32 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 justify-end flex gap-2"><Skeleton className="h-8 w-8 rounded-lg bg-gray-800" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    offers
                                        ?.filter((o: any) =>
                                            (o.nameAr || '').toLowerCase().includes(search.toLowerCase()) ||
                                            (o.nameEn || '').toLowerCase().includes(search.toLowerCase())
                                        )
                                        .map((offer: any) => (
                                            <tr key={offer.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                                <td className="py-4 px-6 font-medium text-white">
                                                    {language === 'ar' ? (offer.nameAr || offer.nameEn) : (offer.nameEn || offer.nameAr)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-lg text-xs font-bold">
                                                        {offer.discountPercent}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center text-xs text-gray-400">
                                                    <div className="flex flex-col items-center">
                                                        <span>{new Date(offer.startDate).toLocaleDateString()}</span>
                                                        <span className="mx-1"> - </span>
                                                        <span>{new Date(offer.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-end">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(offer)}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(offer.id, offer)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

            {/* Offer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-background rounded-[1.5rem] md:rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 text-start shadow-2xl">
                        <div className="p-5 sm:p-6 border-b border-gray-800">
                            <h3 className="text-lg sm:text-xl font-bold text-white text-start">
                                {editingOffer ? (language === 'ar' ? 'تعديل العرض' : 'Edit Offer') : (language === 'ar' ? 'إضافة عرض جديد' : 'Add New Offer')}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'اسم العرض (عربي)' : 'Offer Name (Arabic)'}</label>
                                    <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={language === 'ar' ? 'مثال: خصم الصيف' : 'e.g. Summer Sale'} className="bg-gray-900 border-gray-800 text-white text-base md:text-sm" />
                                </div>
                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'اسم العرض (انجليزي)' : 'Offer Name (English)'}</label>
                                    <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={language === 'ar' ? 'مثال: خصم الصيف' : 'e.g. Summer Sale'} className="text-left bg-gray-900 border-gray-800 text-white text-base md:text-sm" />
                                </div>
                            </div>

                            <div className="space-y-2 text-start">
                                <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="10" className="pl-10 text-left bg-gray-900 border-gray-800 text-white text-base md:text-sm" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10 text-left bg-gray-900 border-gray-800 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-start">
                                    <label className="text-sm font-bold text-gray-300">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10 text-left bg-gray-900 border-gray-800 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={(!nameAr && !nameEn) || !discountPercent || !startDate || !endDate || createOffer.isPending || updateOffer.isPending}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {(createOffer.isPending || updateOffer.isPending) ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
