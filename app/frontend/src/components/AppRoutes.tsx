import { Routes, Route, Navigate } from "react-router-dom";
import { Chat } from "@mui/icons-material";
import Home from "../userAuth/dashboard/Home";
import Settings from "../userAuth/settings/components/Settings";
import Auth from "../userAuth/LoginAndSignup/components/Auth";

export default function AppRoutes() {
    return (
        <Routes>
          <Route path="/auth" element={<Auth />} />
//        <Route path="/" element={<Navigate to="/home" />} />
//        <Route path="/home/*" element={<Home />} />
//        <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      );
}