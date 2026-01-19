import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";
import { useNavigate } from "react-router-dom";
import { useChatToast } from "../../../chat/hooks/useChatToast";
import { UserX, UserCheck, ShieldBan, UserPlus, Clock, CheckCircle, XCircle } from "lucide-react";

interface BioProps {
  userId: number;
  bio: string;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friend' | 'blocked';

export default function Bio({ userId, bio }: BioProps) {
  const { token } = UseTokenStore();
  const { user } = UseUserStore();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useChatToast();
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [blockStatus, setBlockStatus] = useState<'blocked_by_me' | 'blocked_by_them' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const isOwnProfile = user.id === userId;

  useEffect(() => {
    if (!isOwnProfile) {
      fetchFriendshipStatus();
      fetchBlockStatus();
    }
  }, [userId, isOwnProfile]);

  const fetchFriendshipStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/friendship/status/${userId}`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFriendshipStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch friendship status:", err);
    }
  };

  const fetchBlockStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/contacts`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const contacts = await res.json();
        const contact = Array.isArray(contacts) ? contacts.find((c: any) => c.user.id === userId) : null;
        if (contact) {
          setBlockStatus(contact.blockStatus || 'none');
        }
      }
    } catch (err) {
      console.error("Failed to fetch block status:", err);
    }
  };

  const handleSendFriendRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/friends/request/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setFriendshipStatus('pending_sent');
        showSuccessToast('Friend request sent successfully!');
      } else {
        const data = await res.json();
        showErrorToast(data.message || "Failed to send friend request");
      }
    } catch (err) {
      console.error("Failed to send friend request:", err);
      showErrorToast("Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/friends/accept/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Check if response is token refresh
        if (data.code === 'TOKEN_REFRESHED' && data.accessToken) {
          UseTokenStore.getState().setToken(data.accessToken);
          // Retry with new token
          const retryRes = await fetch(`http://localhost:8080/api/v1/chat/friends/accept/${userId}`, {
            method: "POST",
            credentials: "include",
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          if (retryRes.ok) {
            setFriendshipStatus('friend');
          }
        } else {
          setFriendshipStatus('friend');
        }
      }
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      showErrorToast("Failed to accept friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/friends/reject/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Check if response is token refresh
        if (data.code === 'TOKEN_REFRESHED' && data.accessToken) {
          UseTokenStore.getState().setToken(data.accessToken);
          // Retry with new token
          const retryRes = await fetch(`http://localhost:8080/api/v1/chat/friends/reject/${userId}`, {
            method: "POST",
            credentials: "include",
            headers: { Authorization: `Bearer ${data.accessToken}` }
          });
          if (retryRes.ok) {
            setFriendshipStatus('none');
          }
        } else {
          setFriendshipStatus('none');
        }
      }
    } catch (err) {
      console.error("Failed to reject friend request:", err);
      showErrorToast("Failed to reject friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    setIsBlocking(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/block/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBlockStatus('blocked_by_me');
        setFriendshipStatus('blocked');
        showSuccessToast(data.message || 'User blocked successfully');
      } else {
        const data = await res.json();
        showErrorToast(data.error || 'Failed to block user');
      }
    } catch (err) {
      console.error("Failed to block user:", err);
      showErrorToast('An error occurred. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    setIsBlocking(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/chat/unblock/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBlockStatus('none');
        setFriendshipStatus('friend');
        showSuccessToast(data.message || 'User unblocked successfully');
        // Refresh statuses after unblock
        await fetchFriendshipStatus();
      } else {
        const data = await res.json();
        showErrorToast(data.error || 'Failed to unblock user');
      }
    } catch (err) {
      console.error("Failed to unblock user:", err);
      showErrorToast('An error occurred. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const renderFriendButton = () => {
    if (isOwnProfile) return null;

    switch (friendshipStatus) {
      case 'friend':
        // Don't show anything when friends, only Block button will show
        return null;
      
      case 'pending_sent':
        return (
          <motion.button
            disabled
            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] px-5 py-2.5 rounded-xl bg-gray-600/30 text-gray-400 font-semibold cursor-not-allowed shadow-lg"
          >
            <Clock size={16} />
            <span>Pending</span>
          </motion.button>
        );
      
      case 'pending_received':
        return (
          <div className="flex gap-3 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAcceptFriendRequest}
              disabled={loading}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-semibold shadow-lg shadow-emerald-500/30 transition disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-700"
            >
              <CheckCircle size={16} />
              <span>Accept</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRejectFriendRequest}
              disabled={loading}
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-xl bg-gray-700/70 hover:bg-gray-600/70 text-white font-semibold shadow-lg transition disabled:opacity-50"
            >
              <XCircle size={16} />
              <span>Reject</span>
            </motion.button>
          </div>
        );
      
      case 'blocked':
        return (
          <motion.button
            disabled
            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] px-5 py-2.5 rounded-xl bg-gray-700/50 text-gray-400 font-semibold cursor-not-allowed shadow-lg"
          >
            <ShieldBan size={16} />
            <span>Blocked</span>
          </motion.button>
        );
      
      default: // 'none'
        return (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendFriendRequest}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-semibold shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </motion.button>
        );
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between mx-auto gap-4 p-4 pl-[6rem] md:pl-4">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide"
      >
        <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-primary bg-clip-text text-transparent animate-pulse">
          {bio || "No matter how much the bed gets worn, another Messi will never be born"}
        </span>
      </motion.h1>

      {!isOwnProfile && (
        <div className="flex flex-wrap gap-3 mt-4 lg:text-lg md:text-base sm:text-sm text-xs">
          {/* Don't show friend button if user is blocked by me */}
          {blockStatus !== 'blocked_by_me' && renderFriendButton()}
          
          {/* Only show Block/Unblock button if: 
              1. They are friends (can block them)
              2. OR already blocked by me (can unblock)
          */}
          {((friendshipStatus === 'friend' && blockStatus === 'none') || blockStatus === 'blocked_by_me') && blockStatus !== 'blocked_by_them' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={blockStatus === 'blocked_by_me' ? handleUnblockUser : handleBlockUser}
              disabled={isBlocking}
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px] px-5 py-2.5 rounded-xl bg-[#A33B2E] hover:bg-[#8E3125] text-white font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {blockStatus === 'blocked_by_me' ? (
                <>
                  <UserCheck size={16} />
                  <span>Unblock</span>
                </>
              ) : (
                <>
                  <UserX size={16} />
                  <span>Block</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}