import {create} from 'zustand'

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
    timestamp?: string;
};

type ChatStore = {
    selectedContact: Contact | null;
    setSelectedContact: (contact: Contact | null) => void;
    messages: Message[];
    setMessages: (message: Message[]) => void;
    addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    selectedContact: null,
    setSelectedContact: (contact) => set({selectedContact: contact}),
    messages: [],
    setMessages: (messages) => set({messages}),
    addMessage: (message) => set((state) =>({messages: [...state.messages, message]}))
}))