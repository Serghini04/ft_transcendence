import { Sword, X, Check } from "lucide-react";
import { useEffect, useState } from "react";

interface ChallengeToastProps {
  message: string;
  onClose: () => void;
  onAccept?: () => void;
  autoHideDuration?: number;
  type?: 'success' | 'error' | 'info' | 'challenge';
}

export function ChallengeToast({ 
  message, 
  onClose, 
  onAccept, 
  autoHideDuration = 5000,
  type = 'info'
}: ChallengeToastProps) {
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

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    handleClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'challenge':
        return {
          bg: 'from-[#112434] to-[#1A2D42]',
          border: 'border-[#0C7368]',
          icon: <Sword size={20} className="text-[#0C7368]" />,
          progressBg: 'bg-[#0C7368]'
        };
      case 'success':
        return {
          bg: 'from-[#00912E] to-[#007A26]',
          border: 'border-green-400',
          icon: <Check size={20} className="text-green-300" />,
          progressBg: 'bg-green-300'
        };
      case 'error':
        return {
          bg: 'from-[#A33B2E] to-[#8E3125]',
          border: 'border-red-400',
          icon: <X size={20} className="text-red-300" />,
          progressBg: 'bg-red-300'
        };
      default:
        return {
          bg: 'from-[#1A2D42] to-[#112434]',
          border: 'border-blue-400',
          icon: <Sword size={20} className="text-blue-300" />,
          progressBg: 'bg-blue-300'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
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
            <p className="text-white text-sm font-medium leading-relaxed">
              {message}
            </p>

            {/* Action Buttons for Challenge */}
            {type === 'challenge' && onAccept && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-[#0C7368] hover:bg-[#0A5B52] text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  Accept
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  Decline
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
