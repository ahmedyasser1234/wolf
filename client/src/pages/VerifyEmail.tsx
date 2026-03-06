import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Loader2, MailCheck, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function VerifyEmail() {
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [location, setLocation] = useLocation();
    const queryParams = new URLSearchParams(window.location.search);
    const email = queryParams.get('email') || "";
    const redirectPath = queryParams.get('redirect') || "/";
    const { refresh } = useAuth();
    const [code, setCode] = useState("");

    useEffect(() => {
        if (!email) {
            setLocation("/login");
        }
    }, [email, setLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error(language === 'ar' ? 'يرجى إدخال كود التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post("/auth/verify-registration", {
                email,
                code
            });

            if (response.data.token) {
                localStorage.setItem('app_token', response.data.token);
                await refresh();
                toast.success(language === 'ar' ? 'تم التحقق من بريدك بنجاح' : 'Email verified successfully');
                setLocation(redirectPath);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || (language === 'ar' ? 'كود التحقق غير صحيح أو منتهي الصلاحية' : 'Invalid or expired verification code');
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await api.post("/auth/resend-otp", {
                email,
                type: 'registration'
            });
            toast.success(language === 'ar' ? 'تم إعادة إرسال الكود بنجاح' : 'Code resent successfully');
        } catch (error: any) {
            toast.error(language === 'ar' ? 'فشل إعادة إرسال الكود' : 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-arabic force-light">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl">
                    <CardHeader className="space-y-4 text-center pt-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 ring-8 ring-primary/5">
                            <MailCheck className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black tracking-tight text-gray-900">
                                {language === 'ar' ? 'تحقق من بريدك' : 'Verify your email'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-medium px-4">
                                {language === 'ar'
                                    ? `لقد أرسلنا كود التحقق المكون من 6 أرقام إلى ${email}`
                                    : `We've sent a 6-digit verification code to ${email}`}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="code" className={`block text-sm font-bold text-gray-700 text-${language === 'ar' ? 'right' : 'left'}`}>
                                    {language === 'ar' ? 'كود التحقق' : 'Verification Code'}
                                </Label>
                                <Input
                                    id="code"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-2xl border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white text-black"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        {language === 'ar' ? 'تأكيد الرمز' : 'Verify Code'}
                                        {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 pb-8">
                        <div className="text-center">
                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="text-sm font-black text-primary hover:opacity-80 transition-opacity flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                            >
                                {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                {language === 'ar' ? 'لم يصلك الكود؟ إعادة إرسال' : "Didn't receive code? Resend"}
                            </button>
                        </div>
                        <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600 font-bold transition-colors">
                            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
