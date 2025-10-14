import { Routes, Route } from "react-router-dom";
import Game from "../Game/GameMenu";


export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/game" element={<Game />} />
        </Routes>
      );
}