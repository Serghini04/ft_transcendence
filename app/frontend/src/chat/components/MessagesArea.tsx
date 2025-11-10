import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { format, isToday, isSameDay } from "date-fns";

export default function MessagesArea() {
  const { selectedContact, messages } = useChatStore();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  };

  const formatDayLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    return isToday(date) ? "Today" : format(date, "MMMM d");
  };

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);

  const scrollToBottom = (force = false) => {
    if (messageEndRef.current) {
      // For new messages, use instant scroll for better UX
      const behavior = force ? "auto" : "smooth";
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Scroll when selecting a contact
  useEffect(() => {
    if (selectedContact) {
      previousMessageCountRef.current = 0; // Reset counter
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [selectedContact]);

  // Scroll when new messages are added
  useEffect(() => {
    const currentMessageCount = messages.length;
    
    if (currentMessageCount > 0) {
      // Check if this is a new message (count increased)
      const isNewMessage = currentMessageCount > previousMessageCountRef.current;
      previousMessageCountRef.current = currentMessageCount;
      
      if (isNewMessage) {
        console.log("🔽 Auto-scrolling to new message");
        // New message added - scroll immediately
        setTimeout(() => scrollToBottom(true), 50);
      } else {
        console.log("📜 Initial scroll to bottom");
        // Initial load or contact switch - smooth scroll
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [messages]);

  let lastMessageDate: Date | null = null;

  return (
    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 min-h-0">
      {!selectedContact ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <img src="/empty-chat.svg" alt="No chat" className="w-48 mb-4 opacity-70" />
          <p className="text-lg font-outfit">Select a contact to start chatting 💬</p>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-gray-400 text-center mt-20">No messages yet. Say hi 👋</p>
      ) : (
        messages.map((msg) => {
          const currentDate = new Date(msg.timestamp);
          const showDateSeparator =
            !lastMessageDate || !isSameDay(currentDate, lastMessageDate);
          lastMessageDate = currentDate;

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex justify-center">
                  <div className="text-xs text-gray-400 px-3 py-1 rounded-full bg-gray-700/30">
                    {formatDayLabel(msg.timestamp)}
                  </div>
                </div>
              )}
              <div className={`flex ${msg.isSender ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] md:max-w-md lg:max-w-lg px-3 md:px-4 py-2 rounded-2xl ${
                    msg.isSender
                      ? "bg-emerald-500/20 rounded-br-none"
                      : "bg-white/10 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm text-white break-words">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messageEndRef}/>
    </div>
  );
}
