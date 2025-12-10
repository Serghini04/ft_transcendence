import { create } from 'zustand';
import { io, Socket } from "socket.io-client";
import axiosInstance from "../app/axios";
import { UseTokenStore } from '../../userAuth/zustand/useStore';
import { isValid } from 'date-fns';
import isValidToken from '../../globalUtils/isValidToken';

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
    const { token } = UseTokenStore.getState();
    const currentSocket = get().socket;
    
    // Prevent duplicate connections
    if (currentSocket?.connected) {
        console.log("✅ Socket already connected");
        return;
    }

    // Disconnect existing socket if present
    if (currentSocket) {
        console.log("🔄 Disconnecting existing socket");
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
    }

    if (!token) {
        console.error("❌ No token available for socket connection");
        // setToken("");
        window.location.href = "/auth";
        set({ connectionStatus: 'error' });
        return;
    }
    
    set({ 
        loginId: userId, 
        connectionStatus: 'connecting',
        messages: [],
        selectedContact: null
    });

    console.log("🔌 Connecting to socket with userId:", userId);
    console.log("🔑 Token:", token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    const socket = io("http://localhost:8080", {
        withCredentials: true,
        auth: { 
            token: token  // ✅ SEND TOKEN - gateway will extract userId from it
        },
        reconnection: true,
        reconnectionAttempts: 10,
        transports: ['polling', 'websocket'],
        path: '/socket.io',
    });

    // Debug transport
    socket.io.on("error", (error) => {
        console.error("🔥 Socket.IO Manager Error:", error);
    });

    socket.io.engine.on("packet", ({ type, data }) => {
        console.log(`📦 Engine packet: ${type}`, data);
    });

    socket.io.engine.on("packetCreate", ({ type, data }) => {
        console.log(`📤 Engine sending: ${type}`, data);
    });

    // Connection successful
    socket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        console.log("🔌 Transport:", socket.io.engine.transport.name);
        console.log("🆔 Socket ID:", socket.id);
        set({ connectionStatus: 'connected' });

        const { selectedContact } = get();
        if (selectedContact) {
            const chatId = getChatId(userId, selectedContact.user.id);
            console.log("📨 Rejoining chat:", chatId);
            socket.emit("chat:join", chatId);
        }
    });

    // Connection error
    socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        console.error("❌ Error details:", {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
        });
        set({ connectionStatus: 'error' });

        // Handle specific auth errors
        if (error.message === "NO_TOKEN" || 
            error.message === "INVALID_TOKEN" || 
            error.message === "REFRESH_INVALID") {
            console.error("🔒 Authentication failed, redirecting to login");
            UseTokenStore.getState().setToken("");
            window.location.href = "/auth";
        }
    });

    // Token refreshed by server
    socket.on("token_refreshed", ({ accessToken }) => {
        console.log("🔄 Token refreshed by server");
        UseTokenStore.getState().setToken(accessToken);
        
        // Update socket auth with new token only
        socket.auth = { 
            token: accessToken  // ✅ Only token
        };
    });

    // Reconnection attempts
    socket.io.on("reconnect_attempt", (attempt) => {
        console.log(`🔄 Reconnection attempt ${attempt}`);
        const newToken = UseTokenStore.getState().token;
        if (newToken) {
            socket.auth = { token: newToken };  // ✅ Only token
        }
        set({ connectionStatus: 'connecting' });
    });

    socket.io.on("reconnect", (attempt) => {
        console.log(`✅ Reconnected after ${attempt} attempts`);
        set({ connectionStatus: 'connected' });
    });

    socket.io.on("reconnect_failed", () => {
        console.error("❌ Reconnection failed");
        set({ connectionStatus: 'error' });
    });

    // Disconnection
    socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        set({ connectionStatus: 'disconnected' });

        // If server initiated disconnect, reconnect manually
        if (reason === "io server disconnect") {
            console.log("🔄 Server disconnected, attempting manual reconnect");
            socket.connect();
        }
    });

    // Service error from gateway
    socket.on("service_error", ({ message }) => {
        console.error("⚠️ Service error:", message);
        set({ connectionStatus: 'error' });
    });

    // Message handlers
    socket.on("message:receive", (messageData) => {
        console.log("📩 Message received:", messageData);
        get().handleIncomingMessage(messageData);
    });

    socket.on("message:sent", (messageData) => {
        console.log("✉️ Message sent confirmation:", messageData);
        get().handleMessageSent(messageData);
    });

    socket.on("message:error", (errorData) => {
        console.error("❌ Message error:", errorData);
        get().handleMessageError(errorData);
    });

    socket.on("users:online", (userIds) => {
        console.log("👥 Online users updated:", userIds);
        set({ onlineUsers: new Set(userIds) });
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
        // const { token } = UseTokenStore.getState();

        // Leave previous chat
        if (selectedContact && socket && loginId) {
            const oldChatId = getChatId(loginId, selectedContact.user.id);
            console.log("👋 Leaving chat:", oldChatId);
            socket.emit("chat:leave", oldChatId);
        }

        set({ 
            selectedContact: contact,
            messages: []
        });

        // Join new chat
        if (contact && socket && loginId) {
            const newChatId = getChatId(loginId, contact.user.id);
            console.log("👋 Joining chat:", newChatId);
            socket.emit("chat:join", newChatId);
            
            // Mark messages as seen
            get().markMessagesAsSeen(contact.user.id);
            
            // Notify server
            // axiosInstance.patch(
            //     `/api/v1/chat/messages/${contact.user.id}/seen`,
            //     {},
            //     {
            //         headers: {
            //             Authorization: `Bearer ${token}`,
            //             'Content-Type': 'application/json'
            //         }
            //     }

            // isValidToken(token);
            // fetch(`http://localhost:8080/api/v1/chat/messages/${contact.user.id}/seen`, {
            //     method: "PATCH",
            //     credentials: "include",
            //     body: JSON.stringify({}),
            //     headers: {
            //         Authorization: `Bearer ${token}`,
            //         'Content-Type': 'application/json'
            //     }
            // }
            
            // ).catch(error => {
            //     console.error('❌ Failed to mark messages as seen:', error);
            // });
        }
    },

    setMessages: (messages) => {
        set({ messages });
        get().deduplicateMessages();
    },

    addMessage: (message) => {
        console.log("📝 Adding message:", message);
        set((state) => ({ messages: [...state.messages, message] }));
        get().deduplicateMessages();
    },

    sendMessage: (text, receiverId) => {
        const { socket, loginId } = get();
        
        if (!socket?.connected) {
            console.error("❌ Socket not connected");
            return;
        }
        
        if (!loginId) {
            console.error("❌ No loginId");
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

        console.log("📤 Sending message:", {
            id: messageId,
            to: receiverId,
            message: text
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
        } else {
            get().incrementUnseenMessages(from);
        }
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

            uniqueMessages.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
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