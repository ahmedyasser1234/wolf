import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AdminRegister() {
    const { language } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { refresh } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await api.post("/auth/register", {
                name,
                email: email.toLowerCase(),
                password,
                role: 'admin'
            });

            if (result.data.requiresVerification) {
                toast.success("Verification code sent to your email");
                setLocation(`/verify-email?email=${encodeURIComponent(email.toLowerCase())}&redirect=/admin-dashboard`);
                return;
            }

            if (result.data.token) {
                localStorage.setItem('app_token', result.data.token);
            }

            await refresh();
            toast.success("Admin account created successfully");
            setLocation("/admin-dashboard");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Admin registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.2),transparent_70%)]"></div>

            <Card className="w-full max-w-md bg-white border-none shadow-2xl relative z-10 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
                <CardHeader className="space-y-1 text-center pb-8 pt-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                        <UserPlus className="w-8 h-8 text-slate-800" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Create Admin Account</CardTitle>
                    <p className="text-sm text-slate-500 font-medium">Register a new administrator with full privileges</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-12 bg-slate-50 border-slate-100 focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all rounded-xl"
                                placeholder="Admin Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                required
                                className="h-12 bg-slate-50 border-slate-100 focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all rounded-xl"
                                placeholder="admin@wolftechno.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-slate-50 border-slate-100 focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all rounded-xl"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register Admin"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-slate-50 pt-6 pb-8">
                    <Link href="/admin/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors underline underline-offset-4">
                        Back to Admin Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
