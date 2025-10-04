import HomeIcon from "@mui/icons-material/Home";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

export default function SideMenu() {
  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-[rgba(13,34,52,0.7)] flex flex-col items-center py-4 z-20 backdrop-blur-md">
      {/* Logo */}
      <div className="w-20 h-20 flex items-center justify-center">
        <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center justify-center flex-1 space-y-14 w-full">
        <NavItem icon={<HomeIcon sx={{ fontSize: 36 }} />} />
        <NavItem icon={<ChatBubbleIcon sx={{ fontSize: 36 }} />} />
        <NavItem icon={<SportsEsportsIcon sx={{ fontSize: 36 }} />} />
        <NavItem icon={<SettingsIcon sx={{ fontSize: 36 }} />} />
      </nav>

      {/* Logout Section */}
      <div className="w-full flex flex-col items-center mt-4 mb-3">
        <div className="w-10 border-t border-gray-700 mb-3"></div>
        <NavItem icon={<LogoutIcon sx={{ fontSize: 34 }} />} color="#FF4C4C" />
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  color = "#12C0AD",
}: {
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="group relative flex items-center justify-center w-full cursor-pointer">
      {/* Icon */}
      <div
        className="text-gray-300 transition-colors group-hover:[color:var(--hover)]"
        style={{ "--hover": color } as React.CSSProperties}
      >
        {icon}
      </div>

      {/* Hover Line */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-[3px] rounded-full scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300"
        style={{ backgroundColor: color }}
      ></div>
    </div>
  );
}
