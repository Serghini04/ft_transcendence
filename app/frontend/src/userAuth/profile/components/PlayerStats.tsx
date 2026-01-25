import React from "react";
import { motion } from "framer-motion";

interface PlayerStatsProps {
  played: number;
  wins: number;
  losses: number;
}
// w-full max-w-3xl  mx-auto flex flex-col gap-4 p-4 pl-[6rem]
export default function PlayerStats({ played, wins, losses }: PlayerStatsProps) {
  // console.log("PlayerStats Props: ", { played, wins, losses });
  return (
    <motion.div
  transition={{ duration: 0.6 }}
  whileHover={{ scale: 1.03, y: -2 }}
  className="
    w-full
    max-w-2xl
    mt-6
    xl:max-w-[38vw]
    xl:mt-[1.5vw]
  "
>
  <div
    className="
      w-full
      max-w-2xl
      mx-auto
      flex
      flex-col
      gap-4
      p-4
      pl-[6rem]
      md:pl-4
      xl:max-w-[40vw]
      xl:gap-[1vw]
      xl:p-[1.2vw]
      xl:pl-[1.5vw]
    "
  >
    <div
      className="
        w-full
        max-w-3xl
        mx-auto
        rounded-2xl
        bg-black/60
        border
        border-white/10
        shadow-lg
        p-6
        text-white
        xl:max-w-[42vw]
        xl:rounded-[1.4vw]
        xl:p-[1.6vw]
      "
    >
      <h3
        className="
          text-lg
          font-semibold
          mb-4
          text-center
          text-teal-400
          xl:text-[1.3vw]
          xl:mb-[1vw]
        "
      >
        Match Statistics
      </h3>

      <div
        className="
          grid
          grid-cols-3
          gap-4
          text-center
          xl:gap-[1vw]
        "
      >
        {/* Played */}
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            bg-blue-500/10
            border
            border-blue-400/20
            rounded-xl
            p-4
            xl:rounded-[1vw]
            xl:p-[1vw]
          "
        >
          <span className="text-3xl font-bold xl:text-[2vw]">
            {played}
          </span>
          <span className="text-sm text-gray-300 mt-1 xl:text-[0.9vw] xl:mt-[0.2vw]">
            Played
          </span>
        </div>

        {/* Wins */}
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            bg-green-500/10
            border
            border-green-400/20
            rounded-xl
            p-4
            xl:rounded-[1vw]
            xl:p-[1vw]
          "
        >
          <span className="text-3xl font-bold text-emerald-400 xl:text-[2vw]">
            {wins}
          </span>
          <span className="text-sm text-green-400 mt-1 xl:text-[0.9vw] xl:mt-[0.2vw]">
            Wins
          </span>
        </div>

        {/* Losses */}
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-xl
            p-4
            bg-red-500/10
            border
            border-red-400/20
            xl:rounded-[1vw]
            xl:p-[1vw]
          "
        >
          <span className="text-3xl font-bold text-red-400 xl:text-[2vw]">
            {losses}
          </span>
          <span className="text-sm text-red-300 mt-1 xl:text-[0.9vw] xl:mt-[0.2vw]">
            Losses
          </span>
        </div>
      </div>

      {/* Win rate */}
      <div className="mt-6 xl:mt-[1.2vw]">
        <div
          className="
            flex
            justify-between
            text-sm
            text-gray-300
            mb-1
            xl:text-[0.9vw]
            xl:mb-[0.3vw]
          "
        >
          <span>Win Rate</span>
          <span>{played > 0 ? Math.round((wins / played) * 100) : 0}%</span>
        </div>

        <div
          className="
            w-full
            h-3
            bg-blue-500/10
            border
            border-blue-400/20
            rounded-full
            overflow-hidden
            xl:h-[0.5vw]
            xl:rounded-[1vw]
          "
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
            style={{ width: `${played > 0 ? (wins / played) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  </div>
</motion.div>

  );
}
