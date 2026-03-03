import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

interface StoreRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId: number;
    vendorName: string;
}

export function StoreRatingModal({ isOpen, onClose, vendorId, vendorName }: StoreRatingModalProps) {
    const { t, language } = useLanguage();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: { vendorId: number; rating: number; comment?: string }) =>
            endpoints.storeReviews.create(data),
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم إرسال تقييمك بنجاح" : "Review submitted successfully");
            queryClient.invalidateQueries({ queryKey: ['reviews', 'vendor', vendorId] });
            queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] }); // To update avg rating
            onClose();
            setRating(0);
            setComment("");
        },
        onError: (error: any) => {
            console.error("Review submit error:", error);
            toast.error(error?.response?.data?.message || (language === 'ar' ? "فشل إرسال التقييم" : "Failed to submit review"));
        }
    });

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error(language === 'ar' ? "يرجى اختيار تقييم" : "Please select a rating");
            return;
        }
        mutation.mutate({ vendorId, rating, comment });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center">{language === 'ar' ? `تقييم متجر ${vendorName}` : `Rate ${vendorName}`}</DialogTitle>
                    <DialogDescription className="text-center">
                        {language === 'ar' ? "شارك تجربتك مع هذا المتجر" : "Share your experience with this store"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center font-medium text-lg text-gray-700 h-6">
                        {(hoverRating || rating) > 0 && (
                            <span>
                                {(hoverRating || rating)} / 5
                            </span>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comment">{language === 'ar' ? "تعليقك (اختياري)" : "Your Comment (Optional)"}</Label>
                        <Textarea
                            id="comment"
                            placeholder={language === 'ar' ? "اكتب تعليقك هنا..." : "Write your comment here..."}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        {language === 'ar' ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending || rating === 0} className="bg-purple-600 hover:bg-purple-700">
                        {mutation.isPending ? (language === 'ar' ? "جاري الإرسال..." : "Submitting...") : (language === 'ar' ? "إرسال التقييم" : "Submit Review")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
