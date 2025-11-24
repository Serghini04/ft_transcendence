import { Routes, Route } from "react-router-dom";
import ChatPage from "../chat/components/ChatPage";

export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/game" element={<div>Game Coming Soon</div>} />
          <Route path="/settings" element={<div>Settings Coming Soon</div>} />
        </Routes>
      );
}