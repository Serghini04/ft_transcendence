import { MessageSquareMore, CircleEllipsis, Send, Menu, CircleX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Bell, Sword, UserX, RotateCcw } from "lucide-react";
import ChatList from "./ChatList";

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const HISTORY_AUTO_CLOSE_WIDTH = 950;

  // Keep a ref in sync with the current open state to avoid stale closure
  const historyOpenRef = useRef(false);
  
  useEffect(() => {
    historyOpenRef.current = isHistoryOpen;
  }, [isHistoryOpen]);

  // Close the history panel only when a resize happens to <= threshold
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= HISTORY_AUTO_CLOSE_WIDTH && historyOpenRef.current)
        setIsHistoryOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mockChats = Array(1)
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleHistory = () => setIsHistoryOpen(!isHistoryOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const closeHistory = () => setIsHistoryOpen(false);

  const leftSidebarId = "chat-left-sidebar";
  const historyPanelId = "chat-history-panel";

  return (
    <div
      className="
        fixed
        bg-[rgba(15,26,36,0.5)]
        mt-20
        md:ml-30
        md:border-l-2 border-t-2
        md:rounded-tl-4xl
        border-[#27445E]
        inset-0
        flex
      "
    >
      {/* Mobile Overlay for Left Sidebar */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        id={leftSidebarId}
        role="dialog"
        aria-modal={isSidebarOpen ? true : undefined}
        aria-label="Messages sidebar"
        className={`
          fixed md:relative
          top-20 md:top-0 left-0
          w-80 h-[calc(100vh-5rem)] md:h-full
          flex flex-col
          border-r-2 border-[#27445E]
          bg-[rgba(15,26,36,0.98)] md:bg-transparent
          transform transition-transform duration-300 ease-in-out
          z-50 md:z-auto
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-t-2 md:border-t-0 md:justify-center gap-5 px-6 py-4 border-b-2 border-[#27445E]">
          <div className="flex items-center gap-5">
            <MessageSquareMore size={26} />
            <h2 className="text-2xl font-medium text-white tracking-wider font-outfit">
              Messages
            </h2>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden !p-2 mt-1 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors"
            aria-label="Close sidebar"
            aria-controls={leftSidebarId}
          >
            <CircleX size={26} className="text-gray-400 border-none hover:text-white" />
          </button>
        </div>

        {/* Chat List */}
        <ChatList closeSidebar={closeSidebar} />
      </aside>

      {/* MAIN CHAT AREA */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex h-16 justify-between items-center px-4 md:px-6 py-4 border-b-2 border-[#27445E]">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className="md:hidden !p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
              aria-expanded={isSidebarOpen}
              aria-controls={leftSidebarId}
            >
              <Menu size={26} className="text-gray-400 hover:text-white" />
            </button>

            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-emerald-500">
                MS
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[rgba(10,20,30,0.7)]"></span>
            </div>

            <div className="min-w-0">
              <p className="text-base font-outfit text-white truncate">Mehdi Serghini</p>
              <span className="text-sm text-[#00912E]">Online</span>
            </div>
          </div>

          <button
            onClick={toggleHistory}
            className="!p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors flex-shrink-0"
            aria-label="Toggle history panel"
            aria-expanded={isHistoryOpen}
            aria-controls={historyPanelId}
          >
            <CircleEllipsis className="text-gray-400 hover:text-white" size={30} />
          </button>
        </div>

        {/* Messages Area */}
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
        <div className="flex h-16 items-center gap-2 md:gap-3 px-4 md:px-6 py-4 border-t-2 border-[#27445E]">
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full flex-1 bg-white/10 rounded-full px-4 md:px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-gray-400"
          />
          <button
            className="!p-2.5 !rounded-full !bg-[#00912E] hover:!bg-[#007A26] transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </section>

      {/* Mobile Overlay for History Panel - only cover area OUTSIDE the panel */}
      {isHistoryOpen && (
        <div
          className="md:hidden fixed inset-0 right-80 bg-black/50 z-40"
          onClick={closeHistory}
          aria-hidden="true"
        />
      )}

      {/* HISTORY PANEL (Right Side) */}
      <aside
        id={historyPanelId}
        role="dialog"
        aria-modal={isHistoryOpen ? true : undefined}
        aria-label="History panel"
        className={`
          fixed md:relative
          top-20 md:top-0 right-0
          h-[calc(100vh-5rem)] md:h-full
          flex flex-col
          bg-[rgba(15,26,36,0.98)] md:bg-transparent
          border-l-2 border-[#27445E]
          text-white
          overflow-y-auto
          transform
          md:transform-none
          transition-transform md:transition-[width] duration-300 ease-in-out
          z-50
          ${isHistoryOpen ? "translate-x-0 w-80 pointer-events-auto" : "translate-x-full md:translate-x-0 w-0 pointer-events-none"}
        `}
      >
        <div className={`${isHistoryOpen ? "px-4 py-6" : "hidden"} flex flex-col relative h-full`}>
          {/* Close Button */}
          <button
            onClick={toggleHistory}
            className="absolute top-4 right-4 !p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors"
            aria-label="Close history panel"
            aria-controls={historyPanelId}
          >
            <CircleX size={26} className="text-gray-400 hover:text-white" />
          </button>

          {/* Avatar Section */}
          <div className="flex flex-col mt-16 items-center space-y-3">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-600">
              <img
                src="/user.png"
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Mehdi Serghini</h2>
              <h3 className="text-gray-400 text-sm">meserghi</h3>
            </div>
          </div>

          {/* Match History */}
          <div className="mt-6 w-full">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h2 className="text-lg font-medium">History</h2>
              <RotateCcw size={18} className="text-gray-400" />
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
                    <span className="text-base font-semibold">
                      {match.userScore}
                    </span>
                  </div>

                  <span className="text-gray-400 font-semibold">vs</span>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold">
                      {match.opponentScore}
                    </span>
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
            <button className="flex items-center justify-center gap-2 !bg-[#112434] hover:!bg-[#1A2D42] !border-none rounded-xl py-2.5 text-sm transition-colors">
              <Sword size={16} />
              Launch a challenge
            </button>

            <div className="flex items-center justify-between bg-[#112434] rounded-xl py-3 px-4">
              <div className="flex items-center gap-3">
                <Bell size={16} />
                Mute notifications
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-[#1EC49F] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <button className="flex items-center justify-center gap-2 !bg-[#A33B2E] hover:!bg-[#8E3125] !border-none rounded-xl py-2.5 text-sm !transition-colors">
              <UserX size={16} />
              Block
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}