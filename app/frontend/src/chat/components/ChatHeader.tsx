import { CircleEllipsis, PanelLeftOpen } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

export default function ChatHeader({
  toggleSidebar,
  toggleHistory,
}: any) {
  const { selectedContact, onlineUsers } = useChatStore();
  
  return (
    <div className="flex h-16 justify-between items-center px-4 md:px-6 py-4 border-b-2 border-[#27445E]">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="md:hidden !p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors flex-shrink-0"
        >
          <PanelLeftOpen size={26} className="text-gray-400 hover:text-white" />
        </button>
        {selectedContact ? (
          <>
            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              {selectedContact.user.avatarUrl ? (
                <img
                  src={selectedContact.user.avatarUrl}
                  alt={`${selectedContact.user.fullName || "User"}'s Avatar`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-emerald-500">
                  {selectedContact.user.fullName?.[0] || "?"}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 ${
                  onlineUsers.has(selectedContact.user.id) ? "bg-emerald-500" : "bg-gray-500"
                } rounded-full ring-2 ring-[rgba(10,20,30,0.7)]`}
              ></span>
            </div>
            <div className="min-w-0">
              <p className="text-base text-white truncate font-outfit">
                {selectedContact.user.fullName}
              </p>
              <span className={`text-sm ${onlineUsers.has(selectedContact.user.id) ? "text-[#00912E]" : "text-gray-500"}`}>
                {onlineUsers.has(selectedContact.user.id) ? "online" : "offline"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-[0_0_18px_-4px_rgba(16,185,129,0.55)]"
              aria-hidden="true"
            >
              <span className="text-white text-lg">💬</span>
            </div>

            <div className="flex flex-col">
              <p className="text-white font-medium">Select a contact</p>
              <span className="text-gray-400 text-sm">Start a conversation and say hi</span>
            </div>
          </div>
        )}
      </div> 
      
      {selectedContact && (
        <button
          onClick={toggleHistory}
          className="!p-2 hover:!bg-white/10 !rounded-full !border-none !bg-transparent transition-colors flex-shrink-0"
        >
          <CircleEllipsis className="text-gray-400 hover:text-white" size={30} />
        </button>
      )}
    </div>
  );
}