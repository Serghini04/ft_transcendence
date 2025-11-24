import './index.css';

import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import MainLayout from './components/MainLayout';
import Home from './userAuth/dashboard/Home';
import Settings from './userAuth/settings/components/Settings';
import Auth from './userAuth/LoginAndSignup/components/Auth';
import ChatPage from './chat/components/ChatPage';

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Auth is outside MainLayout */}
        <Route path="/auth" element={<Auth />} />

        {/* All other routes use MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat:id" element={<ChatPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/settings/*" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}