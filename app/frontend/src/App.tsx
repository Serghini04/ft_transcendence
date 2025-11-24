import HeaderBar from "./components/HeaderBar";
import SideMenu from "./components/SideMenu";
// import UrTask from "./urtask/components/index";
import AppRoutes from "./components/AppRoutes";
import { useState } from "react";

import { BrowserRouter as Router } from "react-router-dom";

export default function App() {

  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleMenuClose = () => setMenuOpen(false);
  return (
    <Router>
      <div className="relative  text-white  overflow-y-scroll min-h-screen min-w-screen7">
        <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

        <SideMenu open={menuOpen} onClose={handleMenuClose} />
        {/* <HeaderBar /> */}
        <HeaderBar onMenuToggle={handleMenuToggle} />

        {/* <UrTask /> */}

        <main className="
          fixed
          pl-20
          align-center
          justify-center
          bg-[rgba(15,26,36,0.5)]
          mt-25
          md:ml-30 ml-[-5rem]   /* push left off-screen on mobile */
          border md:border border-t-2
          rounded-tl-4xl
          border-[#27445E]
          inset-0
          flex
        overflow-y-scroll
      ">
          <AppRoutes />
        </main>
      </div>
    </Router>
  );
}
