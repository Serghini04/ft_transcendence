import { Routes, Route } from "react-router-dom";

export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/chat" element={<div>Chat Coming Soon</div>} />
          <Route path="/game" element={<div>Game Coming Soon</div>} />
          <Route path="/settings" element={<div>Settings Coming Soon</div>} />
        </Routes>
      );
}