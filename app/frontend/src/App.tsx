import './index.css';
import 'react-toastify/dist/ReactToastify.css';

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import MainLayout from './components/MainLayout';
import Home from './userAuth/dashboard/Home';
import Settings from './userAuth/settings/components/Settings';
import Auth from './userAuth/LoginAndSignup/components/Auth';
import ChatPage from './chat/components/ChatPage';
import GameMenu from "./Game/GameMenu";
import Game from "./Game/index";
import Ai from "./Game/components/ai";
import Local from "./Game/components/local";
import Tournament from "./Game/components/tournament";
import Online from "./Game/components/online";
import GameSetup from "./Game/components/setup";
import { useState } from "react";
import GameSelection from './TicTac/GameSelection';
import TicTac from './TicTac/TicTac';
import OnlineTicTac from './TicTac/OnlineTicTac';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <Router>
        <Routes>

          {/* Auth is outside MainLayout */}
          <Route path="/auth" element={<Auth />} />

          {/* All other routes use MainLayout */}
          <Route element={<MainLayout menuOpen={menuOpen} setMenuOpen={setMenuOpen} />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="challenge" element={<Online />} />
              
            <Route path="/game" element={<Game menuOpen={menuOpen} />}>
              <Route index element={<GameMenu />} />
              <Route path="setup" element={<GameSetup />} />
              <Route path="tournament" element={<Tournament />} />
              <Route path="ai" element={<Ai />} />
              <Route path="local" element={<Local />} />
              <Route path="online" element={<Online />} />
            </Route>

            <Route path="/SecondGame" element={<GameSelection isSidebarOpen={menuOpen}/>} />
            <Route path="/tictac" element={<TicTac isSidebarOpen={menuOpen} />} />
            <Route path="/tictac/online" element={<OnlineTicTac isSidebarOpen={menuOpen} />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>

  );
}
