
import React from "react";

const players = [
  { id: 1, name: "skarim", games: 83, winRate: 46, color: "amber" },
  { id: 2, name: "hidriouc", games: 15, winRate: 17, color: "emerald" },
  { id: 3, name: "mserghi", games: 99, winRate: 19, color: "cyan" },
  { id: 4, name: "tboussad", games: 103, winRate: 29, color: "violet" },
];

export default function TopPlayersTable() {
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
            {players.map((player) => (
            <div
                key={player.id}
                className="grid grid-cols-4 items-center px-6 py-2 text-white"
            >
                <span className="text-white/80">{String(player.id).padStart(2, "0")}</span>
                <span className="font-medium">{player.name}</span>
                <span className="text-center font-semibold">{player.games}</span>
                <span className="flex justify-center">
                <span
                    className={`px-3 py-1 rounded-md text-sm font-semibold border border-${player.color}-400/40 bg-${player.color}-400/10 text-${player.color}-400`}
                >
                    {player.winRate}%
                </span>
                </span>
            </div>
            ))}
        </div>
        </div>
    </div>
  );
}
