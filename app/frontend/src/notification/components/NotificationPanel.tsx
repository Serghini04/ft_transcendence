import { useNotificationStore, type Notification } from "../store/useNotificationStroe";
import { formatDistanceToNow } from "date-fns";
import { X, CheckCheck, Bell, Check, XCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { acceptTournamentInvitation, declineTournamentInvitation } from "../../Game/components/tournament/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UseTokenStore } from "../../userAuth/zustand/useStore";

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userId = UseTokenStore((state) => state.userId);
  const updateNotificationMetadata = useNotificationStore((state) => state.updateNotificationMetadata);

  // Check invitation status on mount for tournament invitations
  useEffect(() => {
    const checkInvitationStatus = async () => {
      if (notification.type === 'tournament_invite' && 
          notification.metadata?.invitationId && 
          !notification.metadata?.status) {
        try {
          const response = await fetch(
            `http://localhost:8080/api/v1/game/tournament-invitations/${notification.metadata.invitationId}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.invitation && data.invitation.status !== 'pending') {
              // Update local state with the actual status
              updateNotificationMetadata(notification.metadata.invitationId, data.invitation.status);
            }
          }
        } catch (error) {
          // Silently fail - not critical
          console.error('Failed to check invitation status:', error);
        }
      }
    };

    checkInvitationStatus();
  }, [notification, updateNotificationMetadata]);

  const handleAcceptInvitation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!notification.metadata?.invitationId || !userId) {
      toast.error("Invalid invitation data");
      return;
    }

    setLoading(true);
    try {
      const response = await acceptTournamentInvitation(
        notification.metadata.invitationId,
        String(userId)
      );

      if (response.success) {
        toast.success(`You joined ${notification.metadata.tournamentName}! 🎉`);
        
        // Update notification metadata with 'accepted' status
        updateNotificationMetadata(notification.metadata.invitationId, 'accepted');
        
        // Mark notification as read
        onMarkAsRead(notification.id);
        
        // Navigate to tournament bracket
        if (notification.metadata.tournamentId) {
          navigate('/game/tournament', { 
            state: { openTournamentId: notification.metadata.tournamentId } 
          });
        }
      }
    } catch (error: any) {
      // If already responded, update UI to reflect that
      if (error.message?.includes('already responded') || error.message?.includes('400')) {
        updateNotificationMetadata(notification.metadata.invitationId!, 'accepted');
        toast.info("You already responded to this invitation");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to accept invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvitation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!notification.metadata?.invitationId || !userId) {
      toast.error("Invalid invitation data");
      return;
    }

    setLoading(true);
    try {
      const response = await declineTournamentInvitation(
        notification.metadata.invitationId,
        String(userId)
      );

      if (response.success) {
        toast.info("Invitation declined");
        
        // Update notification metadata with 'declined' status
        updateNotificationMetadata(notification.metadata.invitationId, 'declined');
        
        // Mark notification as read
        onMarkAsRead(notification.id);
      }
    } catch (error: any) {
      // If already responded, update UI to reflect that
      if (error.message?.includes('already responded') || error.message?.includes('400')) {
        updateNotificationMetadata(notification.metadata.invitationId!, 'declined');
        toast.info("You already responded to this invitation");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to decline invitation");
      }
    } finally {
      setLoading(false);
    }
  };

  const isTournamentInvite = notification.type === 'tournament_invite';

  return (
    <div
      className={`p-3 hover:bg-[#0C7368]/10 transition-all duration-200 border-b border-gray-800/50 ${
        isUnread ? "bg-[#0C7368]/5" : ""
      } ${!isTournamentInvite ? "cursor-pointer" : ""}`}
      onClick={() => !isTournamentInvite && isUnread && onMarkAsRead(notification.id)}
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
          
          {/* Tournament Invitation Actions */}
          {isTournamentInvite && notification.metadata && !notification.metadata.status && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAcceptInvitation}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C7368] hover:bg-[#0A5B52] text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                Accept
              </button>
              <button
                onClick={handleDeclineInvitation}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={14} />
                Decline
              </button>
            </div>
          )}

          {/* Show status if already responded */}
          {isTournamentInvite && notification.metadata && notification.metadata.status && (
            <div className="mt-2">
              {notification.metadata.status === 'accepted' ? (
                <span className="text-xs text-green-400 font-medium">
                  ✓ Accepted
                </span>
              ) : notification.metadata.status === 'declined' ? (
                <span className="text-xs text-gray-500 font-medium">
                  ✗ Declined
                </span>
              ) : null}
            </div>
          )}
          
          <span className="text-[10px] text-gray-600 block mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}