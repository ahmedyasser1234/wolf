import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export interface ChatSession {
    sessionId: string;
    recipientId: number;
    name: string;
    logo?: string;
    isMinimized?: boolean;
}

interface ChatContextType {
    openChats: ChatSession[];
    openChat: (session: Omit<ChatSession, 'sessionId'> & { sessionId?: string }) => void;
    closeChat: (sessionId: string) => void;
    minimizeChat: (sessionId: string) => void;
    isChatHistoryOpen: boolean;
    setIsChatHistoryOpen: (open: boolean) => void;
    socket: Socket | null;
    isUserOnline: (userId: number) => boolean;
    checkOnlineStatus: (userId: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user, token } = useAuth();
    const [openChats, setOpenChats] = useState<ChatSession[]>([]);
    const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const queryClient = useQueryClient(); // Requires import

    // Initialize Global Socket
    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        if (socket) {
            // If socket exists but token doesn't match, we might need to reconnect 
            // or we can just let it be if it's already working (though unlikely if cookies are blocked).
            // But for now, if we have a socket but we just got a token, we should probably recreate it.
            // Check if socket already has this token in its auth
            const currentToken = (socket as any).auth?.token;
            if (token && currentToken !== token) {
                console.log('🔌 Debug: Token changed or acquired, reconnecting socket...');
                socket.disconnect();
                // We'll set it to null and let the next block handle reconnection immediately
                setSocket(null);
                return;
            }
        }

        if (!socket) {
            // Use environment variable for socket URL
            // CRITICAL: This MUST be a secure URL (wss:// or https://) in production to avoid Mixed Content errors.
            const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

            if (!import.meta.env.VITE_SOCKET_URL && window.location.hostname.includes('netlify.app')) {
                console.error("VITE_SOCKET_URL is missing! You must set this to your secure backend URL (e.g. https://api.yourdomain.com) in Netlify.");
            }

            console.log('🔌 Debug: Initializing socket connection...');
            console.log('🔌 Debug: Using Socket URL:', socketUrl);
            console.log('🔌 Debug: Token acquired from auth state:', !!token);

            // Append /chat namespace manually if the library doesn't handle it automatically with the full URL
            const newSocket = io(`${socketUrl}/chat`, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                auth: { token } // Pass token for cross-site auth fallback
            });

            newSocket.on('connect', () => {
                console.log('✅ Debug: Socket connected successfully! ID:', newSocket.id);
                // Join user room for notifications
                newSocket.emit('join', String(user.id));
            });

            newSocket.on('connect_error', (err) => {
                console.error('❌ Debug: Socket connection error:', err.message);
                console.error('❌ Debug: Full error details:', err);
            });

            newSocket.on('userStatus', ({ userId, status }: { userId: number, status: 'online' | 'offline' }) => {
                console.log(`👤 Debug: User ${userId} is now ${status}`);
                setOnlineUsers(prev => {
                    const next = new Set(prev);
                    if (status === 'online') {
                        next.add(userId);
                    } else {
                        next.delete(userId);
                    }
                    return next;
                });
            });

            newSocket.on('receiveMessage', (msg) => {
                console.log('📩 Debug: Received new message:', msg);
                // Invalidate conversation lists to update snippets and unread counts
                queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
                queryClient.invalidateQueries({ queryKey: ['chat-conversations-customer'] });
                queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
            });

            // Handle General Notifications (Moved from useSocket.ts)
            newSocket.on('notification', (data: any) => {
                console.log('🔔 Debug: Notification received:', data);
                // Show toast (requires toast import, verify if imported)
                // We'll trust sonner is available or import it.
                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

                if (data.type === 'new_order' || data.type === 'order_created' || data.type === 'order_status') {
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                    queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
                }
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Debug: Disconnecting socket...');
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [user, token, queryClient]);

    const isUserOnline = useCallback((userId: number) => {
        return onlineUsers.has(userId);
    }, [onlineUsers]);

    const openChat = useCallback((session: Omit<ChatSession, 'sessionId'> & { sessionId?: string }) => {
        const id = session.sessionId || `chat-${session.recipientId}`;
        const newSession = { ...session, sessionId: id };

        setOpenChats(prev => {
            const existing = prev.find(c => c.sessionId === id);
            if (existing) {
                if (existing.isMinimized) {
                    return prev.map(c => c.sessionId === id ? { ...c, isMinimized: false } : c);
                }
                return prev;
            }
            return [...prev, { ...newSession, isMinimized: false }];
        });
    }, []);

    const closeChat = useCallback((sessionId: string) => {
        setOpenChats(prev => prev.filter(c => c.sessionId !== sessionId));
    }, []);

    const minimizeChat = useCallback((sessionId: string) => {
        setOpenChats(prev => prev.map(c =>
            c.sessionId === sessionId ? { ...c, isMinimized: !c.isMinimized } : c
        ));
    }, []);

    const checkOnlineStatus = useCallback((userId: number) => {
        if (!socket) return;
        socket.emit('checkUserStatus', userId, (response: { userId: number, status: 'online' | 'offline' }) => {
            if (response && response.status === 'online') {
                setOnlineUsers(prev => new Set(prev).add(userId));
            } else {
                setOnlineUsers(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            }
        });
    }, [socket]);

    const value = React.useMemo(() => ({
        openChats,
        openChat,
        closeChat,
        minimizeChat,
        isChatHistoryOpen,
        setIsChatHistoryOpen,
        socket,
        isUserOnline,
        checkOnlineStatus
    }), [openChats, openChat, closeChat, minimizeChat, isChatHistoryOpen, socket, isUserOnline, checkOnlineStatus]);

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
