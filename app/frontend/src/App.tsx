import AppRoutes from "./components/AppRoutes";
import HeaderBar from "./components/HeaderBar";
import SideMenu from "./components/SideMenu";
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
        <HeaderBar onMenuToggle={handleMenuToggle} />
        <AppRoutes />
      </div>
    </Router>
  );
}