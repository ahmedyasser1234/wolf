import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Loader2, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ResetPassword() {
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();
    const queryParams = new URLSearchParams(window.location.search);
    const email = queryParams.get('email') || "";

    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (!email) {
            setLocation("/forgot-password");
        }
    }, [email, setLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        if (code.length !== 6) {
            toast.error(language === 'ar' ? 'يرجى إدخال كود التحقق المكون من 6 أرقام' : 'Please enter the 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            await api.post("/auth/reset-password", {
                email,
                code,
                password
            });
            toast.success(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password reset successfully');
            setLocation("/login");
        } catch (error: any) {
            const msg = error.response?.data?.message || (language === 'ar' ? 'الكود غير صحيح أو منتهي الصلاحية' : 'Invalid or expired code');
            toast.error(msg);
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
                            <ShieldCheck className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-black tracking-tight text-gray-900">
                                {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Reset Password'}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-medium px-4">
                                {language === 'ar'
                                    ? `أدخل الكود المرسل إلى بريدك وكلمة المرور الجديدة`
                                    : `Enter the code sent to your email and your new password`}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                    className="h-12 text-center text-xl font-black rounded-xl border-2 focus:border-primary focus:ring-2 transition-all bg-white text-black"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className={`block text-sm font-bold text-gray-700 text-${language === 'ar' ? 'right' : 'left'}`}>
                                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 rounded-xl border-2 focus:border-primary transition-all bg-white text-black"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className={`block text-sm font-bold text-gray-700 text-${language === 'ar' ? 'right' : 'left'}`}>
                                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-12 rounded-xl border-2 focus:border-primary transition-all bg-white text-black"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 mt-4"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        {language === 'ar' ? 'تغيير كلمة المرور' : 'Update Password'}
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
