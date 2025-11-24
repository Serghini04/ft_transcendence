import { Routes, Route } from "react-router-dom";
import TicTac from "../TicTac/TicTac";
import OnlineTicTac from "../TicTac/OnlineTicTac";
import GameSelection from "../TicTac/GameSelection";


export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/chat" element={<div>Chat Coming Soon</div>} />
          <Route path="/tictac" element={<TicTac />} />
          <Route path="/tictac-online" element={<OnlineTicTac />} />
          <Route path="/tictac-select" element={<GameSelection />} />
          <Route path="/game" element={<div>Game Coming Soon</div>} />
          <Route path="/settings" element={<div>Settings Coming Soon</div>} />
        </Routes>
      );
}