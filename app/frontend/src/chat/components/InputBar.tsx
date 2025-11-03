import { Send, Mic } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";

export default function InputBar() {
    const { selectedContact, sendMessage, startTyping, stopTyping } = useChatStore();
    const [newMessage, setNewMessage] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);

    const handleSendMessage = () => {
      if (!selectedContact || !newMessage.trim()) {
        console.warn("No contact selected or message is empty.");
        return;
      }

      // Send message via the store
      sendMessage(newMessage.trim(), selectedContact.user.id);
      setNewMessage("");
      
      // Stop typing indicator
      if (isTyping) {
        stopTyping(selectedContact.user.id);
        setIsTyping(false);
      }
    };

    const handleInputChange = (value: string) => {
      setNewMessage(value);
      
      if (!selectedContact) return;

      // Handle typing indicators
      if (value.trim() && !isTyping) {
        startTyping(selectedContact.user.id);
        setIsTyping(true);
      } else if (!value.trim() && isTyping) {
        stopTyping(selectedContact.user.id);
        setIsTyping(false);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Auto-stop typing after 3 seconds of inactivity
    useEffect(() => {
      if (!isTyping || !selectedContact) return;

      const timeout = setTimeout(() => {
        stopTyping(selectedContact.user.id);
        setIsTyping(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }, [newMessage, isTyping, selectedContact, stopTyping]);
    return (
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
            {newMessage.trim().length === 0 ?
            (
              <Mic size={21} className="text-white" />
            ):(
              <Send size={21} className="text-white" />
            )
            }
          </button>
        </div>
    );
}