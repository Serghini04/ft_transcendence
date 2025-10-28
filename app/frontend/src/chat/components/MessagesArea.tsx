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

  useEffect(() => {
    if (messageEndRef.current)
        messageEndRef.current.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  let lastMessageDate: Date | null = null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
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
                  className={`max-w-[85%] md:max-w-md px-4 py-2 rounded-2xl ${
                    msg.isSender
                      ? "bg-emerald-500/20 rounded-br-none"
                      : "bg-white/10 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm text-white break-words">{msg.text}</p>
                    <span className="text-xs text-gray-400 block mt-1 text-right">
                      {formatTimestamp(msg.timestamp)}
                    </span>
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
