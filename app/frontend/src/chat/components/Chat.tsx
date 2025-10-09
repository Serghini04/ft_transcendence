import { MessageSquareMore, CircleEllipsis, Send, Menu, X, CircleX } from "lucide-react";
import { useState } from "react";

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock data (replace with API data in production)
  const mockChats = Array(6)
    .fill(null)
    .map((_, i) => ({
      id: i,
      name: "Mehdi Serghini",
      status: "Typing...",
      time: "5m",
      avatar: "/user.png",
    }));

  const mockMessages = [
    { id: 1, text: "Wach akhay hani?", sent: false },
    {
      id: 2,
      text: "It is a long established fact that a reader will be distracted by the readable.",
      sent: true,
      time: "13:32 PM",
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="fixed bg-[rgba(15,26,36,0.5)] mt-30 ml-30 border-l-2 border-t-2 rounded-tl-4xl border-[#27445E] inset-0 flex">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`
          fixed md:relative
          w-80 h-full
          flex flex-col
          border-r-2 border-[#27445E]
          bg-[rgba(15,26,36,0.95)] md:bg-transparent
          transform transition-transform duration-300 ease-in-out
          z-40
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex h-25 items-center justify-between md:justify-center gap-5 px-6 py-5 border-b-2 border-[#27445E]">
        <div className="flex items-center gap-5">
          <MessageSquareMore size={26} />
          <h2 className="text-[25px] font-medium text-white tracking-[0.07em] font-outfit">
            Messages
          </h2>
        </div>
        <button
          onClick={toggleSidebar}
          className="md:hidden !p-2 rounded-full !bg-transparent transition-colors !border-none"
          aria-label="Toggle sidebar"
        >
          <CircleX size={26}  className="mt-1 text-[#b7b3b3] hover:text-white" />
        </button>
      </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-3 p-3 border-b-2 border-[#20374A] rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="relative shrink-0">
                {chat.avatar ? (
                  <img
                    src={chat.avatar}
                    alt={`${chat.name}'s Avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                    MS
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[rgba(13,34,52,0.75)]"></span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{chat.name}</p>
                <span className="text-sm text-[#00912E] truncate block">
                  {chat.status}
                </span>
              </div>

              <span className="text-xs text-gray-500 shrink-0">{chat.time}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT CHAT AREA */}
      <section className="flex-1 flex flex-col border-[#20374A] w-full md:w-auto">
        {/* Chat Header */}
        <div className="flex h-25 justify-between items-center px-4 md:px-6 py-4 border-b-2 border-[#27445E] shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="md:hidden !p-2 rounded-full !bg-transparent transition-colors flex items-center !border-none justify-center"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <X size={26} className="text-[#b7b3b3] hover:text-white" />
              ) : (
                <Menu size={26} className="text-[#b7b3b3] hover:text-white" />
              )}
            </button>

            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-emerald-500">
                MS
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[rgba(10,20,30,0.7)]"></span>
            </div>
            <div>
              <p className="text-[16px] font-outfit text-white">Mehdi Serghini</p>
              <span className="text-sm text-[#00912E]">Online</span>
            </div>
          </div>
          <button 
              className="!p-2 rounded-full !bg-transparent transition-colors flex items-center !border-none justify-center"
              aria-label="Toggle sidebar"
            >
            <CircleEllipsis
              className="text-[#b7b3b3] hover:text-white transition-colors bg-transparent"
              size={30}
            />
          </button>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-md px-4 py-2 rounded-2xl ${
                  msg.sent
                    ? "bg-emerald-500/20 rounded-br-none"
                    : "bg-white/10 rounded-bl-none"
                }`}
              >
                <p className="text-sm text-white break-words">{msg.text}</p>
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
        <div className="flex h-20 items-center gap-2 md:gap-3 px-4 md:px-6 py-4 border-t-2 border-[#27445E] shrink-0">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-white/10 rounded-full px-4 md:px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-gray-400"
          />
          <button 
            className="!p-2 !rounded-full !bg-[#00912E] hover:!bg-[#007A26] transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </section>
    </div>
  );
}