import { useState, useEffect, useRef, useMemo } from "react";
import { MessageSquare, Send, Search, User, AlertCircle, Check, Zap, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import api, { endpoints } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";


interface Conversation {
    id: number;
    counterpartName: string;
    counterpartImage?: string;
    lastMessage?: string;
    lastMessageTime: string;
    unread: boolean;
    recipientId?: number; // Added
}

interface Message {
    id: number;
    conversationId: number; // Added
    content: string;
    senderRole: 'customer' | 'vendor';
    createdAt: string;
    isRead: boolean;
}

export default function MessagesTab() {
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const queryClient = useQueryClient();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Conversations
    const { data: conversations, refetch: refetchConversations } = useQuery({
        queryKey: ['vendor-conversations'],
        queryFn: () => endpoints.chat.conversations(),
    });

    const filteredConversations = useMemo(() => {
        return conversations?.filter((conv: any) =>
            conv.counterpartName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [conversations, searchTerm]);

    // Socket Connection
    useEffect(() => {
        if (!user) return;
        const isProd = import.meta.env.PROD;
        const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:3001');
        const newSocket = io(`${socketUrl}/chat`, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on("connect", () => {
            // console.log("Vendor Chat Connected");
        });

        newSocket.on("receiveMessage", (message: Message) => {
            setMessages((prev) => {
                if (selectedConversation && message.conversationId === selectedConversation.id) {
                    // Mark as read immediately if chat is open
                    newSocket.emit('markAsRead', {
                        conversationId: selectedConversation.id,
                        recipientId: selectedConversation.recipientId
                    });
                    return [...prev, message];
                }
                return prev;
            });
            refetchConversations();
        });

        newSocket.on("userStatus", ({ userId, status }: { userId: number, status: 'online' | 'offline' }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (status === 'online') next.add(userId);
                else next.delete(userId);
                return next;
            });
        });

        newSocket.on("messagesRead", ({ conversationId }: { conversationId: number }) => {
            if (selectedConversation && conversationId === selectedConversation.id) {
                setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user, selectedConversation, refetchConversations]);

    // Fetch Messages when conversation selected
    useEffect(() => {
        if (selectedConversation) {
            endpoints.chat.getMessages(selectedConversation.id).then(setMessages);

            // Mark as read via HTTP
            endpoints.chat.markRead(selectedConversation.id).then(() => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'unread'] });
                queryClient.invalidateQueries({ queryKey: ['vendor-conversations'] });
            });

            // Mark as read via Socket (to notify counterparty)
            if (socket && selectedConversation.recipientId) {
                socket.emit('markAsRead', {
                    conversationId: selectedConversation.id,
                    recipientId: selectedConversation.recipientId
                });

                // Initial status check
                if (selectedConversation.recipientId) {
                    socket.emit('checkUserStatus', selectedConversation.recipientId, (res: any) => {
                        const recId = selectedConversation.recipientId;
                        if (res?.status === 'online' && recId) {
                            setOnlineUsers(prev => new Set(prev).add(recId));
                        }
                    });
                }
            }
        }
    }, [selectedConversation, queryClient, socket]);

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, selectedConversation]);

    const handleSend = () => {
        if (!inputValue.trim() || !selectedConversation || !socket) {
            console.error('❌ Debug: cannot send. Missing info.', {
                input: !!inputValue.trim(),
                conv: !!selectedConversation,
                socket: !!socket
            });
            return;
        }

        console.log("📤 Debug: Sending message to:", selectedConversation.recipientId);
        const payload = {
            conversationId: selectedConversation.id,
            content: inputValue,
            recipientId: selectedConversation.recipientId
        };
        console.log("📤 Debug: Payload:", payload);

        socket.emit("sendMessage", payload, (response: any) => {
            console.log('✅ Debug: sendMessage Ack/Response:', response);
            if (response && response.id) {
                setMessages(prev => [...prev, response]);
            } else {
                console.error("❌ Debug: Message send failed/No ACK:", response);
                toast.error(t('messageFailed'));
            }
        });

        setInputValue("");
    };

    return (
        <div className="relative flex flex-col md:flex-row h-[calc(100dvh-120px)] md:h-[calc(100vh-200px)] w-full border-0 md:rounded-2xl overflow-hidden bg-background border border-gray-800" dir={language === 'ar' ? "rtl" : "ltr"}>
            {/* Sidebar List */}
            <div className={cn(
                "w-full md:w-1/3 border-b md:border-b-0 md:border-l md:rtl:border-l-0 md:rtl:border-r border-gray-800 bg-gray-900/50 flex flex-col transition-all duration-300 absolute inset-0 md:relative z-10",
                selectedConversation ? '-translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'translate-x-0 opacity-100'
            )}>
                <div className="p-4 border-b border-gray-800 bg-background sticky top-0 z-20">
                    <h3 className={`font-black text-xl text-white mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('conversations')}</h3>
                    <div className="relative">
                        <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-white`} />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            className={`bg-gray-900 border-gray-800 h-11 ${language === 'ar' ? 'pr-10' : 'pl-10'} rounded-2xl focus-visible:ring-1 focus-visible:ring-primary`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-2">
                    <div className="py-2 space-y-1.5">
                        {filteredConversations?.map((conv: any) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={cn(
                                    "p-4 rounded-2xl cursor-pointer flex items-center gap-4 transition-all duration-200 group relative",
                                    selectedConversation?.id === conv.id
                                        ? 'bg-gray-800 shadow-md border border-gray-700 ring-1 ring-primary/10'
                                        : 'hover:bg-gray-800/60 border border-transparent hover:shadow-sm'
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-14 w-14 border-2 border-gray-800 shadow-sm transition-transform group-hover:scale-105">
                                        <AvatarImage src={conv.counterpartImage} />
                                        <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-700 text-gray-500">
                                            <User className="h-6 w-6" />
                                        </AvatarFallback>
                                    </Avatar>
                                    {onlineUsers.has(conv.recipientId) && (
                                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border-2 border-gray-800 rounded-full shadow-sm ring-2 ring-gray-800"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <h4 className={cn("text-base truncate transition-colors", selectedConversation?.id === conv.id ? "font-black text-white" : "font-bold text-white")}>
                                            {conv.counterpartName}
                                        </h4>
                                        <span className="text-xs text-white font-medium whitespace-nowrap">
                                            {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true, locale: language === 'ar' ? ar : undefined })}
                                        </span>
                                    </div>
                                    <p className={cn("text-sm truncate leading-relaxed", conv.unread ? "text-primary font-bold" : "text-white font-medium")}>
                                        {conv.lastMessage || t('startNewChat')}
                                    </p>
                                </div>
                                {conv.unread && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 bg-primary rounded-full shadow-lg shadow-primary/30 animate-pulse" />
                                )}
                            </div>
                        ))}
                        {filteredConversations?.length === 0 && searchTerm && (
                            <div className="p-8 text-center text-white text-sm">
                                {t('noConversations')}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-gray-900 absolute inset-0 md:relative z-20 transition-all duration-300",
                selectedConversation ? 'translate-x-0 opacity-100' : 'translate-x-full md:translate-x-0 rtl:-translate-x-full rtl:md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
            )}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 py-3 md:p-5 border-b border-gray-800 flex items-center justify-between bg-background/90 backdrop-blur-md z-30 sticky top-0 shadow-sm">
                            <div className="flex items-center gap-3 md:gap-4">
                                {/* Mobile Back Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden -ml-2 rtl:-mr-2 text-white hover:text-white rounded-full hover:bg-gray-800"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    {language === 'ar' ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
                                </Button>

                                <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-gray-800 shadow-sm">
                                    <AvatarImage src={selectedConversation.counterpartImage} />
                                    <AvatarFallback><User className="h-5 w-5 md:h-6 md:w-6" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-black text-base md:text-lg text-white">{selectedConversation.counterpartName}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "h-2 w-2 rounded-full",
                                            selectedConversation.recipientId && onlineUsers.has(selectedConversation.recipientId) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                                        )} />
                                        <span className={cn(
                                            "text-xs font-bold",
                                            selectedConversation.recipientId && onlineUsers.has(selectedConversation.recipientId) ? 'text-emerald-500' : 'text-white'
                                        )}>
                                            {selectedConversation.recipientId && onlineUsers.has(selectedConversation.recipientId) ? t('online') : t('offline')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages List - Fixed scroll container */}
                        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 space-y-4 bg-gray-900 scroll-smooth" ref={scrollRef}>
                            {messages
                                .filter(m => m.conversationId === selectedConversation.id)
                                .map((msg, index, arr) => {
                                    const isMe = msg.senderRole === 'vendor';
                                    const nextMsg = arr[index + 1];
                                    const isLastInGroup = !nextMsg || nextMsg.senderRole !== msg.senderRole;

                                    return (
                                        <div key={msg.id} className={cn("flex flex-col mb-1 w-full", isMe ? 'items-end' : 'items-start')}>
                                            <div className={cn(
                                                "max-w-[85%] md:max-w-[70%] px-5 py-3 text-[15px] md:text-base shadow-sm transition-all animate-in fade-in slide-in-from-bottom-1 break-words leading-relaxed",
                                                isMe
                                                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                                                    : 'bg-white text-slate-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                                            )}>
                                                {msg.content}
                                            </div>
                                            {isLastInGroup && (
                                                <div className={cn("flex items-center gap-1.5 mt-1 px-1", isMe ? 'flex-row-reverse' : 'flex-row')}>
                                                    <span className="text-[10px] uppercase font-bold text-white tracking-wider">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMe && (
                                                        <span className={msg.isRead ? 'text-emerald-500' : 'text-gray-700'}>
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Input Area - Sticky Bottom */}
                        <div className="p-3 md:p-5 bg-background border-t border-gray-800 sticky bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
                            <div className="flex gap-2 items-center bg-gray-900 p-2 pr-2 pl-2 rounded-3xl border border-gray-800 focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={t('writeReply')}
                                    className="border-0 bg-transparent h-12 text-base focus-visible:ring-0 placeholder:text-white font-medium px-4 w-full"
                                />
                                <Button
                                    onClick={handleSend}
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 h-10 w-10 rounded-full shadow-lg shadow-primary/20 shrink-0 transition-transform active:scale-95 m-1"
                                >
                                    <Send className={`h-4 w-4 ${language === 'ar' ? 'rtl:rotate-180' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-900/50 p-12 text-center h-full">
                        <div className="relative mb-8">
                            <div className="h-28 w-28 bg-gray-800 rounded-[2rem] shadow-xl flex items-center justify-center rotate-3 transition-transform hover:rotate-6">
                                <MessageSquare className="h-12 w-12 text-primary/80" />
                            </div>
                            <div className="absolute -bottom-3 -right-3 h-12 w-12 bg-primary rounded-2xl shadow-lg ring-4 ring-gray-900 flex items-center justify-center -rotate-6">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3">{t('startChat')}</h3>
                        <p className="text-white text-base max-w-[300px] leading-relaxed">{t('selectChat')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
