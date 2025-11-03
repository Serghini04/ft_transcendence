import { Routes, Route } from "react-router-dom";
import ChatPage from "../chat/components/ChatPage";

export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
        </Routes>
      );
}