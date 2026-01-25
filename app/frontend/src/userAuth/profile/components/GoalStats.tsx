"use client";

import { motion } from "framer-motion";

interface GoalStatsProps {
  scored: number;
  conceded: number;
  matches: number;
}

export default function GoalStats({ scored, conceded, matches }: GoalStatsProps) {
  const avgScored = matches > 0 ? (scored / matches).toFixed(1) : "0";
  // const avgConceded = matches > 0 ? (conceded / matches).toFixed(1) : "0";

  return (
    <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  whileHover={{ scale: 1.03, y: -2 }}
  className="
    w-full
    max-w-2xl
    mx-auto
    mt-6
    xl:max-w-[38vw]
    xl:mt-[1.5vw]
  "
>
  <div
    className="
      w-full
      max-w-3xl
      mx-auto
      flex
      flex-col
      gap-4
      p-4
      pl-[6rem]
      md:pl-4
      xl:max-w-[40vw]
      xl:gap-[1vw]
      xl:p-[1vw]
      xl:pl-[1.5vw]
    "
  >
    <div
      className="
        relative
        rounded-xl
        p-5
        bg-black/60
        backdrop-blur-md
        shadow-xl
        border
        border-white/10
        xl:rounded-[1.2vw]
        xl:p-[1.4vw]
      "
    >
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none xl:rounded-[1.2vw]"
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          background:
            "radial-gradient(circle at top, rgba(59,130,246,0.35), transparent 70%)",
        }}
      />

      <h3
        className="
          relative
          z-10
          text-lg
          font-semibold
          text-center
          text-teal-400
          mb-4
          xl:text-[1.3vw]
          xl:mb-[1vw]
        "
      >
        Goal Statistics
      </h3>

      <div
        className="
          relative
          z-10
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
          xl:gap-[1vw]
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-xl
            bg-green-500/10
            border
            border-green-400/20
            p-4
            xl:rounded-[1vw]
            xl:p-[1vw]
          "
        >
          <span className="text-3xl font-bold text-green-400 xl:text-[2vw]">
            {scored}
          </span>
          <span className="text-sm text-green-300 xl:text-[0.9vw]">
            Goals Scored
          </span>
        </div>

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-xl
            bg-red-500/10
            border
            border-red-400/20
            p-4
            xl:rounded-[1vw]
            xl:p-[1vw]
          "
        >
          <span className="text-3xl font-bold text-red-400 xl:text-[2vw]">
            {conceded}
          </span>
          <span className="text-sm text-red-300 xl:text-[0.9vw]">
            Goals Conceded
          </span>
        </div>

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-xl
            bg-blue-500/10
            border
            border-blue-400/20
            p-4
            xl:rounded-[1vw]
            xl:p-[1vw]
          "
        >
          <span className="text-3xl font-bold text-blue-400 xl:text-[2vw]">
            {avgScored}
          </span>
          <span className="text-sm text-blue-300 xl:text-[0.9vw]">
            Avg / Match
          </span>
        </div>
      </div>
    </div>
  </div>
</motion.div>

  );
}
