import { MessageSquareMore, CircleX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Bell, Sword, UserX, RotateCcw } from "lucide-react";
import ContactsList from "./ContactsList";
import ChatHeader from "./ChatHeader";
import MessagesArea from "./MessagesArea";
import InputBar from "./InputBar";
import { useChatStore } from "../store/useChatStore";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { connectSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    if (id)
      connectSocket(Number(id));
    return () => disconnectSocket();
  }, [id, connectSocket, disconnectSocket]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const HISTORY_AUTO_CLOSE_WIDTH = 950;

  const historyOpenRef = useRef(false);

  useEffect(() => {
    historyOpenRef.current = isHistoryOpen;
  }, [isHistoryOpen]);

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth <= HISTORY_AUTO_CLOSE_WIDTH && historyOpenRef.current)
        setIsHistoryOpen(false);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen, isHistoryOpen]);

  const matches = [
    { id: 1, userScore: 4, opponentScore: 3 },
    { id: 2, userScore: 3, opponentScore: 2 },
    { id: 3, userScore: 5, opponentScore: 2 },
    { id: 4, userScore: 4, opponentScore: 0 },
  ];

  const toggleSidebar = () => {
    const newSidebarState = !isSidebarOpen;
    setIsSidebarOpen(newSidebarState);
    
    if (newSidebarState && isHistoryOpen && window.innerWidth < 768)
      setIsHistoryOpen(false);
  };
  
  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };
  
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
        overflow-hidden
      "
    >
      {/* Mobile Overlay for Left Sidebar */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        id={leftSidebarId}
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
          >
            <CircleX size={26} className="text-gray-400 border-none hover:text-white" />
          </button>
        </div>

        {/* Chat List */}
        <ContactsList closeSidebar={closeSidebar} />
      </aside>

      {/* MAIN CHAT AREA */}
      <section className={`flex-1 flex flex-col relative transition-all duration-300
        min-w-[300px] max-w-full
        ${isHistoryOpen && isSidebarOpen ? 'lg:min-w-[400px]' : ''}
        ${isHistoryOpen ? 'lg:max-w-[calc(100vw-640px)] md:max-w-[calc(100vw-400px)]' : ''}
      `}>
        {/* Chat Header */}
        <ChatHeader
          toggleSidebar={toggleSidebar}
          toggleHistory={toggleHistory}
        />

        <MessagesArea />

        {/* Input Bar */}
        <InputBar />
      </section>

      {/* Mobile Overlay for History Panel - only cover area OUTSIDE the panel */}
      {isHistoryOpen && (
        <div
          className="md:hidden fixed inset-0 right-80 bg-black/50 z-40"
          onClick={closeHistory}
        />
      )}

      {/* HISTORY PANEL (Right Side) */}
      <aside
        id={historyPanelId}
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