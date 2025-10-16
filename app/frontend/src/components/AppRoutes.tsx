import { Routes, Route } from "react-router-dom";
import Game from "../Game/index";
import Ai from "../Game/components/ai";
import Local from "../Game/components/local";
import Tournament from "../Game/components/tournament";
import Online from "../Game/components/online";


export default function AppRoutes({ menuOpen }: { menuOpen: boolean }) {
    return (
      <Routes>
          <Route path="/game" element={<Game menuOpen={menuOpen}/>} >
            {/* <Route path="/tournament"  element={<Tournament/>} />
            <Route path="/ai" element={<Ai/>} />
            <Route path="/local" element={<Local/>} />
            <Route path="/online" element={<Online/>} /> */}
          </Route>
        </Routes>
      );
}