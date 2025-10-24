import { CircleEllipsis, PanelLeftOpen } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

interface ChatContextProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isHistoryOpen: boolean;
  toggleHistory: () => void;
}

export default function ChatHeader({
  toggleSidebar,
  isSidebarOpen,
  toggleHistory,
  isHistoryOpen,
}: ChatContextProps) {
  const { selectedContact } = useChatStore();

  if (!selectedContact)
    return null;

  const { user } = selectedContact;

  return (
    <div className="flex h-16 justify-between items-center px-4 md:px-6 py-4 border-b-2 border-[#27445E]">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden !p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors flex-shrink-0"
          aria-label="Toggle sidebar"
          aria-expanded={isSidebarOpen}
          aria-controls="chat-left-sidebar"
        >
          <PanelLeftOpen size={26} className="text-gray-400 hover:text-white" />
        </button>

        {/* User Avatar */}
        <div className="relative flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.fullName || "User"}'s Avatar`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-emerald-500">
              {user.fullName?.[0] || "?"}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 ${
              user.status === "online" ? "bg-emerald-500" : "bg-gray-500"
            } rounded-full ring-2 ring-[rgba(10,20,30,0.7)]`}
          ></span>
        </div>

        {/* User Info */}
        <div className="min-w-0">
          <p className="text-base font-outfit text-white truncate">
            {user.fullName}
          </p>
          <span className="text-sm text-[#00912E]">{user.status}</span>
        </div>
      </div>

      {/* History Panel Toggle */}
      <button
        onClick={toggleHistory}
        className="!p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors flex-shrink-0"
        aria-label="Toggle history panel"
        aria-expanded={isHistoryOpen}
        aria-controls="chat-history-panel"
      >
        <CircleEllipsis className="text-gray-400 hover:text-white" size={30} />
      </button>
    </div>
  );
}