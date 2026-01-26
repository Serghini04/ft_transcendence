import React, { useEffect, useState } from "react";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";
import verifyToken from "../../../globalUtils/verifyToken";

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
    verifyToken(pingPongData);
    verifyToken(ticTacData);

    const pingPongWinsPerDay = [0, 0, 0, 0, 0, 0, 0];
    const pingPongTotalPerDay = [0, 0, 0, 0, 0, 0, 0];
    const ticTacWinsPerDay  = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 🟠 PingPong - count wins and total games per day
    pingPongData.games?.forEach((game: GameData) => {
      const date = new Date(game.created_at);
      if (date >= sevenDaysAgo) {
        const dayIndex = date.getDay();
        pingPongTotalPerDay[dayIndex]++;
        if (game.winner_id == user.id) {
          pingPongWinsPerDay[dayIndex]++;
        }
      }
    });

    // 🔵 TicTacToe - calculate win percentage from aggregate stats
    if (ticTacData.wins && ticTacData.total_games) {
      const winRate = (ticTacData.wins / ticTacData.total_games) * 100;
      ticTacWinsPerDay[now.getDay()] = winRate;
    }
    
    console.log("🟦 TIC TAC RAW DATA:", ticTacData);
    console.log("🟦 TIC TAC WINS PER DAY:", ticTacWinsPerDay);

    // Calculate win percentages for each day
    const calculateWinRate = (wins: number, total: number) => 
      total > 0 ? (wins / total) * 100 : 0;

    setWeeklyData([
      { day: "Sun", pingPongWins: calculateWinRate(pingPongWinsPerDay[0], pingPongTotalPerDay[0]), ticTacWins: ticTacWinsPerDay[0] },
      { day: "Mon", pingPongWins: calculateWinRate(pingPongWinsPerDay[1], pingPongTotalPerDay[1]), ticTacWins: ticTacWinsPerDay[1] },
      { day: "Tue", pingPongWins: calculateWinRate(pingPongWinsPerDay[2], pingPongTotalPerDay[2]), ticTacWins: ticTacWinsPerDay[2] },
      { day: "Wed", pingPongWins: calculateWinRate(pingPongWinsPerDay[3], pingPongTotalPerDay[3]), ticTacWins: ticTacWinsPerDay[3] },
      { day: "Thu", pingPongWins: calculateWinRate(pingPongWinsPerDay[4], pingPongTotalPerDay[4]), ticTacWins: ticTacWinsPerDay[4] },
      { day: "Fri", pingPongWins: calculateWinRate(pingPongWinsPerDay[5], pingPongTotalPerDay[5]), ticTacWins: ticTacWinsPerDay[5] },
      { day: "Sat", pingPongWins: calculateWinRate(pingPongWinsPerDay[6], pingPongTotalPerDay[6]), ticTacWins: ticTacWinsPerDay[6] },
    ]);
      console.log("------------------->", weeklyData);
  } catch (err) {
    console.error("❌ Weekly stats error:", err);
  }
}
  console.log("📊 Rendering WeeklyLevel - 
  // Calculate the maximum wins for scaling (considering both games)
  const maxWins = Math.max(...weeklyData.map(d => d.pingPongWins + d.ticTacWins), 1);
  
  console.log("📊 Rendering WeeklyLevel - maxWins:", maxWins, "data:", weeklyData);

  return (
    <div className="w-full xl:w-[35vw] xl:min-h-[clamp(35vw,42vw,50vw)] xl:mt-[-6vw] ml-6">
  <div className="rounded-2xl p-6 xl:p-[2vw] bg-[rgba(68,78,106,0.3)] border border-white/10 shadow-xl backdrop-blur-md ">
    <div className="flex justify-between items-center mb-6 xl:mb-[1.5vw]">
      <h2 className="text-white text-lg xl:text-[1.4vw] font-semibold xl:pb-[11.2vw]">Weekly Level</h2>
    </div>

    <div className="relative">
      {/* Percentage markers */}
      <div className="absolute left-0 top-11 xl:top-[-1.7vw] flex flex-col justify-between h-48 xl:h-[25vw] text-xs xl:text-[0.8vw] text-gray-500 pr-2">
        {[100, 75, 50, 25, 0].map((value) => (
          <span key={value} className="-mt-1">{value}%</span>
        ))}
      </div>

      {/* Bars */}
      <div className="ml-10 xl:ml-[3vw] flex items-end justify-around gap-4 xl:gap-[1vw] h-64 xl:h-[25vw] px-4">
        {weeklyData.map((day, index) => {
          const pingPongHeight = maxWins > 0 ? (day.pingPongWins / maxWins) * 100 : 0;
          const ticTacHeight = maxWins > 0 ? (day.ticTacWins / maxWins) * 100 : 0;
          const finalPingPongHeight = day.pingPongWins > 0 ? Math.max(pingPongHeight, 10) : 0;
          // Bar height is directly the win percentage (0-100%)
          const finalPingPongHeight = day.pingPongWins > 0 ? Math.max(day.pingPongWins, 5) : 0;
          const finalTicTacHeight = day.ticTacWins > 0 ? Math.max(day.ticTacWins, 5n-w-0">
              <div className="flex items-end gap-1 xl:gap-[0.3vw] w-full justify-center h-48 xl:h-[25vw]">
                <div
                  className="w-[20px] xl:w-[1.8vw] bg-gradient-to-t from-amber-400 to-amber-300 rounded-t transition-all duration-300"
                  style={{ height: `${finalPingPongHeight}%` }}
                  title={`PingPong: ${day.pingPongWins} wins`}
                />.toFixed(1)}% win rate`}
                />
                <div
                  className="w-[20px] xl:w-[1.8vw] bg-gradient-to-t from-cyan-400 to-teal-300 rounded-t transition-all duration-300"
                  style={{ height: `${finalTicTacHeight}%` }}
                  title={`TicTacToe: ${day.ticTacWins.toFixed(1)}% win rate
              </div>

              {/* Day label */}
              <span className="text-xs xl:text-[0.8vw] text-gray-400 font-medium">{day.day}</span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Legend */}
    <div className="flex justify-center gap-6 mt-6 xl:mt-[1.5vw] text-sm xl:text-[0.9vw]">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 xl:w-[0.8vw] xl:h-[0.8vw] bg-amber-400 rounded"></div>
        <span className="text-amber-400">PingPong</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 xl:w-[0.8vw] xl:h-[0.8vw] bg-cyan-400 rounded"></div>
        <span className="text-cyan-400">TicTacToe</span>
      </div>
    </div>
  </div>
</div>


  );
}
