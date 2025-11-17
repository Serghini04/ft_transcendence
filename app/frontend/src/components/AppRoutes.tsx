import { Routes, Route } from "react-router-dom";
import MainComponent from "../userAuth/LoginAndSignup/components/MainComponent";
import { Chat } from "@mui/icons-material";

export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      );
}