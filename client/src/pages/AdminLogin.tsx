import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { refresh } = useAuth();
    const [, setLocation] = useLocation();

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.post("/auth/login", {
                email: email.toLowerCase(),
                password,
                role: 'admin'
            });
            if (response.data.token) {
                localStorage.setItem('app_token', response.data.token);
            }
            await refresh();

            toast.success("Welcome, Super Admin");
            setLocation("/admin-dashboard");
        } catch (error: any) {
            const message = error.response?.data?.message || "Invalid credentials or access denied";

            if (message.includes('not verified') || message.includes('التحقق')) {
                toast.error("Account not verified. Please verify your email.");
                setLocation(`/verify-email?email=${encodeURIComponent(email.toLowerCase())}&redirect=/admin-dashboard`);
                return;
            }

            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" dir="ltr">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(225,29,72,0.05),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(225,29,72,0.05),transparent_50%)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
            </div>

            <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl relative z-10 overflow-hidden rounded-3xl ring-1 ring-slate-100">
                <div className="h-1.5 bg-gradient-to-r from-primary -primary/80 to-primary"></div>
                <CardHeader className="space-y-2 text-center pb-8 pt-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/10 ring-8 ring-primary/5 shadow-inner rotate-3 transition-transform hover:rotate-6 duration-500">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Wolf Techno Admin</CardTitle>
                    <CardDescription className="text-slate-500 font-medium text-base">Secure Gateway for Administrators</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <Input
                                    type="email"
                                    placeholder="admin@wolf.com"
                                    className="pl-12 h-14 bg-slate-50 border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all rounded-2xl text-base text-slate-900 placeholder:text-slate-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-12 pr-12 h-14 bg-slate-50 border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all rounded-2xl text-base text-slate-900 placeholder:text-slate-400"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Link href="/forgot-password" title="Forgot Password" className="text-xs font-black text-primary hover:opacity-80 transition-opacity">
                                Forgot password?
                            </Link>
                        </div>
                        <Button
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95 mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? "Verifying..." : "Access Dashboard"}
                        </Button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                        <AlertCircle size={14} />
                        <span className="text-[10px] uppercase font-black tracking-widest">Restricted Area</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
