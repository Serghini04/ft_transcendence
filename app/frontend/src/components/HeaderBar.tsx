import { Search as SearchIcon } from "@mui/icons-material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Menu } from "lucide-react";
import IconButton from "@mui/material/IconButton";

export default function HeaderBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <header className="fixed top-0 left-20 right-0 h-20 flex items-center justify-between px-4 sm:px-6 md:px-10 bg-transparent backdrop-blur-md z-30 overflow-visible">
      
      {/* --- Left Section (Menu icon + Search bar) --- */}
      <div className="flex items-center gap-2 sm:gap-4 sm:gap-9 flex-1">
        {/* Menu Icon (only on small screens) */}
        <IconButton
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="block md:!hidden text-white transition-colors hover:text-gray-300 bg-transparent border-none outline-none p-1 sm:p-2"
        >
          <Menu size={26} className="text-gray-400" />
        </IconButton>

        {/* Search Bar */}
        <div
          className="flex-1 flex items-center bg-[rgba(13,34,52,0.5)] rounded-full px-2 py-1.5 sm:px-3 sm:py-2 shadow-md backdrop-blur-sm hover:shadow-lg transition-all
          max-w-[120px] sm:max-w-[180px] md:max-w-[350px] lg:max-w-[420px] min-w-0"
        >
          <SearchIcon className="text-gray-400 mr-2 shrink-0" fontSize="medium" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent flex-1 outline-none text-gray-200 placeholder-gray-400 text-xs sm:text-sm md:text-base truncate"
          />
        </div>
      </div>

      {/* --- Right Section (Notifications + Avatar) --- */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-shrink-0">
        {/* Notifications */}
        <div className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6">
          <NotificationsIcon className="text-gray-300 hover:text-white transition-colors w-full h-full cursor-pointer" />
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[6px] sm:text-[7px] sm:text-[8px] font-bold px-1 py-[1px] rounded-full border border-[#0b1b29]">
             3
          </span>
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-600 hover:border-white transition-all cursor-pointer">
          <img
            src="/user.png"
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
