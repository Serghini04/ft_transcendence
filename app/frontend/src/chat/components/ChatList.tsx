import { useEffect, useState } from "react";
import { axiosInstance } from "../app/axios";
import { MessageCircle } from "lucide-react"; 

type Contact = {
  id: number;
  user: {
    id: number;
    fullName: string;
    username: string;
    status: string;
    avatarUrl: string;
  };
  unseenMessages:number;
  isBlocked: boolean;
};

export default function ChatList({closeSidebar}: any) {

    const [contacts, setContacts] = useState<Contact[]>([]);
    useEffect(() => {
      const fetchContacts = async () => {
        try {
          const response = await axiosInstance.get<Contact[]>("/api/v1/chat/contacts")
          setContacts(response.data);
          
        } catch (err){
          console.error("Failed to fetch contacts: ", err);
        }
      };
      fetchContacts();
      contacts.forEach(contact => contact.unseenMessages = 1);
    }, []);
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-3 border-b-2 border-[#20374A] rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              onClick={closeSidebar}
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
                    MS
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
                <span className="text-sm text-[#14311d] truncate block">
                  {contact.user.status}
                </span>
              </div>

              {(contact.unseenMessages = 5) > 0 && (
                <div className="flex items-center gap-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#1e293b] to-[#334155] text-white text-sm font-semibold">
                    {contact.unseenMessages}
                  </span>
                </div>
              )}

            </div>
          ))}
        </div>
    );
}