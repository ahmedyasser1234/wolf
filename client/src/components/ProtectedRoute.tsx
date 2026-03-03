import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    component: React.ComponentType<any>;
    adminOnly?: boolean;
}

export default function ProtectedRoute({
    component: Component,
    adminOnly = false,
}: ProtectedRouteProps) {
    const { user, loading, isAuthenticated } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                // If accessing an admin route, redirect to admin login
                const loginPath = adminOnly ? "/admin/login" : "/login";
                setLocation(loginPath);
            } else if (adminOnly && user?.role !== "admin") {
                // If logged in as user but trying to access admin dashboard, send back to home
                setLocation("/");
            }
        }
    }, [loading, isAuthenticated, user, adminOnly, setLocation]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated || (adminOnly && user?.role !== "admin")) {
        return null;
    }

    return <Component />;
}
