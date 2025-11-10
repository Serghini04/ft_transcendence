import { create } from 'zustand';
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
    onlineUsers: number[];
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';

    connectSocket: (userId: number) => void;
    disconnectSocket: () => void;
    resetStore: () => void;
    setSelectedContact: (contact: Contact | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    sendMessage: (text: string, receiverId: number) => void;

    handleIncomingMessage: (messageData: any) => void;
    handleMessageSent: (messageData: any) => void;
    handleMessageError: (errorData: any) => void;
    updateMessageStatus: (messageId: string | number, status: Message['status']) => void;
    deduplicateMessages: () => void;
};

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    onlineUsers: [],
    connectionStatus: 'disconnected',

    connectSocket: (userId) => {
        console.log("🔌 Attempting to connect socket with userId:", userId);
        const currentSocket = get().socket;
        const currentLoginId = get().loginId;
        
        // If switching users, completely reset the store
        if (currentLoginId && currentLoginId !== userId) {
            console.log("🔄 Switching users, resetting store");
            if (currentSocket) {
                currentSocket.removeAllListeners();
                currentSocket.disconnect();
            }
            // Reset entire store state for new user
            set({
                loginId: null,
                selectedContact: null,
                socket: null,
                contacts: [],
                messages: [],
                onlineUsers: [],
                connectionStatus: 'disconnected'
            });
        }
        
        if (currentSocket && currentSocket.connected && currentLoginId === userId) {
            console.log("⚠️ Socket already connected for this user, skipping");
            return;
        }

        if (currentSocket) {
            console.log("🔄 Disconnecting existing socket");
            currentSocket.removeAllListeners();
            currentSocket.disconnect();
        }

        console.log("📝 Setting loginId to:", userId);
        set({ 
            loginId: userId, 
            connectionStatus: 'connecting',
            messages: [], // Always clear messages when connecting
            selectedContact: null // Clear selected contact
        });

        // Use the correct backend URL for Codespace
        const backendUrl = "https://orange-spork-gwpjvgpgxjwfvxx9-3000.app.github.dev";
        console.log("🚀 Creating socket.io connection to", backendUrl, "with userId:", userId);
        const socket = io(backendUrl, {
            withCredentials: true,
            auth: { userId },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'],
            path: '/socket.io',
        });

        socket.on("connect", () => {
            console.log(`Connected to socket server: ${socket.id}`);
            set({ connectionStatus: 'connected' });

            const { selectedContact } = get();
            if (selectedContact) {
                const chatId = getChatId(userId, selectedContact.user.id);
                socket.emit("chat:join", chatId);
            }
        });

        socket.on("connect_error", (error) => {
            console.warn("Socket connection error:", error);
            set({ connectionStatus: 'error' });
        });

        socket.on("disconnect", (reason) => {
            console.log(`Disconnected from socket server: ${reason}`);
            set({ connectionStatus: 'disconnected' });
        });

        socket.on("message:receive", (messageData) => {
            console.log("Received message:", messageData);
            get().handleIncomingMessage(messageData);
        });

        socket.on("message:sent", (messageData) => {
            console.log("Message sent confirmation:", messageData);
            get().handleMessageSent(messageData);
        });

        socket.on("message:error", (errorData) => {
            console.error("Message error:", errorData);
            get().handleMessageError(errorData);
        });

        socket.on("users:online", (userIds) => {
            console.log("Online users updated:", userIds);
            set({ onlineUsers: userIds });
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
                onlineUsers: []
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
            onlineUsers: [],
            connectionStatus: 'disconnected'
        });
    },

    setSelectedContact: (contact) => {
        const { socket, loginId, selectedContact } = get();

        if (selectedContact && socket && loginId) {
            const oldChatId = getChatId(loginId, selectedContact.user.id);
            socket.emit("chat:leave", oldChatId);
        }

        // Always clear messages when switching contacts
        // ContactsList will fetch fresh messages from API
        set({ 
            selectedContact: contact,
            messages: [] // Always clear - let ContactsList fetch fresh data
        });

        if (contact && socket && loginId) {
            const newChatId = getChatId(loginId, contact.user.id);
            socket.emit("chat:join", newChatId);
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
        
        console.log("📥 Incoming message:", { from, to: loginId, selectedContact: selectedContact?.user.id, message });
        
        // Only add message if it's for the currently selected conversation
        if (selectedContact && selectedContact.user.id === from && loginId) {
            const newMessage: Message = {
                id: id || generateMessageId(),
                text: message,
                isSender: false,
                timestamp,
                from,
                to: loginId
            };
            
            console.log("✅ Adding message to current conversation");
            get().addMessage(newMessage);
        } else {
            console.log("🚫 Message ignored - not for current conversation or no contact selected");
        }
    },

    handleMessageSent: (messageData) => {
        const { id: realId, message, timestamp, from, to } = messageData;
        const { selectedContact, loginId } = get();
        
        console.log("📤 Message sent confirmation:", { realId, from, to, selectedContact: selectedContact?.user.id });
        
        // Only process if this message belongs to the current conversation
        if (!selectedContact || !loginId) {
            console.log("🚫 No active conversation, ignoring sent confirmation");
            return;
        }
        
        const isCurrentConversation = 
            (from === loginId && to === selectedContact.user.id) || 
            (from === selectedContact.user.id && to === loginId);
            
        if (!isCurrentConversation) {
            console.log("🚫 Message not for current conversation, ignoring");
            return;
        }
        
        const existingMessage = get().messages.find(msg => 
            msg.id === realId || 
            (msg.text === message && msg.status === 'sending')
        );

        if (existingMessage) {
            console.log("✅ Updating optimistic message");
            // Update existing optimistic message
            set((state) => ({
                messages: state.messages.map(msg => {
                    if (msg.id === existingMessage.id || 
                        (msg.text === message && msg.status === 'sending')) {
                        return {
                            ...msg,
                            id: realId, // update with real database ID
                            status: 'sent' as const
                        };
                    }
                    return msg;
                })
            }));
        } else {
            // This is a message sent from another tab of the same user
            // Add it as a new message if it's for the current chat
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
            
            // Sort by timestamp
            uniqueMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            return { messages: uniqueMessages };
        });
    }
}));

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        const store = useChatStore.getState();
        store.disconnectSocket();
    });
}