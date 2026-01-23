import React from "react";

interface MonthlyWinsGaugeProps {
  wins?: number;
  totalGames?: number;
}

export default function MonthlyWinsCard({ wins = 0, totalGames = 0 }: MonthlyWinsGaugeProps) {
  const percentageChange = 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // Gauge settings
  const radius = 80;
  const strokeWidth = 20;
  const center = 100;

  // Semi-circle angles
  const startAngle = 180;
  const endAngle = startAngle + (winRate / 100) * 180;

  // Convert angles to coordinates
  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);

  return (
    <div className="w-full">
      <div className="bg-[rgba(68,78,106,0.3)] rounded-2xl p-6 shadow-2xl border border-white/10 w-full">
        <h2 className="text-gray-300 text-lg font-medium mb-4">
          Monthly Total Wins
        </h2>

        <div className="text-center mb-2">
          <div className="text-3xl font-bold text-white mb-1">
            {wins} Wins
          </div>
          <div className="text-emerald-400 text-xs">
            {percentageChange}% more than last month
          </div>
        </div>

        {/* Gauge */}
        <div className="flex justify-center mt-4">
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Background arc */}
            <path
              d={`M ${center - radius} ${center}
                  A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
              fill="none"
              stroke="#374151"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Progress arc */}
            <path
              d={`M ${start.x} ${start.y}
                  A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
              fill="none"
              stroke="#a7f3d0"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />

            {/* Percentage text */}
            <text
              x={center}
              y={center + 10}
              textAnchor="middle"
              className="text-4xl font-bold fill-white"
            >
              {winRate}%
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
