import { Forward } from "lucide-react";
import watlerPhoto from "../../../../public/walterDashboard.png";


export default function LaunchTheGame() {
  return (
    <div
      className="relative w-full flex flex-col gap-4"
    >
      <div className="absolute -top-2 -left-2 z-10">
        <div className="relative w-20 h-20 rounded-full bg-[#0F172A] flex items-center justify-center shadow-xl">
          <div className="absolute inset-1 rounded-full border-4 border-emerald-400/70"></div>
          <span className="relative text-xl font-semibold text-white">8,2</span>
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
            <div className="flex items-center w-40 justify-between rounded-4xl mt-4 pl-9 pr-[0.08rem] py-[0.08rem] bg-[rgba(255,255,255,0.07)] text-white  hover:bg-[rgba(255,255,255,0.2)] transition">
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