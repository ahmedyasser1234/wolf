
import { MessageSquare, X, User, ArrowLeft, ArrowRight, Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";

interface ChatHistoryProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChatHistory({ isOpen, onOpenChange }: ChatHistoryProps) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const { openChat } = useChat();
    const { data: conversations, isLoading } = useQuery({
        queryKey: ['chat-conversations-customer'],
        queryFn: () => endpoints.chat.conversations(),
        enabled: isOpen
    });

    const [chatSearch, setChatSearch] = useState("");

    const filteredConversations = conversations?.filter((c: any) =>
        c.counterpartName?.toLowerCase().includes(chatSearch.toLowerCase()) ||
        c.counterpartEmail?.toLowerCase().includes(chatSearch.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(chatSearch.toLowerCase())
    );

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:w-[540px] p-0 flex flex-col" dir="rtl">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-xl font-black flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="text-primary" />
                            {'محادثاتي'}
                        </div>
                        {user?.role !== 'admin' && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full bg-white/5 text-primary hover:bg-white/10"
                                onClick={() => openChat({
                                    recipientId: 1, // Admin ID
                                    name: language === 'ar' ? 'الدعم الفني' : 'Technical Support',
                                    sessionId: 'support'
                                })}
                            >
                                <Plus size={20} />
                            </Button>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="px-6 py-4 border-b bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="ابحث في محادثاتك..."
                            className="pr-10 border-white/10 focus-visible:ring-primary rounded-xl bg-white"
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
                    ) : filteredConversations?.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            {chatSearch ? "لا توجد نتائج تطابق بحثك" : "لا توجد محادثات سابقة"}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredConversations?.map((conv: any) => (
                                <div
                                    key={conv.id}
                                    onClick={() => {
                                        const sessionId = user?.role === 'admin'
                                            ? `customer-${conv.recipientId}`
                                            : `admin`;

                                        openChat({
                                            recipientId: conv.recipientId,
                                            name: conv.counterpartName,
                                            logo: conv.counterpartImage,
                                            sessionId
                                        });
                                        onOpenChange(false);
                                    }}
                                    className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group border-b border-slate-50"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="flex -space-x-4 rtl:space-x-reverse">
                                            <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-400 ring-4 ring-slate-50/50 overflow-hidden shadow-sm">
                                                {conv.counterpartImage ? (
                                                    <img src={conv.counterpartImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                            <div className="w-12 h-12 rounded-full border-2 border-white text-primary flex items-center justify-center font-black text-xs ring-4 bg-white/5 overflow-hidden shadow-sm">
                                                {conv.counterpartName?.substring(0, 1)}
                                            </div>
                                        </div>
                                        <div className="text-right" dir="rtl">
                                            <h4 className="font-black text-slate-900 text-base group-hover:text-primary transition-colors flex items-center gap-2">
                                                {conv.counterpartName}
                                                {conv.unread && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
                                                    {conv.lastMessage || 'بدء محادثة جديدة'}
                                                </p>
                                                <span className="text-[10px] text-slate-300">•</span>
                                                <span className="text-[10px] text-slate-300 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true, locale: ar })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:bg-white group-hover:text-primary/80 transition-all translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                                        <ArrowLeft size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
