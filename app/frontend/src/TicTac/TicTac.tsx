import TicTacGame from "./TicTacGame";

interface TicTacProps {
  isSidebarOpen?: boolean;
}

const TicTac = ({isSidebarOpen}: TicTacProps) => {
  return <TicTacGame mode="local" isSidebarOpen={isSidebarOpen} />;
};

export default TicTac;
