import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useChat } from '@/contexts/ChatContext';
import { useLanguage } from '@/lib/i18n';

const STORAGE_KEY_ORDERS = 'admin_unread_orders_count';
const STORAGE_KEY_INSTALLMENT_ORDERS = 'admin_unread_installment_orders_count';
const STORAGE_KEY_LAST_SEEN_ORDERS = 'admin_last_seen_orders_at';
const STORAGE_KEY_LAST_SEEN_INSTALLMENT = 'admin_last_seen_installment_orders_at';

function getStoredCount(key: string): number {
    return Number(localStorage.getItem(key) || 0);
}

function setStoredCount(key: string, count: number) {
    localStorage.setItem(key, String(count));
}

export function useOrderNotifications() {
    const { user } = useAuth();
    const { socket } = useChat();
    const queryClient = useQueryClient();
    const { language } = useLanguage();

    const [unreadOrdersCount, setUnreadOrdersCount] = useState(() => getStoredCount(STORAGE_KEY_ORDERS));
    const [unreadInstallmentOrdersCount, setUnreadInstallmentOrdersCount] = useState(() => getStoredCount(STORAGE_KEY_INSTALLMENT_ORDERS));

    const handleNewOrderNotification = useCallback((data: any) => {
        console.log('📦 [useOrderNotifications] Received notification:', data);

        // Determine if it's an installment order
        const isInstallment = data.title?.includes('تقسيط') || data.message?.includes('تقسيط') || data.title?.includes('Installment');

        if (isInstallment) {
            setUnreadInstallmentOrdersCount(prev => {
                const next = prev + 1;
                setStoredCount(STORAGE_KEY_INSTALLMENT_ORDERS, next);
                return next;
            });
        } else {
            setUnreadOrdersCount(prev => {
                const next = prev + 1;
                setStoredCount(STORAGE_KEY_ORDERS, next);
                return next;
            });
        }

        // Invalidate order queries so the table updates
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'installment-orders'] });

        // Show real-time toast with action button
        const tabTarget = isInstallment ? 'installment-orders' : 'orders';
        toast.message(data.title || (language === 'ar' ? '🛒 طلب جديد' : '🛒 New Order'), {
            description: data.message || '',
            duration: 6000,
            action: {
                label: language === 'ar' ? '👁 عرض' : '👁 View',
                onClick: () => {
                    // Navigate to the correct dashboard tab
                    const currentParams = new URLSearchParams(window.location.search);
                    currentParams.set('tab', tabTarget);
                    window.history.replaceState(null, '', window.location.pathname + '?' + currentParams.toString());
                    // Dispatch a custom event so AdminDashboard picks it up
                    window.dispatchEvent(new CustomEvent('admin-navigate-tab', { detail: { tab: tabTarget } }));
                }
            }
        });
    }, [queryClient, language]);

    useEffect(() => {
        if (!socket || !user || user.role !== 'admin') return;

        const handleNotification = (data: any) => {
            if (data.type === 'new_order') {
                handleNewOrderNotification(data);
            }
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, user, handleNewOrderNotification]);

    const resetOrdersCount = useCallback(() => {
        setUnreadOrdersCount(0);
        setStoredCount(STORAGE_KEY_ORDERS, 0);
        localStorage.setItem(STORAGE_KEY_LAST_SEEN_ORDERS, Date.now().toString());
    }, []);

    const resetInstallmentOrdersCount = useCallback(() => {
        setUnreadInstallmentOrdersCount(0);
        setStoredCount(STORAGE_KEY_INSTALLMENT_ORDERS, 0);
        localStorage.setItem(STORAGE_KEY_LAST_SEEN_INSTALLMENT, Date.now().toString());
    }, []);

    return {
        unreadOrdersCount,
        unreadInstallmentOrdersCount,
        resetOrdersCount,
        resetInstallmentOrdersCount,
    };
}
