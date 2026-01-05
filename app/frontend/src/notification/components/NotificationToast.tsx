import { MessageCircle, Users, Gamepad2, Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationToastProps {
  id: string;
  title: string;
  message: string;
  type: "message" | "friend_request" | "game" | "default";
  onClose: () => void;
  autoHideDuration?: number;
}

export function NotificationToast({ 
  id,
  title,
  message, 
  type,
  onClose, 
  autoHideDuration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const hideTimer = setTimeout(() => {
      handleClose();
    }, autoHideDuration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (autoHideDuration / 100));
        return newProgress < 0 ? 0 : newProgress;
      });
    }, 100);

    return () => {
      clearTimeout(hideTimer);
      clearInterval(progressInterval);
    };
  }, [autoHideDuration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "message":
        return {
          bg: "from-[#0C7368] to-[#0A5B52]",
          border: "border-[#0C7368]",
          icon: <MessageCircle size={20} className="text-teal-300" />,
          progressBg: "bg-teal-300"
        };
      case "friend_request":
        return {
          bg: "from-[#00912E] to-[#007A26]",
          border: "border-green-400",
          icon: <Users size={20} className="text-green-300" />,
          progressBg: "bg-green-300"
        };
      case "game":
        return {
          bg: "from-[#112434] to-[#0d2234]",
          border: "border-blue-400",
          icon: <Gamepad2 size={20} className="text-blue-300" />,
          progressBg: "bg-blue-300"
        };
      default:
        return {
          bg: "from-[#1A2D42] to-[#112434]",
          border: "border-gray-400",
          icon: <Bell size={20} className="text-gray-300" />,
          progressBg: "bg-gray-300"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      data-toast-id={id}
      className={`
        fixed top-24 right-4 z-[10000] 
        w-80 bg-gradient-to-br ${styles.bg}
        rounded-xl shadow-2xl border ${styles.border}
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[400px] opacity-0'}
      `}
    >
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${styles.progressBg} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {styles.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold mb-1">
              {title}
            </p>
            <p className="text-white/90 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-300 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
