import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Loader2, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ForgotPassword() {
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email: email.toLowerCase() });
            toast.success(language === 'ar' ? 'تم إرسال كود استعادة كلمة المرور لبريدك' : 'Password reset code sent to your email');
            setLocation(`/reset-password?email=${encodeURIComponent(email.toLowerCase())}`);
        } catch (error: any) {
            toast.error(language === 'ar' ? 'فشل إرسال الكود' : 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-arabic force-light text-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl">
                    <CardHeader className="space-y-4 text-center pt-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 ring-8 ring-primary/5">
                            <KeyRound className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black tracking-tight text-gray-900">
                                {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-medium px-4">
                                {language === 'ar'
                                    ? 'أدخل بريدك الإلكتروني وسنرسل لك كود لإعادة تعيين كلمة المرور'
                                    : "Enter your email and we'll send you a code to reset your password"}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className={`block text-sm font-bold text-gray-700 text-${language === 'ar' ? 'right' : 'left'}`}>
                                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-14 rounded-2xl border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white text-black !placeholder-gray-400"
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
                                        {language === 'ar' ? 'إرسال الكود' : 'Send Reset Code'}
                                        {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-8">
                        <Link href="/login" className="text-sm font-black text-primary hover:opacity-80 transition-opacity flex items-center justify-center gap-2">
                            {language === 'ar' ? 'الرجوع لتسجيل الدخول' : 'Back to Login'}
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
