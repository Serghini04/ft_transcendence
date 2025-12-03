import './index.css';

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MainLayout from './components/MainLayout';
import Home from './userAuth/dashboard/Home';
import Settings from './userAuth/settings/components/Settings';
import Auth from './userAuth/LoginAndSignup/components/Auth';
import ChatPage from './chat/components/ChatPage';
import GameSelection from './TicTac/GameSelection';
import TicTac from './TicTac/TicTac';
import OnlineTicTac from './TicTac/OnlineTicTac';

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Auth is outside MainLayout */}
        <Route path="/auth" element={<Auth />} />

        {/* All other routes use MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings/*" element={<Settings />} />
          <Route path="/games" element={<GameSelection />} />
          <Route path="/tictac" element={<TicTac />} />
          <Route path="/tictac/online" element={<OnlineTicTac />} />
        </Route>
      </Routes>
    </Router>
  );
}
