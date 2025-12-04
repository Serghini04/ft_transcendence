import { useEffect} from "react";
import isValidToken from "../../globalUtils/isValidToken";
import { UseTokenStore } from "../LoginAndSignup/zustand/useStore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const { token, setToken } = UseTokenStore();

  useEffect(() => {
    async function check() {
      console.error("-----> Checking token validity on Home:", token);
      const result = await isValidToken(token);
      if (!result.valid)
      {
        navigate("/auth");
      }
      
      if (result.newToken) {
        setToken(result.newToken);
      }
    }

    check();
  }, [token, navigate]);
  
    return (
      <div
              className="
                fixed
                bg-[rgba(15,26,36,0.5)]
                mt-30
                md:ml-30 ml-[-5rem]   /* push left off-screen on mobile */
                rounded-tl-4xl shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_#27445E]
                inset-0
                flex
              "
            >
            </div>
    );
  }