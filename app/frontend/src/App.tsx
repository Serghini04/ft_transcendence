import { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./components/AppRoutes";
import HeaderBar from "./components/HeaderBar";
import SideMenu from "./components/SideMenu";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleMenuClose = () => setMenuOpen(false);

  // Automatically sync sidebar with screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(true); // open sidebar on large screens
      } else {
        setMenuOpen(false); // close sidebar on small screens
      }
    };

    // Listen to resize
    window.addEventListener("resize", handleResize);

    // Run once on mount to set correct state
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <div className="relative min-h-screen text-white">
        {/* Background image */}
        <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

        {/* Sidebar */}
        <SideMenu open={menuOpen} onClose={handleMenuClose} />

        {/* Header */}
        <HeaderBar onMenuToggle={handleMenuToggle} />

        {/* Main content area */}
        <div
          className={`relative z-10 transition-all duration-300 ${
            menuOpen ? "pl-[80px]" : "pl-0"
          }`}
        >
          <main className="pt-20 px-10">
            <AppRoutes menuOpen={menuOpen}/>
          </main>
        </div>
      </div>
    </Router>
  );
}
