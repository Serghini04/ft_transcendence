import { Outlet } from "react-router-dom";
import HeaderBar from "./HeaderBar";
import SideMenu from "./SideMenu";

interface MainLayoutProps {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MainLayout({ menuOpen, setMenuOpen}: MainLayoutProps) {


  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleMenuClose = () => setMenuOpen(false);

  return (
      <div className="relative min-h-screen text-white">
        <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

        <SideMenu open={menuOpen} onClose={handleMenuClose} />
        <HeaderBar onMenuToggle={handleMenuToggle} />
        <Outlet />
      </div>
  );
}