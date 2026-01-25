import { Outlet, useOutletContext } from "react-router-dom";
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
        <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat -z-10" />

        <div className="flex min-h-screen">
        
         
          <SideMenu open={menuOpen} onClose={handleMenuClose} />

         
          <div className="mt-16 xl:mt-0 flex-1 flex flex-col md:ml-20 ">

            <HeaderBar onMenuToggle={handleMenuToggle} />
            <main className="pb-0">
              <Outlet context={{ isSidebarOpen: menuOpen }} />
            </main>

          </div>

        </div>
    </div>
  );
}


  //  <div className="relative min-h-screen text-white">
  //       <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat -z-10" />

  //       <div className="flex min-h-screen">
        
  //       {/* Side menu */}
  //       <SideMenu open={menuOpen} onClose={handleMenuClose} />

  //       {/* Main content */}
  //       <div className="flex-1 flex flex-col md:ml-20">
  //         <HeaderBar onMenuToggle={handleMenuToggle} />
  //         <main className="p-4">
  //           <Outlet />
  //         </main>
  //       </div>

  //       </div>
  //     </div>