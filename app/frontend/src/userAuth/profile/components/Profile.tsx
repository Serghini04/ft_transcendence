import Bio from "./Bio";
import GoalStats from "./GoalStats";
import LastMatches from "./LastMatches";
import PlayerStats from "./PlayerStats";
import ProfileCard from "./ProfileCard";
import ProfileHeader from "./ProfileHeader";

export default function Profile()
{
    console
    return (
        <div
        className="
          fixed
          flex
          flex-col
          inset-0
          bg-[rgba(15,26,36,0.5)]
          mt-30
          md:ml-30 ml-[-5rem]
          border-l-2 md:border-l-2 border-t-2
          border-[#27445E]
          rounded-tl-4xl
          shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_0_#27445E]
          overflow-y-auto
          overflow-x-hidden
          scrollbar-none
         
        "
      >
        <div className="w-full flex flex-col gap-8 pb-8 pt-4">
                <ProfileCard />
                <Bio />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-4 items-center justify-center">
                <div className="">
                    <LastMatches />
                </div>
                    <div className=" flex flex-col items-center justify-center w-full">
                        <PlayerStats />
                        <GoalStats />
                    </div>
            </div>
        </div>
      </div>
      );
}

