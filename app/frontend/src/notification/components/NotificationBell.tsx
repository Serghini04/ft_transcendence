import { Notifications } from "@mui/icons-material";
import { useNotificationStore } from "../store/useNotificationStroe";

export function NotificationBell() {
  const unseen = useNotificationStore((s) => s.unseenNotifications);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  return (
    <div className="relative cursor-pointer" onClick={markAllAsRead}>
      <Notifications className="text-gray-300 hover:text-white w-6 h-6" />

      {unseen > 0 && (
        <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] px-1 rounded-full">
          {unseen}
        </span>
      )}
    </div>
  );
}
