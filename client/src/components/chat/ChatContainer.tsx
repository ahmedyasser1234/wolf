
import { useChat } from "@/contexts/ChatContext";
import { ChatWidget } from "./ChatWidget";

export function ChatContainer() {
    const { openChats, closeChat, minimizeChat } = useChat();

    // Limit to 3 visible chats + minimized ones? 
    // For now, let's just render them. CSS flex will handle overflow if needed or we limit in context.
    const visibleChats = openChats.slice(-3); // Show last 3 active chats? 
    // Actually, Facebook allows many minimized. 
    // Let's render all but manage layout.

    return (
        <div className="fixed bottom-0 right-0 sm:right-20 z-[100] flex flex-col sm:flex-row items-center sm:items-end gap-2 sm:gap-4 pointer-events-none w-full sm:w-auto p-4 sm:p-0">
            {/* Right padding 20 (approx 5rem) to avoid overlapping the floating History button */}
            {openChats.map((chat) => (
                <div key={chat.sessionId} className="pointer-events-auto">
                    <ChatWidget
                        recipientId={chat.recipientId}
                        name={chat.name}
                        logo={chat.logo}
                        isMinimized={chat.isMinimized}
                        onClose={() => closeChat(chat.sessionId)}
                        onMinimize={() => minimizeChat(chat.sessionId)}
                    />
                </div>
            ))}
        </div>
    );
}
