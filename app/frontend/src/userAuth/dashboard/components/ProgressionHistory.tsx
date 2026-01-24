import React, { useEffect, useState } from "react";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";
import { authenticatedFetch } from "../../../globalUtils/authenticatedFetch";

interface DailyStats {
  day: string;
  scored: number;
  conceded: number;
}

interface ProgressionHistoryProps {
  scored?: number;
  conceded?: number;
  totalGames?: number;
}

interface GameData {
  id: number;
  game_id: string;
  mode: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score1: number;
  score2: number;
  created_at: number;
}

export default function ProgressionHistory({ scored = 0, conceded = 0, totalGames = 0 }: ProgressionHistoryProps) {
  const { token } = UseTokenStore();
  const { user } = UseUserStore();
  
  const [dailyData, setDailyData] = useState<DailyStats[]>([
    { day: "Mon", scored: 0, conceded: 0 },
    { day: "Tue", scored: 0, conceded: 0 },
    { day: "Wed", scored: 0, conceded: 0 },
    { day: "Thu", scored: 0, conceded: 0 },
    { day: "Fri", scored: 0, conceded: 0 },
    { day: "Sat", scored: 0, conceded: 0 },
    { day: "Sun", scored: 0, conceded: 0 },
  ]);

  useEffect(() => {
    async function fetchDailyGoals() {
      if (!token || !user.id) {
        console.log("⚠️ Missing token or user.id");
        return;
      }

      console.log("🔄 Fetching games - Total games:", totalGames);

      try {
        const res = await authenticatedFetch(`http://localhost:8080/api/v1/leaderboard/player/${user.id}/games?limit=100`);
        
        const data = await res.json();

        console.log("📊 Goals History - Full response:", data);
        console.log("📊 Goals History - Games count:", data.count);
        console.log("📊 Goals History - Games array length:", data.games?.length || 0);
        
        if (res.ok && data.games && Array.isArray(data.games)) {
          const goalsPerDay = [
            { day: "Mon", scored: 0, conceded: 0 },
            { day: "Tue", scored: 0, conceded: 0 },
            { day: "Wed", scored: 0, conceded: 0 },
            { day: "Thu", scored: 0, conceded: 0 },
            { day: "Fri", scored: 0, conceded: 0 },
            { day: "Sat", scored: 0, conceded: 0 },
            { day: "Sun", scored: 0, conceded: 0 },
          ];
          
          const now = new Date();
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          
          console.log("📅 Date range:", sevenDaysAgo.toLocaleString(), "to", now.toLocaleString());
          
          let processedCount = 0;
          data.games.forEach((game: GameData, index: number) => {
            const gameDate = new Date(game.created_at);
            
            if (index === 0) {
              console.log("🔍 First game full object:", game);
              console.log("🔍 Game properties:", Object.keys(game));
            }
            
            console.log(`🎮 Game ${game.id}: date=${gameDate.toLocaleString()}, in range=${gameDate >= sevenDaysAgo}`);
            
            if (gameDate >= sevenDaysAgo) {
              processedCount++;
              let dayOfWeek = gameDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
              const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6
              
              let userScore = 0;
              let opponentScore = 0;
              
              // Convert to string for comparison
              const userIdStr = String(user.id);
              if (game.player1_id === userIdStr) {
                userScore = game.score1;
                opponentScore = game.score2;
              } else if (game.player2_id === userIdStr) {
                userScore = game.score2;
                opponentScore = game.score1;
              }
              
              console.log(`⚽ Game on ${goalsPerDay[dayIndex].day} - Scored: ${userScore} Conceded: ${opponentScore}`);
              
              goalsPerDay[dayIndex].scored += userScore;
              goalsPerDay[dayIndex].conceded += opponentScore;
            }
          });
          
          console.log(`✅ Processed ${processedCount} of ${data.games.length} games`);
          console.log("📈 Final daily data:", goalsPerDay);
          setDailyData(goalsPerDay);
        } else {
          console.log("❌ No games found or invalid response");
        }
      } catch (err) {
        console.error("Error fetching games:", err);
      }
    }
    fetchDailyGoals();
  }, [user.id, token, totalGames]);
  
  const maxValue = Math.max(100, ...dailyData.map(d => Math.max(d.scored, d.conceded)));
  const height = 150;
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = chartWidth / (dailyData.length - 1);

  const getY = (value: number) => {
    return padding.top + chartHeight - (value / maxValue) * chartHeight;
  };

  const createPath = (dataKey: 'scored' | 'conceded') => {
    return dailyData.map((point, index) => {
      const x = padding.left + index * xStep;
      const y = getY(point[dataKey]);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div
  className="
    w-full
    xl:w-[50vw]
    xl:max-w-[90vw]
    xl:min-h-[clamp(12vw,22vw,32vw)]
    self-start
    mb-10
  "
>
  <div
    className="
      rounded-2xl
      xl:rounded-[1.5vw]
      p-6
      xl:p-[2.2vw]
      bg-[rgba(68,78,106,0.3)]
      shadow-xl
      border border-white/10
      backdrop-blur-md
      w-full
      self-start

    "
  >
    {/* HEADER */}
    <div
      className="
        flex justify-between items-center
        mb-6
        xl:mb-[2vw]
      "
    >
      <h2
        className="
          text-white
          text-lg
          xl:text-[1.4vw]
          font-semibold
        "
      >
        Goals Stats
      </h2>

      <div className="text-right">
        <p className="text-amber-400 text-sm xl:text-[0.95vw]">
          Scored: <span className="font-semibold">{scored}</span>
        </p>
        <p className="text-cyan-400 text-sm xl:text-[0.95vw]">
          Conceded: <span className="font-semibold">{conceded}</span>
        </p>
      </div>
    </div>

    {/* CHART */}
    <div className="relative w-full">
      <svg
        className="
          w-full
          h-[220px]
          xl:h-[14vw]
        "
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* GRID */}
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={getY(value)}
              x2={width - padding.right}
              y2={getY(value)}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.3"
            />
            <text
              x={padding.left - 10}
              y={getY(value)}
              textAnchor="end"
              fill="#9CA3AF"
              dominantBaseline="middle"
              fontSize={width * 0.018} // 1.2% of SVG width
            >
              {value}
            </text>
          </g>
        ))}

        {/* SCORED */}
        <path
          d={createPath("scored")}
          fill="none"
          stroke="#FCD34D"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* CONCEDED */}
        <path
          d={createPath("conceded")}
          fill="none"
          stroke="#22D3EE"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* POINTS */}
        {dailyData.map((point, index) => {
          const x = padding.left + index * xStep;
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={getY(point.scored)}
                r="3"
                className="xl:r-[0.3vw]"
                fill="#FCD34D"
              />
              <circle
                cx={x}
                cy={getY(point.conceded)}
                r="3"
                className="xl:r-[0.3vw]"
                fill="#22D3EE"
              />
            </g>
          );
        })}

        {/* X LABELS */}
        {dailyData.map((point, index) => {
          const x = padding.left + index * xStep;
          return (
            <text
              key={index}
              x={x}
              y={height - 5}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize={width * 0.018} // same scaling
            >
              {point.day}
            </text>
          );
        })}
      </svg>
    </div>
  </div>
</div>

  );
}
