import {
  Home,
  MessageCircle,
  Gamepad2,
  Settings,
  LogOut,
} from "lucide-react";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SideMenu({ open, onClose}: SideMenuProps) {
  
  return (
    <>
      {/* --- Logo Bar (Always visible) --- */}
      <div className="fixed top-0 left-0 h-20 w-20 bg-[rgba(13,34,52,0.65)] flex flex-col items-center justify-center z-30 backdrop-blur-md border-r border-white/10 shadow-lg">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-full h-full object-contain p-2"
        />
      </div>

      {/* --- Sidebar content (only visible on desktop or when open on mobile) --- */}
      <aside
        className={`fixed left-0 top-20 h-[calc(100%-5rem)] w-20 bg-[rgba(13,34,52,0.65)] flex flex-col items-center py-3 z-20 backdrop-blur-md border-r border-white/10 shadow-lg transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center justify-center flex-1 space-y-20 w-full mt-4">
          <NavItem icon={<Home size={32} />} />
          <NavItem icon={<MessageCircle size={32} />} />
          <NavItem icon={<Gamepad2 size={32} />} />
          <NavItem icon={<Settings size={32} />} />
        </nav>

        {/* Logout Section */}
        <div className="w-full flex flex-col items-center mt-4 mb-6">
          <div className="w-10 border-t border-gray-700 mb-3"></div>
          <NavItem icon={<LogOut size={32} />} color="#FF4C4C" />
        </div>
      </aside>
  </>
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
        className="text-gray-400 transition-colors duration-300 group-hover:text-[color:var(--hover)]"
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
