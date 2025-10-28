import { Send, Mic } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import { axiosInstance } from "../app/axios";
import { toast } from "react-toastify";

export default function InputBar() {
    const {selectedContact, addMessage} = useChatStore();
    const [newMessage, setNewMessage] = useState<string>("");
    const [recordAudio, setRecordAudio] = useState<boolean>(false);

    const handleSendMessage = async () => {
      if (!selectedContact || !newMessage.trim()) {
        console.warn("No contact selected or message is empty.");
        return;
      }
    
      try {
        const res = await axiosInstance.post(`/api/v1/chat/send/${selectedContact.user.id}`, {
          text: newMessage.trim(),
        });
        const { id, timestamp } = res.data.data; 
        addMessage({id: id, text: newMessage, isSender: true, timestamp});
        setNewMessage("");
      } catch (err) {
        toast.error("Failed to send message.");
        console.error("Failed to send message:", err);
      }
    };
    return (
        <div className={`${!selectedContact ? "hidden" : ""} flex h-16 items-center gap-2 md:gap-3 px-4 md:px-6 py-4 border-t-2 border-[#27445E]`}>
          <input
            type="text"
            placeholder={
              selectedContact ? "Type your message..." : "Select a contact to start chatting"
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={`w-full flex-1 bg-white/10 rounded-full px-4 md:px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-gray-400`}
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