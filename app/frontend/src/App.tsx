// import AppRoutes from "./components/AppRoutes";
import HeaderBar from "./components/HeaderBar";
import SideMenu from "./components/SideMenu";
import UrTask from "./urtask/components/index";
import { useState } from "react";

import { BrowserRouter as Router } from "react-router-dom";

export default function App() {

  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleMenuClose = () => setMenuOpen(false);
  return (
    <Router>
      <div className="relative min-h-screen text-white">
        <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

        <SideMenu open={menuOpen} onClose={handleMenuClose} />
        {/* <HeaderBar /> */}
        <HeaderBar onMenuToggle={handleMenuToggle} />
        <UrTask />

        <main className="overflow-hidden pl-20 pt-20 p-6 relative z-10">
          {/* <AppRoutes /> */}
        </main>
      </div>
    </Router>
  );
}