import { motion } from "framer-motion";

type Rank = "bronze" | "silver" | "gold" | "diamond";

interface PlayerStatsProps {
  wins: number;
  losses: number;
  user: {
    name: string;
    email: string;
    photoURL: string;
    bgPhotoURL: string;
  };
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

export default function ProfileCard(props: PlayerStatsProps) {
  let rank: Rank; // Example rank, this would be dynamic in a real app
  let total = props.wins + props.losses;
  let winRate = total > 0 ? (props.wins / total) * 100 : 0;
  const level = (1 + (total * 0.02) + (props.wins * 0.03)).toFixed(1);
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
        <div className="
  w-full
  mx-auto
  flex flex-col
  gap-4
  pl-[5.2rem]
  mt-[-0.8rem]
  pr-[0.3rem]
  md:pl-1
  xl:gap-[1vw]
">
  <div
    className="
      relative
      sm:h-[9rem]
      md:h-[11rem]
      lg:h-[15rem]
      xl:h-[20vw]
      flex
      items-center
      gap-4
      xl:gap-[1vw]
      rounded-xl
      md:rounded-tl-[1.7rem]
      xl:rounded-tl-[2vw]
      p-4
      xl:p-[1.2vw]
      backdrop-blur-md
      shadow-xl
    "
    style={{
      background: `linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.3))`,
      backgroundImage: `linear-gradient(
        to right,
        rgba(0,0,0,0.75) 0%,
        rgba(0,0,0,0.35) 40%,
        rgba(0,0,0,0.10) 80%,
        rgba(0,0,0,0.75) 100%
      ), url(${props.user.bgPhotoURL.startsWith('http') 
        ? props.user.bgPhotoURL 
        : `${window.location.origin}/${props.user.bgPhotoURL}`})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      boxShadow: `0 0 30px ${rankGlow[rank]}`,
    }}
  >

    {/* Avatar */}
    <img
      src={`${props.user.photoURL.startsWith('http') 
        ? props.user.photoURL 
        : `${window.location.origin}/${props.user.photoURL}`}`}
      alt="avatar!"
      className="
        w-12 h-12
        md:w-14 md:h-14
        lg:w-19 lg:h-19
        xl:w-[4vw] xl:h-[4vw]
        rounded-full
        object-cover
        border-2
        border-white
      "
    />

    {/* Info */}
    <div className="relative z-10 flex flex-col min-w-0">
      <span className="
        text-sm
        md:text-lg
        lg:text-xl
        xl:text-[1.6vw]
        font-semibold
        text-white
        truncate
      ">
        {props.user.name}
      </span>

      <span className="
        text-xs
        lg:text-base
        xl:text-[1.1vw]
        text-gray-300
        truncate
      ">
        {props.user.email}
      </span>

      {/* Level bar */}
      <div className="mt-2 xl:mt-[0.6vw] flex items-center gap-2 xl:gap-[0.5vw]">
        <div className="
          w-37
          h-[0.4rem]
          sm:w-40
          md:w-43
          lg:w-50
          lg:h-2
          xl:w-[12vw]
          xl:h-[0.5vw]
          bg-gray-700
          rounded-full
          overflow-hidden
        ">
          <div
            className="h-full"
            style={{
              width: `${Math.min(parseFloat(level) * 10, 100)}%`,
              background: `linear-gradient(90deg, ${rankGradient[rank]})`,
            }}
          />
        </div>

        <span className="
          text-xs
          lg:text-sm
          xl:text-[1vw]
          text-gray-300
          whitespace-nowrap
        ">
          level {level}
        </span>
      </div>
    </div>

    {/* Rank badge */}
    <div
      className="
        ml-auto
        px-4
        py-2
        xl:px-[1.2vw]
        xl:py-[0.6vw]
        rounded-xl
        xl:rounded-[0.8vw]
        font-extrabold
        text-sm
        md:text-base
        lg:text-lg
        xl:text-[1.5vw]
        text-transparent
        bg-clip-text
      "
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
