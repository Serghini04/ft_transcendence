
import React, { useEffect, useState } from "react";
import { UseTokenStore } from "../../zustand/useStore";

interface Player {
  user_id: string;
  username: string;
  total_games: number;
  wins: number;
  losses: number;
  total_score: number;
  goals_conceded: number;
}

const colorPalette = ["amber", "emerald", "cyan", "violet", "pink", "blue", "purple", "indigo"];

export default function TopPlayersTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = UseTokenStore();

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        console.log("Fetching top players with token:", token ? "Token exists" : "No token");
        const response = await fetch("/api/v1/leaderboard?limit=4", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Leaderboard data:", data);
          setPlayers(data.leaderboard.slice(0, 4));
        } else {
          console.error("Failed to fetch leaderboard:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Error fetching top players:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTopPlayers();
    } else {
      console.log("No token available, skipping fetch");
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full h-full rounded-2xl bg-[rgba(68,78,106,0.3)] border border-white/10 shadow-xl backdrop-blur-md">
          <div className="px-6 py-3 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Top Players</h2>
          </div>
          <div className="px-6 py-8 text-center text-white/60">Loading...</div>
        </div>
      </div>
    );
  }

  return (
     <div className="w-full">
        <div className="w-full h-full rounded-2xl bg-[rgba(68,78,106,0.3)] border border-white/10 shadow-xl backdrop-blur-md">
        <div className="px-6 py-3 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Top Players</h2>
        </div>

        <div className="grid grid-cols-4 px-6 py-2 text-sm text-white/60">
            <span>#</span>
            <span>Name</span>
            <span className="text-center">Games Played</span>
            <span className="text-center">Win Rate</span>
        </div>

        <div className="divide-y divide-white/10">
            {players.length === 0 ? (
              <div className="px-6 py-8 text-center text-white/60">No players found</div>
            ) : (
              players.map((player, index) => {
                const winRate = player.total_games > 0 
                  ? Math.round((player.wins / player.total_games) * 100) 
                  : 0;
                const color = colorPalette[index % colorPalette.length];
                
                return (
                  <div
                    key={player.user_id}
                    className="grid grid-cols-4 items-center px-6 py-2 text-white"
                  >
                    <span className="text-white/80">{String(index + 1).padStart(2, "0")}</span>
                    <span className="font-medium">{player.username}</span>
                    <span className="text-center font-semibold">{player.total_games}</span>
                    <span className="flex justify-center">
                      <span
                        className={`px-3 py-1 rounded-md text-sm font-semibold border border-${color}-400/40 bg-${color}-400/10 text-${color}-400`}
                      >
                        {winRate}%
                      </span>
                    </span>
                  </div>
                );
              })
            )}
        </div>
        </div>
    </div>
  );
}
