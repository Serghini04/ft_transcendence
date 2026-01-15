import { motion } from "framer-motion";

type Rank = "bronze" | "silver" | "gold" | "diamond";

interface PlayerStatsProps {
  wins: number;
  losses: number;
}

const rankGlow: Record<Rank, string> = {
  bronze: "rgba(251,146,60,0.6)",
  silver: "rgba(203,213,225,0.8)",
  gold: "rgba(253,224,71,0.9)",
  diamond: "rgba(56,189,248,1)",
};

const rankGradient: Record<Rank, string> = {
  bronze: "#92400e, #f97316, #facc15",
  silver: "#e5e7eb, #cbd5f5, #9ca3af",
  gold: "#facc15, #f59e0b, #eab308",
  diamond: "#22d3ee, #38bdf8, #6366f1",
};

export default function ProfileCard({wins, losses }: PlayerStatsProps) {
  let rank: Rank; // Example rank, this would be dynamic in a real app
  wins = 3;
  losses = 12;
  let total = wins + losses;
  let winRate = total > 0 ? (wins / total) * 100 : 0;
  switch (true) {
    case (winRate < 70): // Replace with actual condition for bronze
      rank = "bronze";
      break;
    case (winRate < 80 ): // Replace with actual condition for silver
      rank = "silver";
      break;
    case (winRate < 90): // Replace with actual condition for gold
      rank = "gold";
      break;
    default:
      rank = "diamond";
  }

  return (
    // <motion.div
    //   initial={{ opacity: 0, y: 30 }}
    //   animate={{ opacity: 1, y: 0 }}
    //   transition={{ duration: 0.6 }}
    //   className="flex justify-center items-center" //left-1/2 -translate-x-1/2
    // >
        <div className=" w-full  mx-auto flex flex-col gap-4  pl-[5.2rem] mt-[-0.8rem] pr-[0.3rem] md:pl-1">
        <div
            className="relative sm:h-[9rem] md:h-[11rem] lg:h-[15rem] xl:h-[20rem] flex items-center gap-4 rounded-xl md:rounded-tl-[1.7rem] p-4 backdrop-blur-md shadow-xl"
            style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.3))`,
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.10) 80%, rgba(0,0,0,0.75) 100%
    ), url("public/rasselBG.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
              boxShadow: `0 0 30px ${rankGlow[rank]}`,
            }}
        >
            {/* Animated glow layer */}
            {/* <motion.div
            className="absolute inset-0 rounded-xl md:rounded-tl-[1.7rem]  pointer-events-none"
            animate={{ opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
                background: `radial-gradient(circle at top left, ${rankGlow[rank]}, transparent 70%)`,
            }}
            /> */}

            {/* Avatar */}
            <img
            src="public/rasell.png"
            alt="avatar"
            className="w-12 h-12 md:w-14 md:h-14 lg:w-19 lg:h-19 xl:w-24 xl:h-24 rounded-full object-cover border-2 border-white"
            />

            {/* Info */}
            <div className="relative z-10 flex flex-col min-w-0">
            <span className="text-sm md:text-lg lg:text-xl xl:text-2xl font-semibold text-white truncate">
                Soulayman Ouaourikt
            </span>

            <span className="text-xs lg:text-base xl:text-lg text-gray-300 truncate">
                ouaouriktsoulaymane@gmail.com
            </span>

            {/* Level bar */}
            <div className="mt-2 flex items-center gap-2">
                <div className="w-37 h-[0.4rem] sm:w-40 md:w-43 lg:w-50 lg:h-2 xl:w-56 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full"
                    style={{
                    width: "65%",
                    background: `linear-gradient(90deg, ${rankGradient[rank]})`,
                    }}
                />
                </div>
                <span className="text-xs lg:text-sm text-gray-300 whitespace-nowrap">
                level 9.2
                </span>
            </div>
            </div>

            {/* Rank badge */}
            <div
            className="ml-auto px-4 py-2 rounded-xl font-extrabold text-sm md:text-base lg:text-lg xl:text-xl text-transparent bg-clip-text"
            style={{
                backgroundImage: `linear-gradient(90deg, ${rankGradient[rank]})`,
            }}
            >
            {rank.toUpperCase()}
            </div>
        </div>
      </div>
    // </motion.div>
  );
}
