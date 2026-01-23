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
    <div
      className="relative w-full xl:w-[55vw] flex flex-col gap-4"
    >
      <div className="absolute -top-2 -left-2 z-10">
        <div className="relative w-20 h-20 rounded-full bg-[#0F172A] flex items-center justify-center shadow-xl">
          <svg className="absolute inset-1 w-[72px] h-[72px] -rotate-90">
            <circle
              cx="36"
              cy="36"
              r="34"
              fill="none"
              stroke="#374151"
              strokeWidth="4"
            />
            <circle
              cx="36"
              cy="36"
              r="34"
              fill="none"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - borderPercentage / 100)}`}
              strokeLinecap="round"
              style={{
                stroke: `url(#levelGradient)`,
              }}
            />
            <defs>
              <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {rankGradient[rank].split(", ").map((color, index, array) => (
                  <stop 
                    key={index} 
                    offset={`${(index / (array.length - 1)) * 100}%`} 
                    stopColor={color} 
                  />
                ))}
              </linearGradient>
            </defs>
          </svg>
          <span className="relative text-xl font-semibold text-white">{level}</span>
        </div>
      </div>
      <div
  className="
    relative p-12
    rounded-2xl
    bg-gradient-to-r from-[#444E6A]/60 to-yellow-400/50
    backdrop-blur-md shadow-2xl text-white
    min-h-[280px]

    [mask-image:
      radial-gradient(80px_at_0_0,transparent_70%,black_72%),
      radial-gradient(120px_at_-20px_-20px,transparent_60%,black_65%)
    ]
    [mask-composite:intersect]
    [mask-repeat:no-repeat]
  "
>

      <div className="">
          <div className="flex flex-col items-center justify-center xl:items-start xl:ml-5 gap-3 pt-4 h-full">
            <h2 className="text-md xl:text-2xl">Perfect Time for a Pong Break</h2><br></br>
            <p className="text-xs">Face a friend, challenge the bot, or join a live</p>
            <p className="text-xs">tournament — your next match awaits!</p>
            <div 
              onClick={() => navigate("/game")} 
              className="flex items-center w-40 justify-between rounded-4xl mt-4 pl-9 pr-[0.08rem] py-[0.08rem] bg-[rgba(255,255,255,0.07)] text-white  hover:bg-[rgba(255,255,255,0.2)] transition cursor-pointer"
            >
              <p>Play Now</p>
              <div className="flex justify-center items-center bg-primary w-10 h-10 rounded-full">
                <Forward />
              </div>
            </div>
          </div>
          <img src={watlerPhoto} alt="photo" className="hidden xl:block xl:absolute xl:left-96 xl:top-[-5.1rem] xl:w-[550px] xl:h-[600px]" />
        </div>
      </div>
    </div>
  );
}


{/* <div className="relative rounded-xl p-5 bg-[rgba(68,78,106,0.5)] backdrop-blur-md shadow-xl  bg-gradient-to-r from-[#444E6A]/60 to-yellow-400/50 "></div> */}