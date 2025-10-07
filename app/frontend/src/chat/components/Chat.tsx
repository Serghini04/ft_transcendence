import { MessageSquareMore, CircleEllipsis, Send, Mic } from "lucide-react";

export default function Chat() {
  const mockChats = Array(6).fill(null).map((_, i) => ({
    id: i,
    name: "Mehdi Serghini",
    status: "Typing...",
    time: "5m",
    avatar: "/user.png"
  }));

  const mockMessages = [
    { id: 1, text: "Wach akhay hani?", sent: false },
    { 
      id: 2, 
      text: "It is a long established fact that a reader will be distracted by the readable.", 
      sent: true, 
      time: "13:32 PM" 
    }
  ];

  return (
    <div className="fixed bg-[rgba(15,26,36,0.5)] mt-30 ml-30 border-l-2 border-t-2 rounded-tl-4xl border-[#27445E] inset-0 flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-96 flex flex-col border-r-2 border-[#27445E]">
        {/* Header */}
        <div className="flex h-25 items-center justify-center gap-5 px-6 py-5 border-b-2 border-[#27445E] shrink-0">
          <MessageSquareMore  size={26} />
          <h2 className="text-[25px] font-medium text-white tracking-[0.07em] font-outfit">Messages</h2>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                  MS
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[rgba(13,34,52,0.75)]"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{chat.name}</p>
                <span className="text-sm text-gray-400 truncate block">{chat.status}</span>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{chat.time}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT CHAT AREA */}
      <section className="flex-1 flex flex-col bg-[rgba(10,20,30,0.7)] backdrop-blur-lg">
        {/* Chat Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-emerald-500">
                MS
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[rgba(10,20,30,0.7)]"></span>
            </div>
            <div>
              <p className="font-semibold text-white">Mehdi Serghini</p>
              <span className="text-sm text-emerald-400">Online</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <CircleEllipsis size={24} />
          </button>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md px-4 py-2 rounded-2xl ${
                msg.sent 
                  ? 'bg-emerald-500/20 rounded-br-none' 
                  : 'bg-white/10 rounded-bl-none'
              }`}>
                <p className="text-sm text-white">{msg.text}</p>
                {msg.time && (
                  <span className="text-xs text-gray-400 block mt-1 text-right">
                    {msg.time}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-white/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-gray-400"
          />
          <button 
            className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors"
            aria-label="Send message"
          >
            <Send size={20} className="text-white" />
          </button>
          <button 
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Voice message"
          >
            <Mic size={20} className="text-white" />
          </button>
        </div>
      </section>
    </div>
  );
}