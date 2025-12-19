import { Send} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";

export default function InputBar() {
    const { selectedContact, sendMessage} = useChatStore();
    const [newMessage, setNewMessage] = useState<string>("");

    const handleSendMessage = () => {
      if (!selectedContact || !newMessage.trim())
        return;
      sendMessage(newMessage.trim(), selectedContact.user.id);
      setNewMessage("");
    };

    const handleInputChange = (value: string) => {
      setNewMessage(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    useEffect(() => {
      setNewMessage("");
    }, [selectedContact]);
    if (selectedContact)
      return (
        selectedContact?.blockStatus === 'none' ? (
            <div className={`${!selectedContact ? "hidden" : ""} flex min-h-[64px] items-center gap-2 md:gap-3 px-2 sm:px-4 md:px-6 py-3 md:py-4 border-t-2 border-[#27445E]`}>
                <input
                    type="text"
                    placeholder={
                        selectedContact ? "Type your message..." : "Select a contact to start chatting"
                    }
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full flex-1 min-w-0 bg-white/10 rounded-full px-3 sm:px-4 md:px-5 py-2 md:py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-gray-400`}
                />
                <button
                    disabled={newMessage.trim().length === 0}
                    onClick={handleSendMessage}
                    className={`!p-2.5 !rounded-full !border-hidden !bg-[#00912E] hover:!bg-[#007A26] transition-colors flex-shrink-0`}
                >
                    <Send size={21} className="text-white" />
                </button>
            </div>
        ) : selectedContact?.blockStatus === 'blocked_by_them' ? (
            <div className="flex items-center justify-center min-h-[64px] bg-red-500/20 border-2 border-red-500/30 text-red-400 rounded-lg px-4 py-3 mx-2 sm:mx-4 md:mx-6 mb-3">
                <p className="text-sm font-medium">🚫 You have been blocked by this user and cannot send messages.</p>
            </div>
        ) : (
            <div className="flex items-center justify-center min-h-[64px] bg-orange-500/20 border-2 border-orange-500/30 text-orange-400 rounded-lg px-4 py-3 mx-2 sm:mx-4 md:mx-6 mb-3">
                <p className="text-sm font-medium">⛔ You have blocked this user. Unblock them to send messages.</p>
            </div>
        )
    );
}