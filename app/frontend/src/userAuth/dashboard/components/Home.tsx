import { useEffect, useState } from "react";
import isValidToken from "../../../globalUtils/isValidToken";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";
import { useNavigate } from "react-router-dom";
import LaunchTheGame from "./LaunchTheGame";
import Activity from "./Activity";
import TopPlayers from "./topPlayers";
import MonthlyWinsGauge from "./MonthlyWinsGauge";
import ProgressionHistory from "./ProgressionHistory";
import WeeklyLevel from "./WeeklyLevel";
import { authenticatedFetch } from "../../../globalUtils/authenticatedFetch";

export default function Home() {
  const { token } = UseTokenStore();
  const { user } = UseUserStore();
  const [pingPongStats, setPingPongStats] = useState({
    total_games: 0,
    wins: 0,
    losses: 0,
    total_score: 0,
    goals_conceded: 0
  });
  
  const [ticTacToeStats, setTicTacToeStats] = useState({
    total_games: 0,
    wins: 0,
    losses: 0,
    draws: 0
  });

  useEffect(() => {
    async function fetchStats() {
      if (!token || !user.id) {
        console.log("Waiting for token or user ID...");
        return;
      }

      try {
        // Fetch PingPong stats
        const pingPongRes = await authenticatedFetch(`/api/v1/leaderboard/player/${user.id}`);
        const pingPongData = await pingPongRes.json();
        
        if (pingPongRes.ok) {
          setPingPongStats({
            total_games: pingPongData.total_games || 0,
            wins: pingPongData.wins || 0,
            losses: pingPongData.losses || 0,
            total_score: pingPongData.total_score || 0,
            goals_conceded: pingPongData.goals_conceded || 0
          });
          console.log("Ping Pong Stats:", pingPongData);
        }
        
        // Fetch TicTacToe stats
        const ticTacToeRes = await authenticatedFetch(`/api/v1/leaderboard/tictactoe/player/${user.id}`);
        const ticTacToeData = await ticTacToeRes.json();
        
        if (ticTacToeRes.ok) {
          setTicTacToeStats({
            total_games: ticTacToeData.total_games || 0,
            wins: ticTacToeData.wins || 0,
            losses: ticTacToeData.losses || 0,
            draws: ticTacToeData.draws || 0
          });
          console.log("TicTacToe Stats:", ticTacToeData);
        }
      } catch (err) {
        console.error("Error fetching statistics:", err);
      }
    }
    
    fetchStats();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, [user.id, token]);

  // const navigate = useNavigate();
  // const { token, setToken } = UseTokenStore();

  // useEffect(() => {
  //   async function check() {
  //     const result = await isValidToken(token);
  //     if (!result.valid)wins={pingPongStats.wins} 
  //     {
  //       navigate("/auth");
  //     }
      
  //     if (result.newToken) {
  //       setToken(result.newToken);
  //     }
  //   }

  //   check();
  // }, [token, navigate]);
  
    return (
  <div
    className="
      fixed
      flex-col
      inset-0
      bg-[rgba(15,26,36,0.5)]
      mt-20
      pt-4
      md:ml-30 ml-0
      md:border-l-2 border-t-2
      border-[#27445E]
      md:rounded-tl-4xl
      md:shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_0_#27445E]
      overflow-y-auto
      overflow-x-hidden
      scrollbar-none
  "
  >
    <div className="w-full flex flex-col gap-[2vw] pt-[1vw] px-[1vw] md:px-[1.5vw] xl:pr-[3vw] items-center xl:items-start">
      
      {/* Two Column Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[auto_35%] gap-[3vw] xl:gap-[0.01vw] xl:mr-[3vw] w-full xl:w-auto max-w-full xl:max-w-none">
        
        {/* Row 1 Left - Hero Section */}
        <LaunchTheGame 
          wins={pingPongStats.wins}
          losses={pingPongStats.losses}
        />
        
        {/* Row 1 Right - Activity */}
        <div className="-ml-[20px]">
          <Activity 
            played={pingPongStats.total_games}
            wins={pingPongStats.wins}
            ticTacToePlayed={ticTacToeStats.total_games}
            ticTacToeWins={ticTacToeStats.wins}
          />
        </div>
        
        {/* Row 2 Left - Top Players and Monthly Wins */}
        <div className="grid grid-cols-1 lg:grid-cols-[66%_28%] gap-16 xl:gap-[0.7vw] xl:row-start-2 xl:mt-[-5vw] self-start justify-start items-stretch">
          <TopPlayers />
          <MonthlyWinsGauge 
            wins={pingPongStats.wins} 
            totalGames={pingPongStats.total_games} 
          />
          {/* ProgressionHistory under TopPlayers/MonthlyWins */}
          <div className=" lg:col-span-2 self-start xl:mt-[1vw]">
            <ProgressionHistory 
              scored={pingPongStats.total_score}
              conceded={pingPongStats.goals_conceded}
              totalGames={pingPongStats.total_games}
            />
          </div>
        </div>
        
        {/* Row 2 Right - Weekly Level */}
        <div className="xl:row-start-2 -ml-[20px]">
          <WeeklyLevel 
            played={pingPongStats.total_games}
            wins={pingPongStats.wins}
            losses={pingPongStats.losses}
          />
        </div>

      </div>
    </div>
  </div>
);

}