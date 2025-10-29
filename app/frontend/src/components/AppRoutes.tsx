import { Routes, Route } from "react-router-dom";
import GameMenu from "../Game/GameMenu";
import Game from "../Game/index";
import Ai from "../Game/components/ai";
import Local from "../Game/components/local";
import Tournament from "../Game/components/tournament";
import Online from "../Game/components/online";
import GameSetup from "../Game/components/setup";

export default function AppRoutes({ menuOpen }: { menuOpen: boolean }) {
    return (
      <Routes>
          {/* Main Game Layout */}
        <Route path="/game" element={<Game menuOpen={menuOpen} />}>
          <Route index element={<GameMenu />} />
          <Route path="setup" element={<GameSetup />} />
          <Route path="tournament" element={<Tournament />} />
          <Route path="ai" element={<Ai />} />
          <Route path="local" element={<Local />} />
          <Route path="online" element={<Online />} />
        </Route>
        {/* <Route path="/chat" element={<Game menuOpen={menuOpen}/>} /> */}
      </Routes>
    );
}