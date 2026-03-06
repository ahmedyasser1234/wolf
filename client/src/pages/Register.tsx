import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

export default function Register() {
    const { language } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useLocation();
    const queryParams = new URLSearchParams(window.location.search);
    const redirectPath = queryParams.get('redirect') || "/";
    const { refresh } = useAuth();

    const syncCart = async () => {
        const guestItemsRaw = localStorage.getItem('wolf-techno-guest-items');
        if (!guestItemsRaw) return;
        try {
            const guestItems = JSON.parse(guestItemsRaw);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
                for (const item of guestItems) {
                    await api.post('/cart', {
                        productId: item.productId,
                        quantity: item.quantity,
                        size: item.size,
                        color: item.color
                    });
                }
                localStorage.removeItem('wolf-techno-guest-items');
                window.dispatchEvent(new CustomEvent('wolf-techno-cart-updated'));
            }
        } catch (e) {
            console.error("Cart sync failed", e);
        }
    };

    // Core state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post("/auth/register", {
                name,
                email: email.toLowerCase(),
                password,
                role: 'customer',
                phone,
                address
            });

            if (response.data.requiresVerification) {
                toast.success(language === 'ar' ? 'تم إرسال كود التحقق إلى بريدك' : 'Verification code sent to your email');
                setLocation(`/verify-email?email=${encodeURIComponent(email.toLowerCase())}&redirect=${encodeURIComponent(redirectPath)}`);
                return;
            }

            if (response.data.token) {
                localStorage.setItem('app_token', response.data.token);
            }

            await syncCart();
            await refresh(); // Refresh auth state
            toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
            setLocation(redirectPath);
        } catch (error: any) {
            const msg = error.response?.data?.message || (language === 'ar' ? 'فشل إنشاء الحساب. قد يكون البريد مستخدم مسبقاً' : 'Registration failed. Email might be in use.');
            toast.error(msg);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all font-arabic force-light">
                <CardHeader className="space-y-1 text-center pt-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-primary/20 ring-8 ring-primary/5">
                        <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                        {language === 'ar' ? 'إنشاء حساب جديد' : 'Create an account'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'انضم إلى WOLF TECHNO اليوم' : 'Join WOLF TECHNO today'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className={`space-y-2 text-${language === 'ar' ? 'right' : 'left'}`}>
                            <Label htmlFor="name" className="text-gray-900 font-bold">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-12 rounded-xl !text-black !placeholder-gray-500 bg-white"
                            />
                        </div>

                        <div className={`space-y-2 text-${language === 'ar' ? 'right' : 'left'}`}>
                            <Label htmlFor="email" className="text-gray-900 font-bold">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                required
                                className="h-12 rounded-xl !text-black !placeholder-gray-500 bg-white"
                            />
                        </div>

                        <div className={`space-y-2 text-${language === 'ar' ? 'right' : 'left'}`}>
                            <Label htmlFor="password" className="text-gray-900 font-bold">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 rounded-xl !text-black !placeholder-gray-500 bg-white"
                            />
                        </div>

                        <div className={`space-y-2 text-${language === 'ar' ? 'right' : 'left'}`}>
                            <Label htmlFor="phone" className="text-gray-900 font-bold">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg transition-all mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (language === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center flex-col gap-4 pb-8">
                    <div className="text-sm text-center">
                        <span className="text-gray-500">{language === 'ar' ? 'لديك حساب بالفعل؟' : "Already have an account?"} </span>
                        <Link href="/login" className="font-black text-primary hover:opacity-80 transition-opacity">
                            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
