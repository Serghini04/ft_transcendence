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
    <div
  className="
    w-full
    xl:w-[13vw]
    xl:max-w-[90vw]
    xl:min-h-[clamp(12vw,15vw,20vw)]
    h-full
  "
>
  <div
    className="
      w-full h-full
      bg-[rgba(68,78,106,0.3)]
      rounded-2xl
      xl:rounded-[1.5vw]
      p-6
      xl:p-[2.2vw]
      shadow-2xl
      border border-white/10
    "
  >
    {/* TITLE */}
    <h2
      className="
        text-gray-300
        text-lg
        xl:text-[1.4vw]
        font-medium
        mb-4
        xl:mb-[1.5vw]
      "
    >
      Monthly Wins
    </h2>

    {/* STATS */}
    <div
      className="
        text-center
        mb-2
        xl:mb-[1vw]
      "
    >
      <div
        className="
          text-3xl
          xl:text-[2.4vw]
          font-bold
          text-white
          mb-1
          xl:mb-[0.6vw]
        "
      >
        {wins} Wins
      </div>
    </div>

    {/* GAUGE */}
    <div
      className="
        flex justify-center
        mt-4
        xl:mt-[1.8vw]
      "
    >
      <svg
        className="
          w-[200px] h-[120px]
          xl:w-[14vw] xl:h-[8vw]
        "
        viewBox="0 0 200 120"
      >
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

        {/* PERCENTAGE */}
<text
  x={center}
  y={center + 10}
  textAnchor="middle"
  fill="white"
  fontWeight="bold"
  fontSize={typeof width === "number" ? Math.max(Math.min(width * 0.05, 48), 16) : 35} 
>
  {winRate}%
</text>

      </svg>
    </div>
  </div>
</div>

  );
}
