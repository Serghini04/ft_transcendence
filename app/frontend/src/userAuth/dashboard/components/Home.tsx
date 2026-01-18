import { useEffect} from "react";
import isValidToken from "../../../globalUtils/isValidToken";
import { UseTokenStore } from "../../zustand/useStore";
import { useNavigate } from "react-router-dom";
import LaunchTheGame from "./LaunchTheGame";
import Activity from "./Activity";
import TopPlayers from "./topPlayers";
import MonthlyWinsGauge from "./MonthlyWinsGauge";
import ProgressionHistory from "./ProgressionHistory";
import WeeklyLevel from "./WeeklyLevel";

export default function Home() {
  // const navigate = useNavigate();
  // const { token, setToken } = UseTokenStore();

  // useEffect(() => {
  //   async function check() {
  //     const result = await isValidToken(token);
  //     if (!result.valid)
  //     {
  //       navigate("/auth");
  //     }
      
  //     if (result.newToken) {
  //       setToken(result.newToken);
  //     }
  //   }

  //   check();
  // }, [token, navigate]);
  
    return (
      <div
      className="
      fixed
      flex
      flex-col
      inset-0
      bg-[rgba(15,26,36,0.5)]
      mt-30
      pt-8
      md:ml-30 ml-0
      md:border-l-2 border-t-2
      border-[#27445E]
      md:rounded-tl-4xl
      md:shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_0_#27445E]
      overflow-y-auto
      overflow-x-hidden
      scrollbar-none
     
    "
      >
      <div className="w-full flex flex-col gap-8 pb-8 pt-4 px-4 md:px-6 items-center xl:items-start">
        {/* Two Column Grid Layout - 35% left, 65% right on XL screens */}
        <div className="grid grid-cols-1 xl:grid-cols-[63%_35%] gap-12 w-full xl:w-auto max-w-full xl:max-w-none">
          {/* Row 1 Left - Hero Section */}
          <LaunchTheGame />
          
          {/* Row 1 Right - Activity */}
          <Activity />
          
          {/* Row 2 Left - Top Players and Monthly Wins side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-[70%_28%] gap-5 xl:row-start-2">
            <TopPlayers />
            <MonthlyWinsGauge />
          </div>
          
          {/* Row 2 Right - Weekly Level */}
          <div className="xl:row-start-2">
            <WeeklyLevel />
          </div>
          
          {/* Row 3 Left - Progression History */}
          <div className="xl:row-start-3">
            <ProgressionHistory />
          </div>
        </div>
      </div>
      </div>
    );
}