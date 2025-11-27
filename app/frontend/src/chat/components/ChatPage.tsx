import { MessageSquareMore, CircleX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ContactsList from "./ContactsList";
import ChatHeader from "./ChatHeader";
import MessagesArea from "./MessagesArea";
import InputBar from "./InputBar";
import { useChatStore } from "../store/useChatStore";
import { useParams } from "react-router-dom";
import HistoryPanel from "./HistoryPanel";
import { UseTokenStore } from "../../userAuth/LoginAndSignup/zustand/useStore";

export default function ChatPage() {
  // const { id } = useParams<{ id: string }>();
  const { userId } = UseTokenStore();
  const { connectSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    if (userId)
      connectSocket(Number(userId));
    return () => disconnectSocket();
  }, [userId, connectSocket, disconnectSocket]);

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
      <HistoryPanel
        historyPanelId={historyPanelId}
        isHistoryOpen={isHistoryOpen}
        toggleHistory={toggleHistory}
      />
    </div>
  );
}