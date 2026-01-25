import { useOutletContext } from "react-router-dom";
import TicTacGame from "./TicTacGame";

interface OutletContextType {
  isSidebarOpen?: boolean;
}

const TicTac = () => {
  const { isSidebarOpen } = useOutletContext<OutletContextType>();
  return <TicTacGame mode="local" isSidebarOpen={isSidebarOpen} />;
};

export default TicTac;
