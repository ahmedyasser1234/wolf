import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Trash2,
    Loader2,
    Gift,
    Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export default function AdminGiftCardsTab({
    showConfirm
}: {
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
}) {
    const queryClient = useQueryClient();
    const { language } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [code, setCode] = useState("");
    const [discountAmount, setDiscountAmount] = useState<string>("");

    const { data: giftCards, isLoading } = useQuery({
        queryKey: ['admin', 'gift-cards'],
        queryFn: () => endpoints.giftCards.list(),
    });

    const displayCards = (giftCards || []).filter((c: any) =>
        c.code?.toLowerCase().includes(search.toLowerCase())
    );

    const createCard = useMutation({
        mutationFn: (data: any) => endpoints.giftCards.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'gift-cards'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم إنشاء الجيفت كارد بنجاح' : 'Gift Card created successfully');
        },
    });

    const deleteCard = useMutation({
        mutationFn: (id: number) => endpoints.giftCards.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'gift-cards'] });
            toast.success(language === 'ar' ? 'تم حذف الجيفت كارد بنجاح' : 'Gift Card deleted successfully');
        },
    });

    const resetForm = () => {
        setCode("");
        setDiscountAmount("");
        setEditingCoupon(null);
    };

    const handleSubmit = () => {
        const data = {
            amount: Number(discountAmount),
            code: code ? code : undefined,
        };
        createCard.mutate(data);
    };

    const handleEdit = (card: any) => {
        setEditingCoupon(card);
        setCode(card.code || "");
        setDiscountAmount(card.amount?.toString() || "");
        setIsModalOpen(true);
    };

    const handleDelete = (id: number, card: any) => {
        showConfirm(
            language === 'ar' ? 'حذف الجيفت كارد' : 'Delete Gift Card',
            `${language === 'ar' ? 'هل أنت متأكد من حذف الكود' : 'Are you sure you want to delete code'} "${card.code}"?`,
            () => deleteCard.mutate(id)
        );
    };

    const generateCode = () => {
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        setCode(random);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Gift className="text-emerald-400 w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    {language === 'ar' ? 'إدارة الجيفت كارد' : 'Manage Gift Cards'}
                </h2>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 h-12 font-black shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-98"
                >
                    <Plus size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    {language === 'ar' ? 'إنشاء جيفت كارد جديدة' : 'Create New Gift Card'}
                </Button>
            </div>

            <Card className="border-0 shadow-none overflow-hidden bg-background border border-gray-800 rounded-[2rem]">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-64 text-start">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="text"
                                placeholder={language === 'ar' ? 'بحث عن كود...' : 'Search code...'}
                                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-gray-900 border-gray-800 text-white rounded-xl text-base md:text-sm`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/30">
                                    <th className="py-4 px-6 font-bold text-gray-400 text-start text-xs uppercase tracking-widest">{language === 'ar' ? 'الكود' : 'Code'}</th>
                                    <th className="py-4 px-6 font-bold text-gray-400 text-center text-xs uppercase tracking-widest">{language === 'ar' ? 'القيمة' : 'Value'}</th>
                                    <th className="py-4 px-6 font-bold text-gray-400 text-center text-xs uppercase tracking-widest">{language === 'ar' ? 'بيانات الحساب' : 'Account Info'}</th>
                                    <th className="py-4 px-6 font-bold text-gray-400 text-center text-xs uppercase tracking-widest">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className="py-4 px-6 font-bold text-gray-400 text-end text-xs uppercase tracking-widest">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-800">
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-24 bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-16 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="h-4 w-20 mx-auto bg-gray-800" /></td>
                                            <td className="py-4 px-6 text-end"><Skeleton className="h-8 w-20 ml-auto bg-gray-800" /></td>
                                        </tr>
                                    ))
                                ) : displayCards.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500 font-bold">
                                            {language === 'ar' ? 'لا توجد جيفت كارد حالياً' : 'No gift cards found'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayCards.map((card: any) => (
                                        <tr key={card.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-6 font-black text-white flex items-center gap-2">
                                                <div className="w-8 h-8 bg-emerald-900/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                                                    <Gift size={16} />
                                                </div>
                                                <span className="tracking-widest font-mono uppercase">{card.code}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-emerald-400 font-black text-lg">
                                                    {formatPrice(card.amount || 0)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center gap-1 text-xs">
                                                    {(card.senderName || card.senderEmail) ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{language === 'ar' ? 'المشتري:' : 'Purchased By:'}</span>
                                                            <span className="text-white font-bold">{card.senderName || card.senderEmail}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-600 italic">{language === 'ar' ? 'إنشاء أدمن' : 'Admin Created'}</span>
                                                    )}
                                                    
                                                    {card.isRedeemed && (
                                                        <div className="flex flex-col items-center mt-1 pt-1 border-t border-gray-800 w-full">
                                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">{language === 'ar' ? 'المستخدم:' : 'Redeemed By:'}</span>
                                                            <span className="text-emerald-400 font-bold">{card.redeemerName || card.redeemerEmail || (language === 'ar' ? 'غير معروف' : 'Unknown')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${card.isRedeemed ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                                                    {card.isRedeemed ? (language === 'ar' ? 'مستخدمة' : 'Redeemed') : (language === 'ar' ? 'متاحة' : 'Available')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-end">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id, card)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg">
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
                        <div className="p-6 sm:p-8 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-900/20 to-transparent">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white">
                                    {editingCoupon ? (language === 'ar' ? 'تعديل الجيفت كارد' : 'Edit Gift Card') : (language === 'ar' ? 'إنشاء جيفت كارد' : 'Create Gift Card')}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">
                                    {language === 'ar' ? "رصيد محفظة مباشر" : "Direct Wallet Credit"}
                                </p>
                            </div>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
                                <Gift className="text-emerald-400 w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                            <div className="space-y-2 text-start">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">{language === 'ar' ? 'كود الجيفت كارد' : 'Gift Card Code'}</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="GIFT-XXXX-XXXX"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="uppercase font-mono tracking-widest font-black text-lg h-14 bg-gray-950 border-gray-800 text-white rounded-2xl px-6 focus:ring-emerald-500"
                                    />
                                    <Button variant="outline" size="icon" onClick={generateCode} className="shrink-0 h-14 w-14 rounded-2xl border-gray-800 hover:bg-gray-800 text-emerald-400 bg-gray-950">
                                        <Ticket className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">{language === 'ar' ? 'قيمة الشحن (AED)' : 'Credit Amount (AED)'}</label>
                                    <Input
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => setDiscountAmount(e.target.value)}
                                        placeholder="100.00"
                                        className="h-14 bg-gray-950 border-gray-800 text-white rounded-2xl px-6 font-black text-lg focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-800 flex gap-4 bg-gray-950/50">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-gray-400 hover:bg-gray-900 border border-transparent hover:border-gray-800">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!discountAmount || createCard.isPending}
                                className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-900/20"
                            >
                                {createCard.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : (language === 'ar' ? 'حفظ الجيفت كارد' : 'Save Gift Card')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
