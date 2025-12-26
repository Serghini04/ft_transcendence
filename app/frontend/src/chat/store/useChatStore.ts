import { create } from 'zustand';
import { io, Socket } from "socket.io-client";
import { UseTokenStore } from '../../userAuth/zustand/useStore';
import { showToast } from '../hooks/useChatToast';

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
    contacts: Contact[];
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
    setContacts: (contacts: Contact[]) => void;
    fetchContacts: () => Promise<void>;
    refreshContacts: () => Promise<void>;

    handleIncomingMessage: (messageData: any) => void;
    handleMessageSent: (messageData: any) => void;
    handleMessageError: (errorData: any) => void;
    updateMessageStatus: (messageId: string | number, status: Message['status']) => void;
    deduplicateMessages: () => void;
    handleBlockEvent: (data: { userId: number; blockedBy: number }) => void;
    handleUnblockEvent: (data: { userId: number; unblockedBy: number }) => void;
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
            transports: ['websocket'],
            path: '/socket.io',
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 10000,
            upgrade: false,
            forceNew: false,
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

        socket.on("user:blocked", (data: { userId: number, blockedBy: number }) => {
            get().handleBlockEvent(data);
        });

        socket.on("user:unblocked", (data: { userId: number, unblockedBy: number }) => {
            get().handleUnblockEvent(data);
        });

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
            
            showToast({
                message: `${data.challengerName} challenged you to a game! Click Accept to start playing.`,
                type: 'challenge',
                duration: 10000,
                onAccept: () => {
                    gameSocket.emit('game:challenge:accept', { challengeId: data.challengeId });
                }
            });
            
            // Auto-decline after 10 seconds if no action taken
            setTimeout(() => {
                gameSocket.emit('game:challenge:decline', { challengeId: data.challengeId });
            }, 10000);
        });
        
        gameSocket.on("game:challenge:accepted", (data) => {
            console.log("✅ Challenge accepted!", data);
            showToast({
                message: 'Challenge accepted! Redirecting to game...',
                type: 'success',
                duration: 2000
            });
            setTimeout(() => {
                window.location.href = `/game/challenge?roomId=${data.gameRoomId}`;
            }, 1000);
        });
        
        gameSocket.on("game:challenge:declined", (data) => {
            console.log("❌ Challenge declined", data);
            showToast({
                message: 'Your challenge was declined',
                type: 'info',
                duration: 5000
            });
        });
        
        gameSocket.on("game:challenge:unavailable", (data) => {
            console.log("⚠️ Challenge unavailable", data);
            showToast({
                message: data.reason || 'User is not available for a challenge',
                type: 'error',
                duration: 5000
            });
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
        set((state) => {
            const exists = state.messages.some(msg => 
                msg.id === message.id || 
                (msg.text === message.text && msg.timestamp === message.timestamp && msg.from === message.from)
            );
            
            if (exists)
                return state;
            return { messages: [...state.messages, message] };
        });
    },

    sendMessage: (text, receiverId) => {
        const { socket, loginId } = get();
        
        if (!socket?.connected) {
            console.error("Socket not connected");
            return;
        }
        
        if (!loginId)
            return;

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
        const { selectedContact, loginId, messages } = get();

        console.log("Current state:", { 
            from, 
            loginId, 
            selectedContactId: selectedContact?.user.id,
            hasSelectedContact: !!selectedContact,
            currentMessagesCount: messages.length
        });

        if (from === loginId)
            return;

        // Check if this message already exists
        const messageExists = messages.some(msg => 
            msg.id === id || 
            (msg.text === message && msg.timestamp === timestamp && msg.from === from)
        );

        if (messageExists)
            return;

        if (selectedContact && selectedContact.user.id === from && loginId) {
            const newMessage: Message = {
                id: id || generateMessageId(),
                text: message,
                isSender: false,
                timestamp,
                from,
                to: loginId,
                status: 'sent'
            };
            
            set((state) => ({
                messages: [...state.messages, newMessage]
            }));
        } else {
            get().incrementUnseenMessages(from);
        }
    },

    handleMessageSent: (messageData) => {
        const { id: realId, message, timestamp, from, to } = messageData;
        const { selectedContact, loginId, messages } = get();
        
        if (!selectedContact || !loginId)
            return;
        
        const isCurrentConversation = 
            (from === loginId && to === selectedContact.user.id) || 
            (from === selectedContact.user.id && to === loginId);
            
        if (!isCurrentConversation)
            return;
        
        const existingMessage = messages.find(msg => 
            msg.text === message && 
            msg.status === 'sending' &&
            msg.from === from &&
            msg.to === to
        );

        if (existingMessage) {
            set((state) => ({
                messages: state.messages.map(msg => {
                    if (msg.id === existingMessage.id) {
                        return {
                            ...msg,
                            id: realId,
                            timestamp: timestamp,
                            status: 'sent' as const
                        };
                    }
                    return msg;
                })
            }));
        } else {
            // Check if message with this real ID already exists
            const messageWithRealIdExists = messages.some(msg => msg.id === realId);
            
            if (!messageWithRealIdExists) {
                const newMessage: Message = {
                    id: realId,
                    text: message,
                    isSender: from === loginId,
                    timestamp,
                    from,
                    to,
                    status: 'sent'
                };
                
                set((state) => ({
                    messages: [...state.messages, newMessage]
                }));
            }
        }
        // Clean up any duplicates
        get().deduplicateMessages();
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

    setContacts: (contacts: Contact[]) => {
        set({ contacts });
    },

    fetchContacts: async () => {
        const { token } = UseTokenStore.getState();
        try {
            const response = await fetch('http://localhost:8080/api/v1/chat/contacts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });
            
            if (response.ok) {
                const contacts = await response.json();
                set({ contacts });
                get().initializeUnseenCounts(contacts);
                
                // Update selected contact if it exists
                const currentSelectedContact = get().selectedContact;
                if (currentSelectedContact) {
                    const updatedSelectedContact = contacts.find(
                        (contact: Contact) => contact.user.id === currentSelectedContact.user.id
                    );
                    if (updatedSelectedContact) {
                        set({ selectedContact: updatedSelectedContact });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        }
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
        // Use fetchContacts to update both contacts list and selectedContact
        await get().fetchContacts();
    },

    handleBlockEvent: (data: { userId: number; blockedBy: number }) => {
        const { loginId, selectedContact } = get();
        
        if (loginId === data.userId) {
            console.log("You have been blocked by user:", data.blockedBy);
            get().refreshContacts();
            if (selectedContact && selectedContact.user.id === data.blockedBy) {
                showToast({
                    message: `${selectedContact.user.fullName} has blocked you`,
                    type: 'error',
                    duration: 5000
                });
            }
        }
        else if (loginId === data.blockedBy) {
            console.log("Block confirmed from server for user:", data.userId);
            get().refreshContacts();
        }
    },

    handleUnblockEvent: (data: { userId: number; unblockedBy: number }) => {
        const { loginId, selectedContact } = get();
        if (loginId === data.userId) {
            console.log("You have been unblocked by user:", data.unblockedBy);
            get().refreshContacts();
            if (selectedContact && selectedContact.user.id === data.unblockedBy) {
                showToast({
                    message: `${selectedContact.user.fullName} has unblocked you`,
                    type: 'success',
                    duration: 5000
                });
            }
        }
        else if (loginId === data.unblockedBy) {
            console.log("Unblock confirmed from server for user:", data.userId);
            get().refreshContacts();
        }
    },
}));