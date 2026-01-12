import { Search as SearchIcon } from "@mui/icons-material";
import { Menu } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { useEffect, useState, useRef } from "react";
import { UseTokenStore } from "../userAuth/zustand/useStore";
import { useNotificationStore } from "../notification/store/useNotificationStroe";
import { NotificationBell } from "../notification/components/NotificationBell";
import { useNavigate } from "react-router-dom";

type SearchUser = {
  id: number;
  fullName: string;
  avatarUrl: string;
  bgPhotoUrl: string;
  bio: string;
};

export default function HeaderBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const userId = UseTokenStore((s) => s.userId);
  const token = UseTokenStore((s) => s.token);
  const navigate = useNavigate();

  const connectSocket = useNotificationStore((s) => s.connectSocket);
  const disconnectSocket = useNotificationStore((s) => s.disconnectSocket);
  const onlineUsers = useNotificationStore((s) => s.onlineUsers);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId)
      connectSocket(userId);
    return () => disconnectSocket();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/v1/chat/search?q=${encodeURIComponent(searchQuery)}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, token]);

  const handleUserClick = (user: SearchUser) => {
    setShowResults(false);
    setSearchQuery("");
    navigate(`/profile/${user.id}`);
  };

  return (
    <header className="fixed top-0 left-20 right-0 h-20 flex items-center justify-between px-4 sm:px-6 md:px-10 bg-transparent backdrop-blur-md z-30 overflow-visible">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-9 flex-1">
        {/* Menu Button */}
        <IconButton
          onClick={onMenuToggle}
          className="block md:!hidden text-white transition-colors hover:text-gray-300 bg-transparent border-none outline-none p-1 sm:p-2"
        >
          <Menu size={26} className="text-gray-400" />
        </IconButton>

        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[120px] sm:max-w-[180px] md:max-w-[350px] lg:max-w-[420px]">
          <div className="flex items-center bg-[rgba(13,34,52,0.5)] rounded-full px-2 py-1.5 sm:px-3 sm:py-2 shadow-md hover:shadow-lg transition-all">
            <SearchIcon className="text-gray-400 mr-2" fontSize="medium" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 outline-none text-gray-200 placeholder-gray-400 text-xs sm:text-sm md:text-base"
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-[rgba(15,26,36,0.98)] border border-[#27445E] rounded-xl shadow-2xl max-h-[400px] overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-gray-400">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No users found</div>
              ) : (
                <div className="py-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="relative shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {user.fullName[0]}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[rgba(15,26,36,0.98)] ${
                            onlineUsers.has(user.id) ? "bg-emerald-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{user.fullName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-600 hover:border-white transition-all cursor-pointer">
          <img src="/user.png" alt="User avatar" className="w-full h-full object-cover" />
        </div>

      </div>
    </header>
  );
}