import { Notifications } from "@mui/icons-material";
import { useState } from "react";
import { useNotificationStore } from "../store/useNotificationStroe";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const [showPanel, setShowPanel] = useState(false);
  const unseenNotifications = useNotificationStore((s) => s.unseenNotifications);

  return (
    <>
      <div 
        className="relative cursor-pointer" 
        onClick={() => setShowPanel(!showPanel)}
      >
        <Notifications className="text-gray-300 hover:text-white w-6 h-6" />

        {unseenNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {unseenNotifications > 99 ? '99+' : unseenNotifications}
          </span>
        )}
      </div>

      {showPanel && (
        <NotificationPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}
