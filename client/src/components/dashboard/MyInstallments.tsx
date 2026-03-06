import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Wallet,
    Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function MyInstallments({ customerId }: { customerId: number }) {
    const { language, formatPrice, t } = useLanguage();
    const queryClient = useQueryClient();
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string>("wallet");

    const { data: payments, isLoading } = useQuery({
        queryKey: ['my-installments', customerId],
        queryFn: () => endpoints.installments.getPaymentsCustomer(customerId),
        enabled: !!customerId,
    });

    const payMutation = useMutation({
        mutationFn: (id: number) => endpoints.installments.payInstallment(id, { customerId, paymentMethod }),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم دفع القسط بنجاح ✅" : "Installment paid successfully ✅");
            queryClient.invalidateQueries({ queryKey: ['my-installments'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || (language === 'ar' ? "فشل الدفع" : "Payment failed"));
        }
    });

    const handlePayClick = (payment: any) => {
        setSelectedPayment(payment);
        setIsPaymentModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl bg-gray-100" />
                ))}
            </div>
        );
    }

    if (!payments || payments.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-[2rem] border border-gray-100 italic font-bold text-gray-400">
                <Info className="mx-auto mb-4 text-gray-300" size={40} />
                {language === 'ar' ? 'ليس لديك أي أقساط حالية.' : 'You have no active installments.'}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-xl font-black text-gray-900 px-2 flex items-center gap-2">
                <CreditCard className="text-primary" size={24} />
                {language === 'ar' ? 'جدول الأقساط الخاص بي' : 'My Installment Schedule'}
            </h3>

            <div className="space-y-4">
                {payments.map((item: any) => {
                    const isPaid = item.status === 'paid';
                    const isOverdue = item.status === 'overdue' || (item.status === 'pending' && new Date(item.dueDate) < new Date());

                    return (
                        <Card key={item.id} className={`rounded-3xl border-0 shadow-sm overflow-hidden transition-all hover:shadow-md ${isPaid ? 'bg-gray-50/50 opacity-80' : 'bg-white'}`}>
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-600' : isOverdue ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {isPaid ? <CheckCircle2 size={28} /> : isOverdue ? <AlertCircle size={28} /> : <Clock size={28} />}
                                        </div>
                                        <div className="text-start">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-black text-gray-900 text-lg">
                                                    {formatPrice(item.amount)}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isPaid ? 'bg-emerald-500 text-white' : isOverdue ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                    {isPaid ? (language === 'ar' ? 'تم الدفع' : 'Paid') : isOverdue ? (language === 'ar' ? 'متأخر' : 'Overdue') : (language === 'ar' ? 'معلق' : 'Pending')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-400" />
                                                {language === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'} {new Date(item.dueDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                            </p>
                                        </div>
                                    </div>

                                    {!isPaid && (
                                        <Button
                                            onClick={() => handlePayClick(item)}
                                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-full h-12 px-8 font-black shadow-lg shadow-slate-200 transition-all hover:scale-[1.05] active:scale-95"
                                        >
                                            {language === 'ar' ? 'ادفع الآن' : 'Pay Now'}
                                        </Button>
                                    )}

                                    {isPaid && (
                                        <div className="text-start sm:text-end text-emerald-600 font-bold text-xs italic">
                                            {language === 'ar' ? 'تم الدفع بتاريخ:' : 'Paid on:'} {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '---'}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="rounded-[2.5rem] bg-white border-0 shadow-2xl p-8 max-w-md w-[95vw]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader className="text-start mb-6">
                        <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                <CreditCard size={20} />
                            </div>
                            {language === 'ar' ? 'دفع قسط' : 'Pay Installment'}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50 rounded-3xl text-center border border-gray-100">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{language === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}</p>
                                <h4 className="text-4xl font-black text-primary tracking-tight">
                                    {formatPrice(selectedPayment.amount)}
                                </h4>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{language === 'ar' ? 'اختر وسيلة الدفع' : 'Choose Payment Method'}</label>

                                <button
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3 font-bold text-gray-900">
                                        <Wallet size={20} className={paymentMethod === 'wallet' ? 'text-primary' : 'text-gray-400'} />
                                        {language === 'ar' ? 'المحفظة الإلكترونية' : 'Digital Wallet'}
                                    </div>
                                    {paymentMethod === 'wallet' && <CheckCircle2 size={18} className="text-primary" />}
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3 font-bold text-gray-900">
                                        <CreditCard size={20} className={paymentMethod === 'stripe' ? 'text-primary' : 'text-gray-400'} />
                                        {language === 'ar' ? 'بطاقة بنكية (Stripe)' : 'Credit/Debit Card (Stripe)'}
                                    </div>
                                    {paymentMethod === 'stripe' && <CheckCircle2 size={18} className="text-primary" />}
                                </button>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="flex-1 h-14 rounded-2xl font-black text-gray-400 hover:bg-gray-50"
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    onClick={() => payMutation.mutate(selectedPayment.id)}
                                    disabled={payMutation.isPending}
                                    className="flex-[2] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    {payMutation.isPending ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
