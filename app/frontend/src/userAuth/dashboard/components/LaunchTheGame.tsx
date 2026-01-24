import { Forward } from "lucide-react";
import watlerPhoto from "../../../../public/walterDashboard.png";
import { useNavigate } from "react-router-dom";

type Rank = "bronze" | "silver" | "gold" | "diamond";

interface LaunchTheGameProps {
  wins?: number;
  losses?: number;
}

const rankGradient: Record<Rank, string> = {
  bronze: "#92400e, #f97316, #facc15",
  silver: "#e5e7eb, #cbd5f5, #9ca3af",
  gold: "#facc15, #f59e0b, #eab308",
  diamond: "#22d3ee, #38bdf8, #6366f1",
};

export default function LaunchTheGame({ wins = 0, losses = 0 }: LaunchTheGameProps) {
  const navigate = useNavigate();
  
  // Calculate rank based on win rate (same logic as profile)
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const level = (1 + (total * 0.02) + (wins * 0.03)).toFixed(1);
  
  let rank: Rank;
  switch (true) {
    case (winRate < 70):
      rank = "bronze";
      break;
    case (winRate < 80):
      rank = "silver";
      break;
    case (winRate < 90):
      rank = "gold";
      break;
    default:
      rank = "diamond";
  }
  
  // Calculate border percentage based on level (same as profile progress bar)
  const borderPercentage = Math.min(parseFloat(level) * 10, 100);
  
  return (
    <div className="relative w-full flex flex-col gap-4 xl:w-[50vw] xl:max-w-[90vw] xl:gap-[1vw]">
  {/* LEVEL BADGE */}
  <div className="absolute -top-2 -left-2 z-10 xl:-top-[0.6vw] xl:-left-[0.6vw]">
    <div className="relative w-20 h-20 xl:w-[5vw] xl:h-[5vw] rounded-full bg-[#0F172A] flex items-center justify-center shadow-xl">
      <svg
        className="absolute inset-1 xl:inset-[0.3vw] w-full h-full -rotate-90"
        viewBox="0 0 72 72"
      >
        {/* Outer circle */}
        <circle
          cx="39.5"
          cy="33"
          r="30.5"
          fill="none"
          stroke="#374151"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="39.5"
          cy="33"
          r="30.5"
          fill="none"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 34}`}
          strokeDashoffset={`${2 * Math.PI * 34 * (1 - borderPercentage / 100)}`}
          strokeLinecap="round"
          style={{ stroke: `url(#levelGradient)` }}
        />
        <defs>
          <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {rankGradient[rank].split(", ").map((color, i, arr) => (
              <stop key={i} offset={`${(i / (arr.length - 1)) * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
      </svg>

      {/* Level text */}
      <span className="text-xl xl:text-[1.2vw] font-semibold text-white">{level}</span>
  </div>
    </div>

  {/* CARD */}
  <div className="
    relative
    p-12
    xl:p-[3vw]
    rounded-2xl
    xl:rounded-[1.5vw]
    bg-gradient-to-r from-[#444E6A]/60 to-yellow-400/50
    backdrop-blur-md shadow-2xl
    text-white
    min-h-[280px]
    xl:min-h-[18vw]

    [mask-image:
      radial-gradient(80px_at_0_0,transparent_70%,black_72%),
      radial-gradient(120px_at_-20px_-20px,transparent_60%,black_65%)
    ]
    xl:[mask-image:
      radial-gradient(5vw_at_0_0,transparent_70%,black_72%),
      radial-gradient(7vw_at_-1vw_-1vw,transparent_60%,black_65%)
    ]
    [mask-composite:intersect]
    [mask-repeat:no-repeat]
  ">

    <div className="
      flex flex-col
      items-center
      justify-center
      xl:items-start
      gap-3
      xl:gap-[0.8vw]
      pt-4
      xl:pt-[1vw]
      xl:ml-[1.5vw]
      h-full
    ">

      <h2 className="text-md xl:text-[1.6vw] leading-tight">
        Perfect Time for a Pong Break
      </h2>

      <p className="text-xs xl:text-[0.95vw]">
        Face a friend, challenge the bot, or join a live
      </p>
      <p className="text-xs xl:text-[0.95vw]">
        tournament — your next match awaits!
      </p>

      {/* BUTTON */}
      <div
        onClick={() => navigate("/game")}
        className="
          flex items-center justify-between
          w-40
          xl:w-[10vw]
          mt-4
          xl:mt-[1.2vw]
          pl-9
          xl:pl-[2.2vw]
          pr-[0.08rem]
          xl:pr-[0.3vw]
          py-[0.08rem]
          xl:py-[0.3vw]
          rounded-4xl
          xl:rounded-[2vw]
          bg-[rgba(255,255,255,0.07)]
          hover:bg-[rgba(255,255,255,0.2)]
          transition
          cursor-pointer
        "
      >
        <p className="xl:text-[1vw]">Play Now</p>

        <div className="
          flex justify-center items-center
          bg-primary
          w-10 h-10
          xl:w-[2.6vw] xl:h-[2.6vw]
          rounded-full
        ">
          <Forward />
        </div>
      </div>
    </div>

    {/* IMAGE */}
    {/* <img
      src={watlerPhoto}
      alt="photo"
      className="
        hidden xl:block
        absolute
        xl:left-[26vw]
        xl:top-[-3vw]
        xl:w-[32vw]
        xl:h-[36vw]
      "
    /> */}
  </div>
</div>

  );
}


{/* <div className="relative rounded-xl p-5 bg-[rgba(68,78,106,0.5)] backdrop-blur-md shadow-xl  bg-gradient-to-r from-[#444E6A]/60 to-yellow-400/50 "></div> */}