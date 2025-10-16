import { Routes, Route } from "react-router-dom";
import Chat from "../chat/components/ChatPage";

export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      );
}