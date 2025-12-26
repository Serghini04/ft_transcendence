import {
  Home,
  MessageCircle,
  Gamepad2,
  Grid3x3,
  Settings,
  LogOut,
  User,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom"

// Creative combined icon for TicTac (Local + Online)
function TicTacCombinedIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Grid background */}
      <Grid3x3 size={size} className="absolute inset-0" />
      {/* Local player indicator (left) */}
      <div className="absolute -bottom-1 -left-1 bg-blue-500 rounded-full p-0.5 border border-[#0d2234]">
        <User size={size * 0.3} className="text-white" />
      </div>
      {/* Online players indicator (right) */}
      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-[#0d2234] animate-pulse">
        <Users size={size * 0.3} className="text-white" />
      </div>
    </div>
  );
}


interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile - clicking closes menu */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={onClose}
        />
      )}

      {/* --- Logo Bar (Always visible) --- */}
      <div className="fixed top-0 left-0 h-20 w-20 bg-[rgba(13,34,52,0.65)] flex flex-col items-center justify-center z-30 backdrop-blur-md border-r border-white/10 shadow-lg">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-full h-full object-contain p-2"
        />
      </div>

      {/*Sidebar content (only visible on desktop or when open on mobile) --- */}
      <aside
        className={`fixed left-0 top-20 h-[calc(100%-5rem)] w-20 bg-[rgba(13,34,52,0.65)] flex flex-col items-center py-3 z-20 backdrop-blur-md border-r border-white/10 shadow-lg transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center justify-center flex-1 space-y-16 w-full mt-4">
          <NavItem
            icon={<Home size={32} />}
            color="#12C0AD"
            to="/"
            active={location.pathname === "/" || location.pathname === "/home"} //by skarim && souaouri
          />
          <NavItem
            icon={<MessageCircle size={32} />}
            color="#12C0AD"
            to="/chat"
            active={location.pathname.startsWith("/chat")}
            onClick={onClose}
          />
          <NavItem
            icon={<Gamepad2 size={32} />}
            color="#12C0AD"
            to="/game"
            active={location.pathname.startsWith("/game")}
            onClick={onClose}
          />
          <NavItem
            icon={<TicTacCombinedIcon size={32} />}
            color="#12C0AD"
            to="/SecondGame"
            active={location.pathname.startsWith("/SecondGame") || location.pathname.startsWith("/tictac")}
            label="TicTacToe • Local & Online"
            onClick={onClose}
          />
          <NavItem
            icon={<Settings size={32} />}
            color="#12C0AD"
            to="/settings"
            active={location.pathname.startsWith("/settings")}
            onClick={onClose}
          />
        </nav>

        {/* Logout Section */}
        <div className="w-full flex flex-col items-center mt-4 mb-6">
          <div className="w-10 border-t border-gray-700 mb-3"></div>
          <NavItem icon={<LogOut size={32} />} color="#FF4C4C" to="/auth" onClick={onClose} />
        </div>
      </aside>
  </>
  );
}


interface NavItemProps {
  icon: React.ReactNode;
  color?: string;
  to: string;
  active?: boolean;
  label?: string;
  onClick?: () => void;
}

function NavItem({icon, color = "#12C0AD", to, active = false, label, onClick}: NavItemProps)
{
  return (
    <Link to={to} onClick={onClick} className="group relative flex items-center justify-center w-full cursor-pointer">
       {/* Icon */}
      <div
        className={`transition-all duration-300 transform ${
          active 
            ? "text-[color:var(--active)] scale-110 rotate-0" 
            : "text-gray-400 group-hover:text-[color:var(--hover)] group-hover:scale-110 group-hover:rotate-6"
        }`}
        style={
          {
            "--hover": color,
            "--active": color,
          } as React.CSSProperties
        }
      >
        {icon}
      </div>
      
      {/* Tooltip label on hover */}
      {label && (
        <div
          className="absolute left-full ml-4 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                     opacity-0 group-hover:opacity-100 pointer-events-none
                     transition-all duration-300 transform group-hover:translate-x-0 -translate-x-2
                     shadow-lg backdrop-blur-md border border-white/20 z-50"
          style={{
            backgroundColor: `${color}20`,
            color: color,
            borderColor: `${color}40`
          }}
        >
          {label}
          <div 
            className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 rotate-45"
            style={{ backgroundColor: `${color}20` }}
          />
        </div>
      )}
      
        {/* Active or Hover Line with glow effect */}
      <div
        className={`absolute right-0 top-1/2 -translate-y-1/2 h-10 w-[3px] rounded-full origin-center transition-all duration-300 ${
          active ? "scale-y-100 shadow-lg" : "scale-y-0 group-hover:scale-y-100 group-hover:shadow-lg"
        }`}
        style={{ 
          backgroundColor: color,
          boxShadow: active ? `0 0 10px ${color}, 0 0 20px ${color}40` : 'none'
        }}
      ></div>
    </Link>
  );
}