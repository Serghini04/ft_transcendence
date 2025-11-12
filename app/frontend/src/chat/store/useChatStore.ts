import { create } from 'zustand';
import { io, Socket } from "socket.io-client";
import { axiosInstance } from "../app/axios";

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
    id: number | string;
    text: string;
    isSender: boolean;
    timestamp: string;
    from?: number;
    to?: number;
    status?: 'sending' | 'sent' | 'failed';
};


type ChatStore = {
    loginId: number | null;
    socket: Socket | null;
    selectedContact: Contact | null;
    messages: Message[];
    contacts: ContactUser[];
    onlineUsers: Set<number>;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    unseenMessageCounts: Map<number, number>;
    isNotificationsMuted: boolean;

    connectSocket: (userId: number) => void;
    disconnectSocket: () => void;
    resetStore: () => void;
    setSelectedContact: (contact: Contact | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    sendMessage: (text: string, receiverId: number) => void;
    markMessagesAsSeen: (contactId: number) => void;
    incrementUnseenMessages: (contactId: number) => void;
    initializeUnseenCounts: (contacts: Contact[]) => void;
    toggleNotificationsMute: () => void;

    handleIncomingMessage: (messageData: any) => void;
    handleMessageSent: (messageData: any) => void;
    handleMessageError: (errorData: any) => void;
    updateMessageStatus: (messageId: string | number, status: Message['status']) => void;
    deduplicateMessages: () => void;
};

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const getChatId = (userId1: number, userId2: number) => {
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
};

export const useChatStore = create<ChatStore>((set, get) => ({
    loginId: null,
    selectedContact: null,
    socket: null,
    contacts: [],
    messages: [],
    onlineUsers: new Set<number>(),
    connectionStatus: 'disconnected',
    unseenMessageCounts: new Map<number, number>(),
    isNotificationsMuted: false,

    connectSocket: (userId) => {
        const currentSocket = get().socket;
        
        if (currentSocket && currentSocket.connected)
            return;
        set({ 
            loginId: userId, 
            connectionStatus: 'connecting',
            messages: [],
            selectedContact: null
        });

        const isCodespace = window.location.hostname.includes('app.github.dev');
        const backendUrl = isCodespace 
            ? "https://orange-spork-gwpjvgpgxjwfvxx9-3000.app.github.dev"
            : "http://localhost:3000";
        
        const socket = io(backendUrl, {
            withCredentials: true,
            auth: { userId },
            reconnection: true,
            reconnectionAttempts: 10,
            transports: ['polling', 'websocket'],
            path: '/socket.io',
        });

        socket.on("connect", () => {
            set({ connectionStatus: 'connected' });

            const { selectedContact } = get();
            if (selectedContact) {
                const chatId = getChatId(userId, selectedContact.user.id);
                socket.emit("chat:join", chatId);
            }
        });

        socket.on("disconnect", () => {
            set({ connectionStatus: 'disconnected' });
        });

        socket.on("message:receive", (messageData) => {
            get().handleIncomingMessage(messageData);
        });

        socket.on("message:sent", (messageData) => {
            get().handleMessageSent(messageData);
        });

        socket.on("message:error", (errorData) => {
            console.error("Message error:", errorData);
            get().handleMessageError(errorData);
        });

        socket.on("users:online", (userIds) => {
            console.log("Online users updated:", userIds);
            set({ onlineUsers: new Set(userIds) });
        });
        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            console.log("Disconnecting socket");
            socket.removeAllListeners();
            socket.disconnect();
            set({ 
                socket: null, 
                connectionStatus: 'disconnected',
                onlineUsers: new Set<number>()
            });
        }
    },

    resetStore: () => {
        console.log("🔄 Resetting chat store completely");
        const socket = get().socket;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
        set({
            loginId: null,
            selectedContact: null,
            socket: null,
            contacts: [],
            messages: [],
            onlineUsers: new Set<number>(),
            connectionStatus: 'disconnected',
            unseenMessageCounts: new Map<number, number>(),
            isNotificationsMuted: false
        });
    },

    toggleNotificationsMute: () => {
        const { isNotificationsMuted } = get();
        set({ isNotificationsMuted: !isNotificationsMuted });
        console.log(`🔔 Notifications ${!isNotificationsMuted ? 'muted' : 'unmuted'}`);
    },

    setSelectedContact: (contact) => {
        const { socket, loginId, selectedContact } = get();

        if (selectedContact && socket && loginId) {
            const oldChatId = getChatId(loginId, selectedContact.user.id);
            socket.emit("chat:leave", oldChatId);
        }

        set({ 
            selectedContact: contact,
            messages: []
        });

        if (contact && socket && loginId) {
            const newChatId = getChatId(loginId, contact.user.id);
            socket.emit("chat:join", newChatId);
            
            get().markMessagesAsSeen(contact.user.id);
            
            axiosInstance.patch(`api/v1/chat/messages/${contact.user.id}/seen`, {}, {
                headers: {
                    'x-user-id': loginId.toString(),
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.error('Failed to mark messages as seen on server:', error);
            });
        }
    },

    setMessages: (messages) => {
        set({ messages });
        get().deduplicateMessages();
    },

    addMessage: (message) => {
        console.log("📝 Adding message to store:", message);
        set((state) => ({ messages: [...state.messages, message] }));
        get().deduplicateMessages();
    },

    sendMessage: (text, receiverId) => {
        const { socket, loginId } = get();
        
        console.log("📤 Attempting to send message:", { text, receiverId, socket: !!socket, loginId });
        
        if (!socket) {
            console.error("❌ No socket connection available");
            return;
        }
        
        if (!loginId) {
            console.error("❌ No loginId available");
            return;
        }

        const messageId = generateMessageId();
        const timestamp = new Date().toISOString();
        
        const optimisticMessage: Message = {
            id: messageId,
            text,
            isSender: true,
            timestamp,
            from: loginId,
            to: receiverId,
            status: 'sending'
        };

        get().addMessage(optimisticMessage);

        console.log("🚀 Emitting message:send event:", {
            id: messageId,
            to: receiverId,
            message: text,
            timestamp
        });

        socket.emit("message:send", {
            id: messageId,
            to: receiverId,
            message: text,
            timestamp
        });
    },

    handleIncomingMessage: (messageData) => {
        const { from, message, timestamp, id } = messageData;
        const { selectedContact, loginId } = get();

        if (from === loginId) 
            return;

        if (selectedContact && selectedContact.user.id === from && loginId) {
            const newMessage: Message = {
                id: id || generateMessageId(),
                text: message,
                isSender: false,
                timestamp,
                from,
                to: loginId
            };
            get().addMessage(newMessage);
        } else
            get().incrementUnseenMessages(from);
    },

    handleMessageSent: (messageData) => {
        const { id: realId, message, timestamp, from, to } = messageData;
        const { selectedContact, loginId } = get();
        
        if (!selectedContact || !loginId)
            return;
        
        const isCurrentConversation = 
            (from === loginId && to === selectedContact.user.id) || 
            (from === selectedContact.user.id && to === loginId);
            
        if (!isCurrentConversation)
            return;
        
        const existingMessage = get().messages.find(msg => 
            msg.id === realId || 
            (msg.text === message && msg.status === 'sending')
        );

        if (existingMessage) {
            set((state) => ({
                messages: state.messages.map(msg => {
                    if (msg.id === existingMessage.id || 
                        (msg.text === message && msg.status === 'sending')) {
                        return {
                            ...msg,
                            id: realId,
                            status: 'sent' as const
                        };
                    }
                    return msg;
                })
            }));
        } else {
            if (selectedContact && 
                ((from === loginId && to === selectedContact.user.id) || 
                 (from === selectedContact.user.id && to === loginId))) {
                
                const newMessage: Message = {
                    id: realId,
                    text: message,
                    isSender: from === loginId,
                    timestamp,
                    from,
                    to,
                    status: 'sent'
                };
                
                get().addMessage(newMessage);
            }
        }
    },

    handleMessageError: (errorData) => {
        const { messageId } = errorData;
        get().updateMessageStatus(messageId, 'failed');
    },

    updateMessageStatus: (messageId, status) => {
        set((state) => ({
            messages: state.messages.map(msg => 
                msg.id === messageId ? { ...msg, status } : msg
            )
        }));
    },

    deduplicateMessages: () => {
        set((state) => {
            const seen = new Set();
            const uniqueMessages = state.messages.filter(msg => {
                const key = `${msg.id}_${msg.timestamp}_${msg.text}`;
                if (seen.has(key))
                    return false;
                seen.add(key);
                return true;
            });

            uniqueMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            return { messages: uniqueMessages };
        });
    },

    markMessagesAsSeen: (contactId) => {
        set((state) => {
            const newCounts = new Map(state.unseenMessageCounts);
            newCounts.set(contactId, 0);
            return { unseenMessageCounts: newCounts };
        });
    },

    incrementUnseenMessages: (contactId) => {
        set((state) => {
            const newCounts = new Map(state.unseenMessageCounts);
            const currentCount = newCounts.get(contactId) || 0;
            newCounts.set(contactId, currentCount + 1);
            return { unseenMessageCounts: newCounts };
        });
    },

    initializeUnseenCounts: (contacts: Contact[]) => {
        const newCounts = new Map<number, number>();
        contacts.forEach(contact => {
            newCounts.set(contact.user.id, contact.unseenMessages);
        });
        set({ unseenMessageCounts: newCounts });
    }
}));
