import { Search as SearchIcon } from "@mui/icons-material";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function MyHeader() {
  return (
    <header className="fixed top-0 left-20 right-0 h-20 flex items-center justify-between px-6 md:px-10 bg-transparent backdrop-blur-md z-30">
      {/* Search Bar */}
      <div className="flex items-center w-full max-w-[500px] bg-[rgba(13,34,52,0.5)] rounded-full px-5 py-2 shadow-md backdrop-blur-sm hover:shadow-lg transition-all">
        <SearchIcon className="text-gray-400 mr-3" fontSize="medium" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent flex-1 outline-none text-gray-200 placeholder-gray-400 text-sm md:text-base"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative flex items-center justify-center w-7 h-7">
          <NotificationsIcon className="text-gray-300 hover:text-white transition-colors" fontSize="large" />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full border border-[#0b1b29]">
            3
          </span>
        </div>

        {/* User Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-600 hover:border-white transition-all cursor-pointer">
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
