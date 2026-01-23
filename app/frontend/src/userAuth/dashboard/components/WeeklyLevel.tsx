import React, { useEffect, useState } from "react";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";

interface WeeklyLevelProps {
  played?: number;
  wins?: number;
  losses?: number;
}

interface GameData {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  player1_score: number;
  player2_score: number;
  created_at: string;
  game_type?: string;
}

export default function WeeklyLevel({ played = 0, wins = 0, losses = 0 }: WeeklyLevelProps) {
  const { token } = UseTokenStore();
  const { user } = UseUserStore();
  
  const [weeklyData, setWeeklyData] = useState([
    { day: "Sun", pingPongWins: 0, ticTacWins: 0 },
    { day: "Mon", pingPongWins: 0, ticTacWins: 0 },
    { day: "Tue", pingPongWins: 0, ticTacWins: 0 },
    { day: "Wed", pingPongWins: 0, ticTacWins: 0 },
    { day: "Thu", pingPongWins: 0, ticTacWins: 0 },
    { day: "Fri", pingPongWins: 0, ticTacWins: 0 },
    { day: "Sat", pingPongWins: 0, ticTacWins: 0 },
  ]);

  useEffect(() => {
    async function fetchWeeklyWins() {
  if (!token || !user.id) return;

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const [pingPongRes, ticTacRes] = await Promise.all([
      fetch(
        `http://localhost:8080/api/v1/leaderboard/player/${user.id}/games?limit=100`,
        { headers, credentials: "include" }
      ),
      fetch(
        `http://localhost:8080/api/v1/leaderboard/tictactoe/player/${user.id}`,
        { headers, credentials: "include" }
      ),
    ]);

    const pingPongData = await pingPongRes.json();
    const ticTacData = await ticTacRes.json();

    const pingPongWinsPerDay = [0, 0, 0, 0, 0, 0, 0];
    const ticTacWinsPerDay  = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 🟠 PingPong
    pingPongData.games?.forEach((game: GameData) => {
      const date = new Date(game.created_at);
      if (date >= sevenDaysAgo && game.winner_id == user.id) {
        pingPongWinsPerDay[date.getDay()]++;
      }
    });

    // 🔵 TicTacToe
    ticTacData.games?.forEach((game: GameData) => {
      const date = new Date(game.created_at);
      if (date >= sevenDaysAgo && game.winner_id == user.id) {
        ticTacWinsPerDay[date.getDay()]++;
      }
    });
    console.log("🟦 TIC TAC RAW DATA:", ticTacData);
    console.log("🟦 TIC TAC WINS PER DAY:", ticTacWinsPerDay);

    setWeeklyData([
      { day: "Sun", pingPongWins: pingPongWinsPerDay[0], ticTacWins: ticTacWinsPerDay[0] },
      { day: "Mon", pingPongWins: pingPongWinsPerDay[1], ticTacWins: ticTacWinsPerDay[1] },
      { day: "Tue", pingPongWins: pingPongWinsPerDay[2], ticTacWins: ticTacWinsPerDay[2] },
      { day: "Wed", pingPongWins: pingPongWinsPerDay[3], ticTacWins: ticTacWinsPerDay[3] },
      { day: "Thu", pingPongWins: pingPongWinsPerDay[4], ticTacWins: ticTacWinsPerDay[4] },
      { day: "Fri", pingPongWins: pingPongWinsPerDay[5], ticTacWins: ticTacWinsPerDay[5] },
      { day: "Sat", pingPongWins: pingPongWinsPerDay[6], ticTacWins: ticTacWinsPerDay[6] },
    ]);
      console.log("------------------->", weeklyData);
  } catch (err) {
    console.error("❌ Weekly stats error:", err);
  }
}
    
    fetchWeeklyWins();
  }, [user.id, token]);

  // Calculate the maximum wins for scaling (considering both games)
  const maxWins = Math.max(...weeklyData.map(d => d.pingPongWins + d.ticTacWins), 1);
  
  console.log("📊 Rendering WeeklyLevel - maxWins:", maxWins, "data:", weeklyData);

  return (
    <div className="w-full xl:h-6 xl:mt-[-6.2rem] xl:w-[35vw]">
      <div className="rounded-2xl p-6 bg-[rgba(68,78,106,0.3)] border border-white/10 shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-lg font-semibold xl:mb-76">Weekly Level</h2>
          <div className="text-right">
            <p className="text-white text-sm">Played: <span className="font-semibold">{played}</span></p>
            <p className="text-emerald-400 text-sm">Wins: <span className="font-semibold">{wins}</span></p>
            <p className="text-red-400 text-sm">Losses: <span className="font-semibold">{losses}</span></p>
          </div>
        </div>
        
        <div className="relative">
          {/* Percentage markers on the left */}
          <div className="absolute left-0 top-11 h-48 flex flex-col justify-between text-xs text-gray-500 pr-2">
            {[100, 75, 50, 25, 0].map((value) => (
              <span key={value} className="-mt-1">{value}%</span>
            ))}
          </div>
          
          {/* Bar chart with left margin for percentage labels */}
          <div className="ml-10 h-64 flex items-end justify-around gap-4 px-4">
            {weeklyData.map((day, index) => {
              // Calculate bar heights based on wins (scaled to max 100%)
              const pingPongHeight = maxWins > 0 ? (day.pingPongWins / maxWins) * 100 : 0;
              const ticTacHeight = maxWins > 0 ? (day.ticTacWins / maxWins) * 100 : 0;
              
              // Ensure bars are visible when there are wins (minimum 10% height)
              const finalPingPongHeight = day.pingPongWins > 0 ? Math.max(pingPongHeight, 10) : 0;
              const finalTicTacHeight = day.ticTacWins > 0 ? Math.max(ticTacHeight, 10) : 0;
              
              console.log(`📊 ${day.day}: PP=${day.pingPongWins} (${finalPingPongHeight}%), TT=${day.ticTacWins} (${finalTicTacHeight}%)`);

              return (
                 <div
                  key={index}
                  className="flex flex-col items-center gap-2 flex-1 min-w-0"
                >
                  {/* Bars container */}
                  <div className="flex items-end gap-1 h-48 w-full justify-center">
                    {/* PingPong bar */}
                    <div
                      className="w-[clamp(16px,2vw,20px)] bg-gradient-to-t from-amber-400 to-amber-300 rounded-t transition-all duration-300"
                      style={{ height: `${finalPingPongHeight}%` }}
                      title={`PingPong: ${day.pingPongWins} wins`}
                    />
                    {/* TicTacToe bar */}
                    <div
                      className="w-[clamp(16px,2vw,20px)] bg-gradient-to-t from-cyan-400 to-teal-300 rounded-t transition-all duration-300"
                      style={{ height: `${finalTicTacHeight}%` }}
                      title={`TicTacToe: ${day.ticTacWins} wins`}
                    />
                  </div>
                  
                  {/* Day label */}
                  <span className="text-xs text-gray-400 font-medium">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded"></div>
            <span className="text-amber-400">PingPong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded"></div>
            <span className="text-cyan-400">TicTacToe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
