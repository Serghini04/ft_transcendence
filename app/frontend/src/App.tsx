import AppRoutes from "./components/AppRoutes";
import MyHeader from "./components/MyHeader";
import SideMenu from "./components/SideMenu";
import { BrowserRouter as Router } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="relative min-h-screen text-white">
          <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

          <SideMenu />
          <MyHeader />

          <main className="pl-20 pt-20 p-6 relative z-10">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}