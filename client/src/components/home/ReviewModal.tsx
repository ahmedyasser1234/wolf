import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface ReviewModalProps {
    children?: React.ReactNode;
}

export function ReviewModal({ children }: ReviewModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const [, setLocation] = useLocation();

    const mutation = useMutation({
        mutationFn: endpoints.storeReviews.create,
        onSuccess: () => {
            toast.success(language === 'ar' ? "شكراً لك!" : "Thank you!", {
                description: language === 'ar' ? "تم استلام تقييمك بنجاح." : "Your review has been submitted successfully.",
            });
            setIsOpen(false);
            queryClient.invalidateQueries({ queryKey: ['storeReviews'] });
        },
        onError: (error: any) => {
            if (error.response?.status === 409) {
                toast.error(language === 'ar' ? "عذراً" : "Sorry", {
                    description: language === 'ar' ? "لقد قمت بتقييم هذا المتجر مسبقاً." : "You have already reviewed this store.",
                });
            } else {
                toast.error(language === 'ar' ? "خطأ" : "Error", {
                    description: language === 'ar' ? "حدث خطأ أثناء إرسال التقييم." : "Failed to submit review.",
                });
            }
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        mutation.mutate({
            guestName: formData.get("guestName"),
            city: formData.get("city"),
            comment: formData.get("comment"),
            rating,
        });
    };

    const handleLoginRedirect = () => {
        setLocation('/auth');
    };

    if (!isAuthenticated) {
        return (
            <Button
                onClick={handleLoginRedirect}
                className="w-full md:w-auto px-8 py-6 rounded-full text-lg font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
                {language === 'ar' ? "سجل دخولك للتقييم" : "Log in to Review"}
            </Button>
        );
    }

    if (user?.role !== 'customer') {
        return null; // Don't show review button for vendors/admins
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || <Button className="w-full md:w-auto px-8 py-6 rounded-full text-lg font-bold -primary hover:-primary text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    {language === 'ar' ? "أضف تقييمك" : "Write a Review"}
                </Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center mb-4">
                        {language === 'ar' ? "قيم تجربتك معنا" : "Rate Your Experience"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2 mb-6 direction-ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={cn(
                                        "w-10 h-10 transition-colors",
                                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    name="guestName"
                                    placeholder={language === 'ar' ? "الاسم" : "Name"}
                                    required
                                    defaultValue={user?.name || ''}
                                    readOnly={!!user?.name}
                                    className="rounded-xl border-gray-200 focus:-primary focus:-primary bg-gray-50/50"
                                    dir={language === 'ar' ? "rtl" : "ltr"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    name="city"
                                    placeholder={language === 'ar' ? "المدينة" : "City"}
                                    required
                                    className="rounded-xl border-gray-200 focus:-primary focus:-primary bg-gray-50/50"
                                    dir={language === 'ar' ? "rtl" : "ltr"}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Textarea
                                name="comment"
                                placeholder={language === 'ar' ? "اكتب تعليقك هنا..." : "Share your thoughts..."}
                                required
                                className="min-h-[120px] rounded-xl border-gray-200 focus:-primary focus:-primary bg-gray-50/50 resize-none"
                                dir={language === 'ar' ? "rtl" : "ltr"}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-6 rounded-xl text-lg font-bold -primary hover:-primary text-white shadow-lg -primary/20 transition-all duration-300"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <span className="flex items-center gap-2">
                                {language === 'ar' ? "جاري الإرسال..." : "Submitting..."}
                            </span>
                        ) : (
                            language === 'ar' ? "إرسال التقييم" : "Submit Review"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
