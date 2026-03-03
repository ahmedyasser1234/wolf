import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
    const { t, language } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        try {
            const { credential } = credentialResponse;
            const response = await api.post("/auth/google", { token: credential });
            if (response.data.token) {
                localStorage.setItem('app_token', response.data.token);
            }
            await syncCart();
            await refresh();
            toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
            const userRole = response.data.user?.role;
            if (userRole === 'vendor') {
                setLocation("/vendor-dashboard");
            } else {
                setLocation(redirectPath);
            }
        } catch (error) {
            toast.error(language === 'ar' ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Login failed');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: email.toLowerCase(),
                password,
                role: 'customer'
            });
            if (response.data.token) {
                localStorage.setItem('app_token', response.data.token);
            }
            await syncCart();
            await refresh(); // Refresh auth state
            toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
            setLocation(redirectPath);
        } catch (error: any) {
            const message = error.response?.data?.message || (language === 'ar' ? 'فشل تسجيل الدخول. تحقق من بياناتك' : 'Login failed. Check your credentials');
            toast.error(message);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all font-arabic force-light">
                <CardHeader className="space-y-1 text-center pt-8">
                    <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                        {language === 'ar' ? 'تسجيل الدخول' : 'Sign in to your account'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'أهلا بك مجددا! الرجاء ادخال بياناتك' : 'Welcome back! Please enter your details'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className={`space-y-2 text-${language === 'ar' ? 'right' : 'left'}`}>
                            <Label htmlFor="email" className="text-gray-900 font-bold">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary !text-black !placeholder-gray-500 bg-white"
                            />
                        </div>
                        <div className={`space-y-2 text-${language === 'ar' ? 'right' : 'left'}`}>
                            <Label htmlFor="password" className="text-gray-900 font-bold">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary !text-black bg-white !placeholder-gray-500 ${language === 'ar' ? 'pl-10' : 'pr-10'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center text-gray-500 hover:text-gray-700 focus:outline-none`}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">
                                    {language === 'ar' ? 'أو' : 'Or continue with'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    console.log('Login Failed');
                                    toast.error("Google Login Failed");
                                }}
                                useOneTap
                            />
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <div className="text-sm text-center">
                        <span className="text-gray-500">{language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"} </span>
                        <Link href="/register" className="font-black text-primary hover:opacity-80 transition-opacity">
                            {language === 'ar' ? 'إنشاء حساب جديد' : 'Sign up'}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
