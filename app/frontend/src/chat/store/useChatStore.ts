import {create} from 'zustand'
import { io, Socket } from "socket.io-client";

type ContactUser = {
    id: number;
    fullName: string;
    username: string;
    status: string;
    avatarUrl: string;
};

type Contact = {
    id: number;
    user: ContactUser;
    unseenMessages: number;
    isBlocked: boolean;
};

type Message = {
    id: number;
    text: string;
    isSender: boolean;
    timestamp: string;
};

type ChatStore = {
    socket: Socket | null;
    selectedContact: Contact | null;
    messages: Message[];
    contacts: ContactUser[];
    connectSocket: (userId: number) => void;
    disconnectSocket: () => void;
    setSelectedContact: (contact: Contact | null) => void;
    setMessages: (message: Message[]) => void;
    addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    selectedContact: null,
    socket: null,
    contacts: [],
    messages: [],

    connectSocket: (userId) => {
        if (get().socket)
            return;

        const socket = io("http://localhost:8080", {
            auth: {userId},
        });

        socket.on("connect", () => {
            console.log("Connected to socket server:", socket.id);
        });

        socket.on("message:receive", (msg) => {
            const { selectedContact } = get();
            if (selectedContact && selectedContact.user.id === msg.from) {
              set((state) => ({ messages: [...state.messages, {
                id: msg.id || Date.now(),
                text: msg.message,
                isSender: false,
                timestamp: msg.timestamp,
              }] }));
            } else {
              console.log("📨 Message for another chat", msg);
            }
          });
          socket.on("user:online", (data) => console.log("🟢 user online:", data));
          socket.on("user:offline", (data) => console.log("⚫ user offline:", data));
          set({socket});
        },

    disconnectSocket: () => {

    },
    setSelectedContact: (contact) => set({selectedContact: contact}),
    setMessages: (messages) => set({messages}),
    addMessage: (message) => set((state) =>({messages: [...state.messages, message]}))
}))