import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { UseTokenStore } from "../../userAuth/zustand/useStore";
import { toastManager } from "../utils/toastManager";

export type Notification = {
  id: number;
  userId: number;
  title: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

type NotificationStore = {
  loginId: number | null;
  socket: Socket | null;
  unseenNotifications: number;
  notifications: Notification[];
  onlineUsers: Set<number>;
  isLoading: boolean;
  error: string | null;

  connectSocket: (userId: number) => void;
  disconnectSocket: () => void;

  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: number) => void;

  clearError: () => void;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  loginId: null,
  socket: null,
  unseenNotifications: 0,
  notifications: [],
  onlineUsers: new Set<number>(),
  isLoading: false,
  error: null,

  connectSocket: (userId) => {
    const { token } = UseTokenStore.getState();
    const currentSocket = get().socket;

    if (currentSocket?.connected)
      return;

    if (currentSocket) {
      currentSocket.removeAllListeners();
      currentSocket.disconnect();
    }

    if (!token) {
      console.error("No token available for socket connection");
      window.location.href = "/auth";
      return;
    }

    set({ loginId: userId, error: null });

    const socket = io(SOCKET_URL +"/notification", {
      withCredentials: true,
      auth: { token, userId },
      transports: ["websocket", "polling"],
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      set({ socket, error: null });
      
      get().fetchNotifications();
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      set({ error: "Failed to connect to notification service" });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect")
        socket.connect();
    });

    socket.on("users:online", (ids: number[]) => {
      set({ onlineUsers: new Set(ids) });
    });

    socket.on("notification:new", (notification: Notification & { metadata?: { senderId?: number; senderName?: string } }) => {
      get().addNotification(notification);

      // Map notification type to toast type
      const getNotificationType = (type: string): "message" | "friend_request" | "game" | "default" => {
        switch (type) {
          case "message":
            return "message";
          case "friend_request":
            return "friend_request";
          case "game":
            return "game";
          default:
            return "default";
        }
      };

      toastManager.show({
        id: `notification-${notification.id}`,
        title: notification.title,
        message: notification.message,
        type: getNotificationType(notification.type),
        autoHideDuration: notification.type === 'friend_request' ? undefined : 5000,
        metadata: notification.metadata,
      });
    });

    socket.on("notification:read", (notificationId: number) => {
      const { notifications } = get();
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      const unseenCount = updated.filter((n) => !n.read).length;
      set({ notifications: updated, unseenNotifications: unseenCount });
    });

    socket.on("notification:read-all", () => {
      const { notifications } = get();
      const updated = notifications.map((n) => ({ ...n, read: true }));
      set({ notifications: updated, unseenNotifications: 0 });
    });

    socket.io.on("error", (err) => {
      console.error("Socket.IO manager error:", err);
      set({ error: "Socket manager error occurred" });
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
        onlineUsers: new Set<number>(),
        loginId: null,
      });
    }
  },

  fetchNotifications: async () => {
    const { token, setToken } = UseTokenStore.getState();
    const { loginId } = get();

    if (!token || !loginId) return;

    set({ isLoading: true, error: null });

    try {
      let currentToken = token;
      let response = await fetch(`${API_URL}/api/v1/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      let data = await response.json();
      
      // Handle token refresh
      if (data.code === 'TOKEN_REFRESHED' && data.accessToken) {
        setToken(data.accessToken);
        currentToken = data.accessToken;
        
        // Retry with new token
        response = await fetch(`${API_URL}/api/v1/notifications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`
          },
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.statusText}`);
        }
        
        data = await response.json();
      }
      
      const notifications: Notification[] = Array.isArray(data) ? data : [];
      const unseenCount = notifications.filter((n) => !n.read).length;

      set({
        notifications,
        unseenNotifications: unseenCount,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
        isLoading: false,
      });
    }
  },

  markAllAsRead: async () => {
    const { token } = UseTokenStore.getState();
    const { loginId } = get();

    if (!token || !loginId) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      const { notifications } = get();
      const updated = notifications.map((n) => ({ ...n, read: true }));
      
      set({
        notifications: updated,
        unseenNotifications: 0,
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      set({ error: error instanceof Error ? error.message : "Failed to mark as read" });
    }
  },

  markAsRead: async (notificationId: number) => {
    const { token } = UseTokenStore.getState();
    const { loginId } = get();

    if (!token || !loginId)
        return;

    try {
      const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error("Failed to mark notification as read");

      const { notifications } = get();
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      const unseenCount = updated.filter((n) => !n.read).length;

      set({
        notifications: updated,
        unseenNotifications: unseenCount,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      set({ error: error instanceof Error ? error.message : "Failed to mark as read" });
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unseenNotifications } = get();
    
    const exists = notifications.some((n) => n.id === notification.id);
    if (exists) return;

    set({
      notifications: [notification, ...notifications],
      unseenNotifications: notification.read ? unseenNotifications : unseenNotifications + 1,
    });
  },

  removeNotification: (notificationId: number) => {
    const { notifications, unseenNotifications } = get();
    const notification = notifications.find((n) => n.id === notificationId);
    const updatedNotifications = notifications.filter((n) => n.id !== notificationId);
    
    set({
      notifications: updatedNotifications,
      unseenNotifications: notification && !notification.read 
        ? Math.max(0, unseenNotifications - 1)
        : unseenNotifications,
    });
  },

  clearError: () => set({ error: null }),
}));