import { useEffect} from "react";
import isValidToken from "../../../globalUtils/isValidToken";
import { UseTokenStore } from "../../zustand/useStore";
import { useNavigate } from "react-router-dom";
import LaunchTheGame from "./LaunchTheGame";
import Activity from "./Activity";

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
        <LaunchTheGame />
        <Activity />
      </div>
      </div>
    );
}