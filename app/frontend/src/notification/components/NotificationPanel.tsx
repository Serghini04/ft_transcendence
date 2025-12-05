import { useNotificationStore, type Notification } from "../store/useNotificationStroe";
import { formatDistanceToNow } from "date-fns";
import { X, Check, CheckCheck } from "lucide-react";

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, unseenNotifications } = useNotificationStore();

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-20 right-4 w-96 max-h-[600px] bg-[#0d2234] rounded-lg shadow-2xl z-50 flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {unseenNotifications > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {unseenNotifications}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unseenNotifications > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <CheckCheck size={48} className="mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
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
      className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
        isUnread ? "bg-blue-900/10" : ""
      }`}
      onClick={() => isUnread && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-white truncate">
              {notification.title}
            </h3>
            {isUnread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
            {notification.type && (
              <>
                <span>•</span>
                <span className="capitalize">{notification.type}</span>
              </>
            )}
          </div>
        </div>
        {isUnread && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
            title="Mark as read"
          >
            <Check size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
