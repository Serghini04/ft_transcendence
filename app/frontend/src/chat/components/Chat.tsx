import { MessageSquareMore, CircleEllipsis, Send, Menu, X, CircleX } from "lucide-react";
import { useState } from "react";
import { Bell, Sword, UserX, RotateCcw } from "lucide-react";

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
  
  const matches = [
    { id: 1, userScore: 4, opponentScore: 3 },
    { id: 2, userScore: 3, opponentScore: 2 },
    { id: 3, userScore: 5, opponentScore: 2 },
    { id: 4, userScore: 4, opponentScore: 0 },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleHistory = () => {
    setIsHistoryOpen((prev) => !prev);
  };

  return (
    <div className="fixed bg-[rgba(15,26,36,0.5)] mt-30 ml-30 border-l-2 border-t-2 rounded-tl-4xl border-[#27445E] inset-0 flex">
      {/* Overlay for mobile - Left Sidebar */}
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
            aria-expanded={isSidebarOpen}
          >
            <CircleX size={26} className="mt-1 text-[#b7b3b3] hover:text-white"/>
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
      <section className="flex-1 flex flex-col w-full md:w-auto">
        {/* Chat Header */}
        <div className="flex h-25 justify-between items-center px-4 md:px-6 py-4 border-b-2 border-[#27445E] shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="md:hidden !p-2 rounded-full !bg-transparent transition-colors flex items-center !border-none justify-center"
              aria-label="Toggle sidebar"
              aria-expanded={isSidebarOpen}
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
              onClick={toggleHistory}
              className="!p-2 rounded-full !bg-transparent transition-colors flex items-center !border-none justify-center"
              aria-label="Toggle history panel"
              aria-expanded={isHistoryOpen}
            >
            {isHistoryOpen ? (
              <X
                className="text-[#b7b3b3] hover:text-white transition-colors bg-transparent"
                size={30}
              />
            ) : (
              <CircleEllipsis
                className="text-[#b7b3b3] hover:text-white transition-colors bg-transparent"
                size={30}
              />
            )}
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
        
      {/* History Bar (toggleable) */}
      <div
        className={`
          flex flex-col items-center
          border-l-2 border-[#20374A]
          text-white
          min-h-screen
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${isHistoryOpen ? "w-full sm:w-80 opacity-100" : "w-0 opacity-0"}
          ${isHistoryOpen ? "px-4 py-6" : "px-0 py-0"}
        `}
        aria-hidden={!isHistoryOpen}
      >
        {/* Avatar */}
        <div className="flex flex-col mt-14 items-center space-y-3">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-600">
            <img
              src="/user.png"
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Mehdi Serghini</h2>
            <h3 className="text-[#A8AAAB] text-sm">meserghi</h3>
          </div>
        </div>

        {/* History Section */}
        <div className="mt-6 w-full">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="text-lg font-medium">History</h2>
            <RotateCcw size={18} className="text-[#A8AAAB]" />
          </div>

          <div className="flex flex-col gap-3 w-full">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex justify-between items-center bg-[#112434] p-3 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="/user.png"
                    alt="User"
                    className="w-10 h-10 rounded-full border border-gray-600"
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-base font-semibold">
                      {match.userScore}
                    </span>
                  </div>
                </div>

                
                <span className="text-[#A8AAAB] font-semibold">vs</span>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-semibold">
                      {match.opponentScore}
                    </span>
                  </div>
                  <img
                    src="/enemy.jpeg"
                    alt="Opponent"
                    className="w-10 h-10 rounded-full border border-gray-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 w-full">
          <button className="flex items-center justify-center gap-2 !bg-[#112434] !hover:bg-[#1A2D42] rounded-xl py-2 text-sm transition-colors">
            <Sword size={16} />
            launch a challenge
          </button>

          <div className="flex items-center justify-between bg-[#112434] rounded-xl py-3 px-4">
            <div className="flex items-center gap-2">
              <Bell size={16} />
              <span className="text-sm">Mute notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-[#1EC49F] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <button className="flex items-center justify-center gap-2 !bg-[#A33B2E] !hover:bg-[#8E3125] rounded-xl py-2 text-sm transition-colors">
            <UserX size={16} />
            Block
          </button>
        </div>
      </div>
    </div>
  );
}