import { create } from 'zustand';
import { io, Socket } from "socket.io-client";
import { UseTokenStore } from '../../userAuth/LoginAndSignup/zustand/useStore';

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
    blockStatus: 'blocked_by_me' | 'blocked_by_them' | 'none';
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
    gameSocket: Socket | null;
    selectedContact: Contact | null;
    messages: Message[];
    contacts: ContactUser[];
    onlineUsers: Set<number>;
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
    blockUser: (userId: number) => Promise<{ success: boolean; message: string }>;
    unblockUser: (userId: number) => Promise<{ success: boolean; message: string }>;
    refreshContacts: () => Promise<void>;

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
    gameSocket: null,
    contacts: [],
    messages: [],
    onlineUsers: new Set<number>(),
    unseenMessageCounts: new Map<number, number>(),
    isNotificationsMuted: false,
    
    connectSocket: (userId) => {
        const { token } = UseTokenStore.getState();
        const currentSocket = get().socket;

        if (currentSocket?.connected) {
            console.log("Socket already connected");
            return;
        }
        if (currentSocket) {
            console.log("Disconnecting existing socket before connecting");
            currentSocket.removeAllListeners();
            currentSocket.disconnect();
        }

        if (!token) {
            console.error("No token available for socket connection");
            window.location.href = "/auth";
            return;
        }

        set({
            loginId: userId,
            messages: [],
            selectedContact: null
        });

        console.log("Connecting to Gateway with userId:", userId);
        const socket = io("http://localhost:8080/chat", {
            withCredentials: true,
            auth: { token },
            transports: ['polling', 'websocket'],
            path: '/socket.io',
            reconnection: true,
            reconnectionAttempts: 10,
        });

        socket.io.on("error", (err) => console.error("Socket.IO manager error", err));

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id, "transport:", socket.io.engine.transport.name);

            const { selectedContact } = get();
            if (selectedContact) {
                const chatId = getChatId(userId, selectedContact.user.id);
                console.log("📨 Rejoining chat:", chatId);
                socket.emit("chat:join", chatId);
            }
        });

        // handle connect_error (handshake errors like NO_TOKEN, INVALID_TOKEN, REFRESH_INVALID)
        socket.on("connect_error", (error: any) => {
            console.error("Socket connect_error:", error?.message ?? error);

            const code = error?.message ?? "";

            if (["NO_TOKEN", "INVALID_TOKEN", "REFRESH_INVALID", "NO_REFRESH_TOKEN"].includes(code)) {
                console.warn("Auth error on socket handshake:", code);

                try {
                    (socket.io as any).opts.reconnection = false;
                } catch (e) {
                    console.warn("Could not toggle reconnection option:", e);
                }

                socket.removeAllListeners();
                socket.disconnect();
                UseTokenStore.getState().setToken("");
                window.location.href = "/auth";
                return;
            }

            console.warn("Non-auth connect_error, will attempt reconnects");
        });

        socket.on("service_error", ({ message }: { message: string }) => {
            console.error("Service error from gateway:", message);
        });

        socket.on("message:receive", (m) => get().handleIncomingMessage(m));
        socket.on("message:sent", (m) => get().handleMessageSent(m));
        socket.on("message:error", (e) => get().handleMessageError(e));
        socket.on("users:online", (ids) => set({ onlineUsers: new Set(ids) }));

        set({ socket });
        
        // Connect to game socket for challenge notifications
        const gameSocket = io("http://localhost:8080/game", {
            withCredentials: true,
            auth: { token, userId },
            transports: ['websocket'],
            path: '/socket.io',
        });
        
        gameSocket.on('connect', () => {
            console.log('Game socket connected for challenges:', gameSocket.id);
        });
        
        // Game challenge events
        gameSocket.on("game:challenge:received", (data) => {
            console.log("🎮 Challenge received:", data);
            const shouldAccept = window.confirm(`${data.challengerName} challenged you to a game! Accept?`);
            if (shouldAccept) {
                gameSocket.emit('game:challenge:accept', { challengeId: data.challengeId });
            } else {
                gameSocket.emit('game:challenge:decline', { challengeId: data.challengeId });
            }
        });
        
        gameSocket.on("game:challenge:accepted", (data) => {
            console.log("✅ Challenge accepted!", data);
            window.location.href = `/game/challenge?roomId=${data.gameRoomId}`;
        });
        
        gameSocket.on("game:challenge:declined", (data) => {
            console.log("❌ Challenge declined", data);
            alert('Challenge was declined');
        });
        
        gameSocket.on("game:challenge:unavailable", (data) => {
            console.log("⚠️ Challenge unavailable", data);
            alert(data.reason || 'User is not available');
        });
        
        set({ gameSocket });
    },


    disconnectSocket: () => {
        const { socket, gameSocket } = get();
        if (socket) {
            console.log("Disconnecting chat socket");
            socket.removeAllListeners();
            socket.disconnect();
        }
        if (gameSocket) {
            console.log("Disconnecting game socket");
            gameSocket.removeAllListeners();
            gameSocket.disconnect();
        }
        set({ 
            socket: null,
            gameSocket: null,
            onlineUsers: new Set<number>()
        });
    },

    resetStore: () => {
        console.log("Resetting chat store completely");
        const { socket, gameSocket } = get();
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
        if (gameSocket) {
            gameSocket.removeAllListeners();
            gameSocket.disconnect();
        }
        set({
            loginId: null,
            selectedContact: null,
            socket: null,
            gameSocket: null,
            contacts: [],
            messages: [],
            onlineUsers: new Set<number>(),
            unseenMessageCounts: new Map<number, number>(),
            isNotificationsMuted: false
        });
    },

    toggleNotificationsMute: () => {
        const { isNotificationsMuted } = get();
        set({ isNotificationsMuted: !isNotificationsMuted });
        console.log(`Notifications ${!isNotificationsMuted ? 'muted' : 'unmuted'}`);
    },

    setSelectedContact: (contact) => {
        const { socket, loginId, selectedContact } = get();

        if (selectedContact && socket && loginId) {
            const oldChatId = getChatId(loginId, selectedContact.user.id);
            console.log("Leaving chat:", oldChatId);
            socket.emit("chat:leave", oldChatId);
        }

        set({ 
            selectedContact: contact,
            messages: []
        });

        if (contact && socket && loginId) {
            const newChatId = getChatId(loginId, contact.user.id);
            console.log("Joining chat:", newChatId);
            socket.emit("chat:join", newChatId);
            

            get().markMessagesAsSeen(contact.user.id);
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
            console.error("Socket not connected");
            return;
        }
        
        if (!loginId) {
            console.error("No loginId");
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

        console.log("Sending message:", {
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
    },

    toggleNotificationsMute: () => {
        set((state) => ({ isNotificationsMuted: !state.isNotificationsMuted }));
    },

    blockUser: async (userId: number) => {
        const { token } = UseTokenStore.getState();
        try {
            const response = await fetch(`http://localhost:8080/api/v1/chat/block/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });
            
            const data = await response.json();
            
            if (response.ok) {
                await get().refreshContacts();
                return { success: true, message: data.message || 'User blocked successfully' };
            }
            return { success: false, message: data.error || 'Failed to block user' };
        } catch (error) {
            console.error('Block user error:', error);
            return { success: false, message: 'Failed to block user' };
        }
    },

    unblockUser: async (userId: number) => {
        const { token } = UseTokenStore.getState();
        try {
            const response = await fetch(`http://localhost:8080/api/v1/chat/unblock/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });
            
            const data = await response.json();
            
            if (response.ok) {
                await get().refreshContacts();
                return { success: true, message: data.message || 'User unblocked successfully' };
            }
            return { success: false, message: data.error || 'Failed to unblock user' };
        } catch (error) {
            console.error('Unblock user error:', error);
            return { success: false, message: 'Failed to unblock user' };
        }
    },

    refreshContacts: async () => {
        const { token } = UseTokenStore.getState();
        const currentSelectedContact = get().selectedContact;
        
        try {
            const response = await fetch('http://localhost:8080/api/v1/chat/contacts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });
            
            if (response.ok) {
                const updatedContacts = await response.json();
                if (currentSelectedContact) {
                    const updatedSelectedContact = updatedContacts.find(
                        (contact: Contact) => contact.user.id === currentSelectedContact.user.id
                    );
                    if (updatedSelectedContact)
                        set({ selectedContact: updatedSelectedContact });
                }
            }
        } catch (error) {
            console.error('Failed to refresh contacts:', error);
        }
    },
}));