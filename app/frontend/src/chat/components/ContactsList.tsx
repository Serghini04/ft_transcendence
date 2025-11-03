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
  const { selectedContact, setSelectedContact, setMessages, loginId } = useChatStore();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axiosInstance.get<Contact[]>("/api/v1/chat/contacts", {
          headers: {
            "x-user-id": loginId,
          },
        });
        setContacts(response.data);
      } catch (err) {
        toast.error("Failed to fetch contacts.");
        console.error("Failed to fetch contacts: ", err);
      }
    };
    
    if (loginId) fetchContacts();
  }, [loginId]);

  const handleSelectContact = async (contact: Contact) => {
    // Clear messages first to prevent leaking
    setMessages([]);
    setSelectedContact(contact);
    closeSidebar();

    try {
      const res = await axiosInstance.get(`/api/v1/chat/conversation/${contact.user.id}`, {
        headers: {
          "x-user-id": loginId,
        },
      });
      setMessages(res.data);
      console.log(res.data);
    } catch (err) {
      toast.error("Failed to load conversation.");
      console.error("Failed to load conversation: ", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                contact.user.status === "online" ? "bg-emerald-500" : "bg-gray-500"
              }`}
            ></span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{contact.user.fullName}</p>
            <span className="text-sm text-gray-400 truncate block">
              {contact.user.status}
            </span>
          </div>

          {contact.unseenMessages > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-semibold">
              {contact.unseenMessages}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}