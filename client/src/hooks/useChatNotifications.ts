import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { useChat } from '@/contexts/ChatContext';

export function useChatNotifications() {
    const { user } = useAuth();
    const { socket } = useChat();
    const queryClient = useQueryClient();
    const [location] = useLocation();

    // Fetch initial unread count
    const { data: unreadData, refetch } = useQuery({
        queryKey: ['chat', 'unread-count'],
        queryFn: endpoints.chat.unreadCount,
        enabled: !!user && !!user?.id,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 30, // 30 seconds
        retry: false, // Do not retry on failure (avoids 401 loop)
    });

    const unreadCount = unreadData?.count || 0;

    useEffect(() => {
        if (!socket || !user) return;

        const handleReceiveMessage = (message: any) => {
            console.log('Notification receivedMessage:', message);

            if (message.senderId !== user.id) {
                // Play notification sound (optional)

                // Display Toast
                toast.message(message.senderName || 'رسالة جديدة', {
                    description: `${message.content?.substring(0, 50)}${message.content?.length > 50 ? '...' : ''}`,
                });

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
                queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
                queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] });
            }
        };

        const handleMessagesRead = () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
        };

        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('messagesRead', handleMessagesRead);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('messagesRead', handleMessagesRead);
        };
    }, [socket, user, queryClient]);


    return { unreadCount };
}
