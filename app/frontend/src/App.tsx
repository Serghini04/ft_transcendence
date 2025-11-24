import './index.css';

import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MainLayout from './components/MainLayout';
import Home from './userAuth/dashboard/Home';
import Settings from './userAuth/settings/components/Settings';
import Auth from './userAuth/LoginAndSignup/components/Auth';

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Auth is outside MainLayout */}
        <Route path="/auth" element={<Auth />} />

        {/* All other routes use MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home/*" element={<Home />} />
          <Route path="/settings/*" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

// import './index.css';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import MainComponent from './userAuth/LoginAndSignup/components/MainComponent';
// import Home from './userAuth/dashboard/Home';
// import Settings from './userAuth/settings/components/Settings';


// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/auth" element={<MainComponent />} />
//         <Route path="/" element={<Navigate to="/home" />} />
//         <Route path="/home/*" element={<Home />} />
//         <Route path="/settings" element={<Settings />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;





// // import AppRoutes from "./components/AppRoutes";
// import HeaderBar from "./components/HeaderBar";
// import SideMenu from "./components/SideMenu";
// import UrTask from "./urtask/components/index";
// import AppRoutes from "./components/AppRoutes";

// import { useState } from "react";

// import { BrowserRouter as Router } from "react-router-dom";

// export default function App() {

//   const [menuOpen, setMenuOpen] = useState(false);

//   const handleMenuToggle = () => setMenuOpen((prev) => !prev);
//   const handleMenuClose = () => setMenuOpen(false);
//   return (
//     <Router>
//       <div className="relative min-h-screen text-white">
//         <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

//         <SideMenu open={menuOpen} onClose={handleMenuClose} />
//         {/* <HeaderBar /> */}
//         <HeaderBar onMenuToggle={handleMenuToggle} />
//         <UrTask />

//         <main className="overflow-hidden pl-20 pt-20 p-6 relative z-10">
//           <AppRoutes />
//         </main>
//       </div>
//     </Router>
//   );
// }