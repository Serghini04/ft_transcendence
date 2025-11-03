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

type TypingUser = {
    userId: number;
    chatId: string;
};

type ChatStore = {
    loginId: number | null;
    socket: Socket | null;
    selectedContact: Contact | null;
    messages: Message[];
    contacts: ContactUser[];
    onlineUsers: number[];
    typingUsers: TypingUser[];
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    
    // Actions
    connectSocket: (userId: number) => void;
    disconnectSocket: () => void;
    setSelectedContact: (contact: Contact | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    sendMessage: (text: string, receiverId: number) => void;
    startTyping: (receiverId: number) => void;
    stopTyping: (receiverId: number) => void;
    
    // Internal methods
    handleIncomingMessage: (messageData: any) => void;
    handleMessageSent: (messageData: any) => void;
    handleMessageError: (errorData: any) => void;
    updateMessageStatus: (messageId: string | number, status: Message['status']) => void;
    deduplicateMessages: () => void;
};

// Helper function to generate unique message IDs
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to get chat ID between two users
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
    typingUsers: [],
    connectionStatus: 'disconnected',

    connectSocket: (userId) => {
        const currentSocket = get().socket;
        
        // Prevent multiple connections
        if (currentSocket && currentSocket.connected) {
            console.warn("Socket already connected");
            return;
        }

        // Clean up existing socket
        if (currentSocket) {
            currentSocket.removeAllListeners();
            currentSocket.disconnect();
        }

        set({ 
            loginId: userId, 
            connectionStatus: 'connecting',
            messages: [],
            typingUsers: []
        });

        console.log(`🔌 Connecting socket for user ${userId}`);

        const socket = io("https://improved-dollop-rvxq5jxj4rp25g74-3000.app.github.dev", {
            withCredentials: true,
            auth: { userId },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'],
            path: '/socket.io',
        });

        // Connection events
        socket.on("connect", () => {
            console.log(`✅ Connected to socket server: ${socket.id}`);
            set({ connectionStatus: 'connected' });
            
            // Join current chat if selected
            const { selectedContact } = get();
            if (selectedContact) {
                const chatId = getChatId(userId, selectedContact.user.id);
                socket.emit("chat:join", chatId);
            }
        });

        socket.on("connect_error", (error) => {
            console.error("❌ Socket connection error:", error);
            set({ connectionStatus: 'error' });
        });

        socket.on("disconnect", (reason) => {
            console.log(`📴 Disconnected from socket server: ${reason}`);
            set({ connectionStatus: 'disconnected' });
        });

        // Message events
        socket.on("message:receive", (messageData) => {
            console.log("📨 Received message:", messageData);
            get().handleIncomingMessage(messageData);
        });

        socket.on("message:sent", (messageData) => {
            console.log("✅ Message sent confirmation:", messageData);
            get().handleMessageSent(messageData);
        });

        socket.on("message:error", (errorData) => {
            console.error("❌ Message error:", errorData);
            get().handleMessageError(errorData);
        });

        // Online users
        socket.on("users:online", (userIds) => {
            console.log("🟢 Online users updated:", userIds);
            set({ onlineUsers: userIds });
        });

        // Typing indicators
        socket.on("typing:start", (data) => {
            const { userId: typingUserId, chatId } = data;
            set((state) => ({
                typingUsers: [
                    ...state.typingUsers.filter(u => !(u.userId === typingUserId && u.chatId === chatId)),
                    { userId: typingUserId, chatId }
                ]
            }));
        });

        socket.on("typing:stop", (data) => {
            const { userId: typingUserId, chatId } = data;
            set((state) => ({
                typingUsers: state.typingUsers.filter(u => !(u.userId === typingUserId && u.chatId === chatId))
            }));
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            console.log("🔌 Disconnecting socket");
            socket.removeAllListeners();
            socket.disconnect();
            set({ 
                socket: null, 
                connectionStatus: 'disconnected',
                onlineUsers: [],
                typingUsers: []
            });
        }
    },

    setSelectedContact: (contact) => {
        const { socket, loginId, selectedContact } = get();
        
        // Leave previous chat
        if (selectedContact && socket && loginId) {
            const oldChatId = getChatId(loginId, selectedContact.user.id);
            socket.emit("chat:leave", oldChatId);
            get().stopTyping(selectedContact.user.id);
        }

        // Join new chat
        if (contact && socket && loginId) {
            const newChatId = getChatId(loginId, contact.user.id);
            socket.emit("chat:join", newChatId);
            
            // Load messages for this contact (filter from all messages)
            const contactMessages = get().messages.filter(msg => 
                (msg.from === contact.user.id && msg.to === loginId) ||
                (msg.from === loginId && msg.to === contact.user.id)
            );
            
            set({ 
                selectedContact: contact,
                messages: contactMessages
            });
        } else {
            set({ 
                selectedContact: contact,
                messages: []
            });
        }
    },

    setMessages: (messages) => {
        set({ messages });
        get().deduplicateMessages();
    },

    addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }));
        get().deduplicateMessages();
    },

    sendMessage: (text, receiverId) => {
        const { socket, loginId } = get();
        
        if (!socket || !loginId) {
            console.error("❌ Cannot send message: Socket not connected or user not logged in");
            return;
        }

        const messageId = generateMessageId();
        const timestamp = new Date().toISOString();
        
        // Add optimistic message
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

        // Send via socket
        socket.emit("message:send", {
            id: messageId,
            to: receiverId,
            message: text,
            timestamp
        });

        console.log(`� Sending message to user ${receiverId}: ${text}`);
    },

    startTyping: (receiverId) => {
        const { socket, loginId } = get();
        if (socket && loginId) {
            const chatId = getChatId(loginId, receiverId);
            socket.emit("typing:start", { chatId, receiverUserId: receiverId });
        }
    },

    stopTyping: (receiverId) => {
        const { socket, loginId } = get();
        if (socket && loginId) {
            const chatId = getChatId(loginId, receiverId);
            socket.emit("typing:stop", { chatId, receiverUserId: receiverId });
        }
    },

    handleIncomingMessage: (messageData) => {
        const { from, message, timestamp, id } = messageData;
        const { selectedContact, loginId } = get();
        
        const newMessage: Message = {
            id: id || generateMessageId(),
            text: message,
            isSender: false,
            timestamp,
            from,
            to: loginId || undefined
        };

        // Only add to current chat if it matches selected contact
        if (selectedContact && selectedContact.user.id === from) {
            get().addMessage(newMessage);
        } else {
            // TODO: Store in background for other chats or show notification
            console.log("📨 Message received for different chat:", messageData);
        }
    },

    handleMessageSent: (messageData) => {
        const { id: realId, message, timestamp, from, to } = messageData;
        const { selectedContact, loginId } = get();
        
        // Check if we already have this message (optimistic update)
        const existingMessage = get().messages.find(msg => 
            msg.id === realId || 
            (msg.text === message && msg.status === 'sending')
        );

        if (existingMessage) {
            // Update existing optimistic message
            set((state) => ({
                messages: state.messages.map(msg => {
                    if (msg.id === existingMessage.id || 
                        (msg.text === message && msg.status === 'sending')) {
                        return {
                            ...msg,
                            id: realId, // Update with real database ID
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
                if (seen.has(key)) {
                    return false;
                }
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