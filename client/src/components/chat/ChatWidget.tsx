
import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { endpoints } from "@/lib/api";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useChat } from "@/contexts/ChatContext";
import { useLanguage } from "@/lib/i18n";

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    senderRole: 'customer' | 'vendor' | 'admin';
    createdAt: string;
    isRead: boolean;
    status: 'sent' | 'delivered' | 'read';
}

interface ChatWidgetProps {
    recipientId?: number; // The counterparty's UserID for presence hooks
    name: string;
    logo?: string;
    isMinimized?: boolean;
    onClose?: () => void;
    onMinimize?: () => void;
}

export function ChatWidget({ recipientId: explicitRecipientId, name, logo, isMinimized, onClose, onMinimize }: ChatWidgetProps) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const queryClient = useQueryClient();
    const { socket, isUserOnline, checkOnlineStatus } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [conversationId, setConversationId] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Refs for socket listeners to avoid closure bugs
    const conversationIdRef = useRef<number | null>(null);

    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    // The ID we use for real-time presence (must be a UserID)
    const presenceUserId = explicitRecipientId || 0;
    const isRecipientOnline = isUserOnline(presenceUserId);

    // Helper to mark read
    const markAsRead = () => {
        if (conversationId) {
            // Signal to backend (persistent)
            console.log(`ChatWidget: Started new conversation for Admin`);
            endpoints.chat.markRead(conversationId).then(() => {
                console.log(`ChatWidget: Marked ${conversationId} as read successfully`);
                queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
            }).catch(err => {
                console.error(`ChatWidget: Failed to mark ${conversationId} as read`, err);
            });

            // Signal to socket (real-time, requires recipient)
            if (presenceUserId) {
                socket?.emit('markAsRead', {
                    conversationId,
                    recipientId: presenceUserId
                });
            }
        }
    };

    // Socket Listeners
    useEffect(() => {
        if (!socket || !user) return;

        const handleReceiveMessage = (message: Message) => {
            // If message belongs to this conversation
            if (message.conversationId === conversationIdRef.current) {
                setMessages((prev) => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });

                // Ack delivery if widget is open
                if (!isMinimized) {
                    socket.emit('messageDelivered', {
                        messageId: message.id,
                        recipientId: message.senderId,
                        conversationId: message.conversationId
                    });
                }
            } else if (conversationIdRef.current === null) {
                if (message.senderId === presenceUserId) {
                    setMessages((prev) => [...prev, message]);
                    if (message.conversationId) {
                        setConversationId(message.conversationId);
                    }
                    if (!isMinimized) {
                        socket.emit('messageDelivered', {
                            messageId: message.id,
                            recipientId: message.senderId,
                            conversationId: message.conversationId
                        });
                    }
                }
            }
        };

        const handleMessagesRead = ({ conversationId: readConvId }: { conversationId: number }) => {
            if (readConvId === conversationIdRef.current) {
                setMessages(prev => prev.map(m => ({ ...m, isRead: true, status: 'read' as const })));
            }
        };

        const handleStatusUpdate = (payload: { messageId: number, status: 'sent' | 'delivered' | 'read', conversationId: number }) => {
            if (payload.conversationId === conversationIdRef.current) {
                setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, status: payload.status } : m));
            }
        };

        const handleUserTyping = (payload: { conversationId: number, userId: number, isTyping: boolean }) => {
            if (payload.conversationId === conversationIdRef.current && payload.userId === presenceUserId) {
                setCounterpartIsTyping(payload.isTyping);
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("messagesRead", handleMessagesRead);
        socket.on("messageStatusUpdate", handleStatusUpdate);
        socket.on("userTyping", handleUserTyping);

        // Initial check is done via global presence state in context
        if (presenceUserId) {
            checkOnlineStatus(presenceUserId);
        }

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("messagesRead", handleMessagesRead);
            socket.off("messageStatusUpdate", handleStatusUpdate);
            socket.off("userTyping", handleUserTyping);
        };
    }, [socket, user, presenceUserId, checkOnlineStatus, isMinimized]);

    // Fetch conversations and history
    const { data: conversations } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: () => endpoints.chat.conversations(),
    });

    useEffect(() => {
        if (conversations && explicitRecipientId) {
            console.log(`ChatWidget: Check existing conversation for Admin`);
            const existing = conversations.find((c: any) => {
                return c.recipientId === presenceUserId;
            });

            if (existing) {
                setConversationId(existing.id);
                endpoints.chat.getMessages(existing.id).then(setMessages);
            } else {
                setConversationId(null);
                setMessages([]);
            }
        }
    }, [conversations, explicitRecipientId, presenceUserId]);

    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [counterpartIsTyping, setCounterpartIsTyping] = useState(false);

    const handleTyping = () => {
        if (!socket || !conversationId) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', { conversationId, recipientId: presenceUserId, isTyping: true });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('typing', { conversationId, recipientId: presenceUserId, isTyping: false });
        }, 3000);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        console.log('📤 Debug: handleSend triggered');
        const content = inputValue;
        setInputValue("");

        // Stop typing immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
        socket?.emit('typing', { conversationId, recipientId: presenceUserId, isTyping: false });

        // Optimistic UI Update
        const tempId = Date.now();
        const tempMsg: Message = {
            id: tempId,
            conversationId: conversationId || 0,
            senderId: user?.id || 0,
            content,
            senderRole: user?.role as any,
            createdAt: new Date().toISOString(),
            isRead: false,
            status: 'sent'
        };

        setMessages((prev) => [...prev, tempMsg]);

        if (socket && socket.connected) {
            console.log('📤 Debug: Emit sendMessage', {
                conversationId: conversationIdRef.current,
                recipientId: presenceUserId,
                content,
            });
            socket.emit("sendMessage", {
                conversationId: conversationIdRef.current,
                recipientId: presenceUserId,
                content,
            }, (response: { message: Message, conversationId: number }) => {
                console.log('✅ Debug: sendMessage Ack/Response:', response);
                if (response && response.message) {
                    setMessages((prev) => {
                        // Replace temp message with actual message from server
                        return prev.map(m => m.id === tempId ? response.message : m);
                    });
                    if (!conversationIdRef.current && response.conversationId) {
                        setConversationId(response.conversationId);
                    }
                } else {
                    console.error('❌ Debug: sendMessage Ack returned no message!', response);
                    // Optionally mark temp message as failed
                }
            });
        } else {
            console.warn('⚠️ Debug: Socket is null or disconnected, using API fallback');
            try {
                const response = await endpoints.chat.sendMessage({
                    conversationId: conversationIdRef.current || undefined,
                    content,
                    userId: explicitRecipientId // If admin is sending to customer
                });

                console.log('✅ Debug: sendMessage API Response:', response);
                if (response && response.message) {
                    setMessages((prev) => {
                        return prev.map(m => m.id === tempId ? response.message : m);
                    });
                    if (!conversationIdRef.current && response.conversationId) {
                        setConversationId(response.conversationId);
                    }
                }
            } catch (err) {
                console.error('❌ Debug: API fallback failed', err);
            }
        }
    };

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isMinimized]);

    // Mark as read automatically when window is open and messages exist
    useEffect(() => {
        if (!isMinimized && conversationId && user && messages.some(m => !m.isRead && m.senderId !== user.id)) {
            markAsRead();
        }
    }, [isMinimized, conversationId, messages, user]);

    // Mark as read on focus (additional safety)
    const handleFocus = () => {
        if (!isMinimized) {
            markAsRead();
        }
    };

    if (!user) return null;

    if (isMinimized) {
        return (
            <div className="w-[85vw] sm:w-64 bg-white rounded-t-lg shadow-lg border border-gray-200 flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onMinimize}>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Avatar className="w-8 h-8 border border-gray-100">
                            <AvatarImage src={logo} />
                            <AvatarFallback className="bg-primary text-white font-bold">{name[0]}</AvatarFallback>
                        </Avatar>
                        {isRecipientOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                    </div>
                    <h3 className="font-bold text-sm leading-tight">{name}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[95vw] sm:w-80 h-[70vh] sm:h-[500px] bg-white rounded-t-2xl shadow-2xl flex flex-col border border-gray-100 ring-1 ring-black/5 animate-in slide-in-from-bottom-10 duration-200 relative mb-4 sm:mb-0">
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between bg-primary text-white rounded-t-2xl shadow-sm cursor-pointer"
                onClick={onMinimize}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-primary/10">
                            <AvatarImage src={logo} />
                            <AvatarFallback className="bg-primary/5 text-primary font-black">
                                {name?.substring(0, 1) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 leading-none mb-1">
                                {name}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {counterpartIsTyping ? (
                                    <span className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-wider">
                                        {language === 'ar' ? 'يكتب الآن...' : 'Typing...'}
                                    </span>
                                ) : (
                                    <>
                                        <span className={`w-2 h-2 rounded-full ${isRecipientOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {isRecipientOnline ? (language === 'ar' ? 'متصل الآن' : 'Online Now') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}>
                        <Minimize2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20 rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 bg-[#f8f9fa] scrollbar-thin scrollbar-thumb-gray-200" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                        <MessageSquare className="w-12 h-12 stroke-1" />
                        <p className="text-sm">ابدأ المحادثة الآن</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = Number(msg.senderId) === Number(user?.id);
                        return (
                            <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group ${isMe
                                    ? "bg-primary text-slate-950 rounded-br-none"
                                    : "bg-white text-slate-950 border border-gray-100 rounded-bl-none"
                                    }`}>
                                    <p className="leading-relaxed font-bold">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 flex items-center justify-between gap-2 ${isMe ? "text-slate-900/80" : "text-gray-500"}`}>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMe && (
                                            <div className="flex items-center">
                                                {msg.status === 'read' ? (
                                                    <span className="text-blue-200 flex -space-x-1.5">
                                                        <span className="inline-block transform translate-x-0.5">✓</span>
                                                        <span className="inline-block">✓</span>
                                                    </span>
                                                ) : msg.status === 'delivered' ? (
                                                    <span className="text-white/60 flex -space-x-1.5">
                                                        <span className="inline-block transform translate-x-0.5">✓</span>
                                                        <span className="inline-block">✓</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-white/60">✓</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 backdrop-blur-sm absolute bottom-0 w-full rounded-b-2xl">
                <div className="relative shadow-lg rounded-full bg-white ring-1 ring-gray-100 flex items-center p-1 pl-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                            markAsRead(); // Mark read when typing
                        }}
                        onFocus={markAsRead} // Mark read when focused
                        placeholder="اكتب..."
                        className="flex-1 h-10 border-none shadow-none focus-visible:ring-0 bg-transparent text-sm px-4 text-slate-900 font-medium"
                    />
                    <Button
                        size="icon"
                        className={`h-9 w-9 rounded-full transition-all duration-300 ${inputValue.trim() ? 'bg-primary hover:bg-primary/90 scale-100' : 'bg-gray-200 text-gray-400 scale-90'}`}
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
