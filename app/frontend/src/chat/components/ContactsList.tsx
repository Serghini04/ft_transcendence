import { useEffect, useState } from "react";
import { axiosInstance } from "../app/axios";
import { useChatStore } from "../store/useChatStore";
import { toast } from "react-toastify";

type Contact = {
  id: number;
  user: {
    id: number;
    fullName: string;
    username: string;
    status: string;
    avatarUrl: string;
  };
  unseenMessages: number;
  isBlocked: boolean;
};

export default function ContactsList({ closeSidebar }: any) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { selectedContact, setSelectedContact, setMessages, loginId, onlineUsers, unseenMessageCounts, initializeUnseenCounts } = useChatStore();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axiosInstance.get<Contact[]>("/api/v1/chat/contacts", {
          headers: { "x-user-id": loginId }
        });
        setContacts(response.data);
        
        // Initialize unseen message counts from backend data
        initializeUnseenCounts(response.data);
      } catch (err) {
        toast.error("Failed to fetch contacts.");
        console.error("Failed to fetch contacts: ", err);
      }
    };
    
    if (loginId)
      fetchContacts();
  }, [loginId]);

  const handleSelectContact = async (contact: Contact) => {
    setMessages([]);
    setSelectedContact(contact);
    closeSidebar();

    try {
      const res = await axiosInstance.get(`/api/v1/chat/conversation/${contact.user.id}`, {
        headers: { "x-user-id": loginId }
      });
      setMessages(res.data);
    } catch (err) {
      toast.error("Failed to load conversation.");
      console.error("Failed to load conversation: ", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3 py-12">
        <div className="w-44 h-44 md:w-48 md:h-50 rounded-4xl overflow-hidden ring-1 ring-[#27445E] shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          <img
            src="/friends.jpg"
            alt="Empty contacts illustration"
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
        </div>
        <p className="text-lg font-medium text-white">No contacts yet</p>
        <p className="text-sm">Add new friends to start chatting.</p>
      </div>
      )}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className={`flex items-center gap-3 p-3 border-b-2 border-[#20374A] rounded-xl transition-colors cursor-pointer ${
            selectedContact?.id === contact.id ? "bg-[#112434]" : "hover:bg-white/10"
          }`}
          onClick={() => handleSelectContact(contact)}
        >
          <div className="relative shrink-0">
            {contact.user.avatarUrl ? (
              <img
                src={contact.user.avatarUrl}
                alt={`${contact.user.fullName}'s Avatar`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {contact.user.fullName[0]}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[rgba(13,34,52,0.75)] ${
                onlineUsers.has(contact.user.id) ? "bg-emerald-500" : "bg-gray-500"
              }`}
            ></span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{contact.user.fullName}</p>
            <span className="text-sm text-gray-400 truncate block">
              {onlineUsers.has(contact.user.id) ? "online" : "offline"}
            </span>
          </div>

          {(unseenMessageCounts.get(contact.user.id) || 0) > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-semibold">
              {unseenMessageCounts.get(contact.user.id)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}