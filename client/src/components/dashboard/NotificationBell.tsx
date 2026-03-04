import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
    const { language } = useLanguage();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Socket Connection for Real-time Notifications
    useEffect(() => {
        if (!user) return;

        // Use environment variable for socket URL
        const isProd = import.meta.env.PROD;
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:3001');
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('Notification Socket Connected');
            newSocket.emit('join', user.id);
        });

        newSocket.on('notification', (data: any) => {
            console.log('Notification received:', data);

            // Play sound
            const audio = new Audio('/notification.mp3'); // Ensure this file exists or remove
            audio.play().catch(e => console.log('Audio play failed', e));

            // Show Toast
            toast.message(language === 'ar' ? data.title : data.title, {
                description: language === 'ar' ? data.message : data.message,
                action: {
                    label: language === 'ar' ? "عرض" : "View",
                    onClick: () => setIsOpen(true)
                }
            });

            // Invalidate Queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });

            // If it's a new order, invalidate orders query too
            if (data.type === 'new_order') {
                queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
                queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] });
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, queryClient, language]);

    // Fetch Notifications
    const { data: notificationsData } = useQuery({
        queryKey: ['notifications'],
        queryFn: endpoints.notifications.list,
        enabled: !!user,
        refetchInterval: 60000, // Fallback polling
    });

    const { data: unreadData } = useQuery({
        queryKey: ['notifications', 'unread'],
        queryFn: endpoints.notifications.getUnreadCount,
        enabled: !!user,
        refetchInterval: 60000,
    });

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: endpoints.notifications.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: endpoints.notifications.markAllAsRead,
        onSuccess: () => {
            toast.success(language === 'ar' ? "تم تحديد الكل كمقروء" : "All marked as read");
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        }
    });

    const notifications = notificationsData || [];
    const unreadCount = unreadData?.count || 0;

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markReadMutation.mutate(notification.id);
        }
        // Navigate if needed (e.g. to order details)
        // For now, we just mark as read
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100">
                    <Bell className={cn("w-6 h-6 text-slate-600 transition-all", unreadCount > 0 ? "animate-tada" : "")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-[24px] p-0 border-0 shadow-xl bg-white/90 backdrop-blur-xl">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">{language === 'ar' ? "الإشعارات" : "Notifications"}</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 px-2 rounded-lg"
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            <Check className="w-3 h-3 mr-1" />
                            {language === 'ar' ? "تحديد الكل كمقروء" : "Mark all read"}
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                            <Bell className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-bold text-sm">{language === 'ar' ? "لا توجد إشعارات حالياً" : "No notifications yet"}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notifications.map((notification: any) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-slate-50 transition-colors cursor-pointer relative",
                                        !notification.isRead ? "bg-purple-50/30" : ""
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {!notification.isRead && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full" />
                                    )}
                                    <h4 className={cn("text-sm font-black mb-1", !notification.isRead ? "text-purple-900" : "text-slate-700")}>
                                        {notification.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-bold mb-2 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    <span className="text-[10px] font-black text-slate-300">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: language === 'ar' ? ar : undefined })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-[24px]">
                    <Button variant="ghost" className="w-full h-8 text-xs font-black text-slate-400 hover:text-slate-600 rounded-xl">
                        {language === 'ar' ? "عرض كل الإشعارات" : "View all notifications"}
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
