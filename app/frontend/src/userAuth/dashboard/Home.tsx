import { useEffect, useState } from "react";
import AppRoutes from "../../components/AppRoutes";
import HeaderBar from "../../components/HeaderBar";
import SideMenu from "../../components/SideMenu";
import isValidToken from "../globalUtils/isValidToken";
import { UseTokenStore } from "../LoginAndSignup/zustand/useStore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const { token } = UseTokenStore();

  useEffect(() => {
    async function check() {
      const valid = await isValidToken(token);
      if (!valid) navigate("/auth");
    }
  
    check();
  }, [token, navigate]);
    
    const [menuOpen, setMenuOpen] = useState(false);
  
    const handleMenuToggle = () => setMenuOpen((prev) => !prev);
    const handleMenuClose = () => setMenuOpen(false);
  
    return (
        <div className="relative min-h-screen text-white">
          <div className="fixed inset-0 bg-[url('/src/userAuth/LoginAndSignup/iconsAndImages/mainBG.png')] bg-cover bg-center bg-no-repeat z-0" />
  
          <SideMenu open={menuOpen} onClose={handleMenuClose} />
          <HeaderBar onMenuToggle={handleMenuToggle} />
          <AppRoutes />
        </div>
    );
  }