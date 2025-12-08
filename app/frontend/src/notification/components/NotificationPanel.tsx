import { useNotificationStore, type Notification } from "../store/useNotificationStroe";
import { formatDistanceToNow } from "date-fns";
import { X, CheckCheck, Bell } from "lucide-react";
import { createPortal } from "react-dom";

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, unseenNotifications } = useNotificationStore();

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose} 
      />

      <div 
        className="fixed top-20 right-4 w-80 max-h-[500px] bg-gradient-to-b from-[#0d2234] to-[#0a1826] rounded-xl shadow-2xl z-[9999] flex flex-col border border-[#0C7368]/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0C7368]/10 border-b border-[#0C7368]/20">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#0C7368]" />
            <h2 className="text-base font-semibold text-white">Notifications</h2>
            {unseenNotifications > 0 && (
              <span className="bg-[#0C7368] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unseenNotifications}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unseenNotifications > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#0C7368] hover:text-[#0A5B52] transition-colors font-medium"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#0C7368]/30 scrollbar-track-transparent">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <CheckCheck size={40} className="mb-2 opacity-40" />
              <p className="text-sm">All caught up! 🎉</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const isUnread = !notification.read;

  return (
    <div
      className={`p-3 hover:bg-[#0C7368]/10 transition-all duration-200 cursor-pointer border-b border-gray-800/50 ${
        isUnread ? "bg-[#0C7368]/5" : ""
      }`}
      onClick={() => isUnread && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isUnread && (
              <div className="w-1.5 h-1.5 bg-[#0C7368] rounded-full flex-shrink-0 animate-pulse" />
            )}
            <h3 className="text-sm font-medium text-white truncate">
              {notification.title}
            </h3>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 mb-1.5">
            {notification.message}
          </p>
          <span className="text-[10px] text-gray-600">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}