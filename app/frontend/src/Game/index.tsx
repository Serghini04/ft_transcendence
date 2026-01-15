
import { Outlet } from "react-router-dom";
import { UseTokenStore } from "../userAuth/zustand/useStore";
import { useNavigate } from "react-router-dom";
import { useEffect} from "react";
import isValidToken from "../globalUtils/isValidToken";

interface GameProps {
  menuOpen: boolean;
}

export default function Game({ menuOpen}: GameProps) {
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
    <div className="relative w-full min-h-screen">
      <div
        className="
        fixed
        bg-[rgba(15,26,36,0.5)]
        mt-30
        md:ml-30 ml-[-5rem]   /* push left off-screen on mobile */
        border-l-2 md:border-l-2 border-t-2
        rounded-tl-4xl
        border-[#27445E]
        inset-0
        flex
      "
      >
        <div 
           className={`
            flex-1
            p-4
            transition-all duration-500 ease-in-out
            ${menuOpen ? "ml-35 md:ml-10" : "ml-20"}
          `}
          >
            <Outlet/>
        </div>
      </div>
    </div>
  );
}
