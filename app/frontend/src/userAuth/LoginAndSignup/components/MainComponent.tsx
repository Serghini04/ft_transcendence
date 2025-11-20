import WelcomeText from "./WelcomeText"
import LoginSide from "./LoginSide"
import { GoogleOAuthProvider } from "@react-oauth/google"
import isValidToken from "../../globalUtils/isValidToken";
import { useNavigate } from "react-router-dom";
import { UseTokenStore } from "../zustand/useStore";
import { useEffect } from "react";

export default function MainComponent()
{

  const navigate = useNavigate();
  const { token } = UseTokenStore();

   useEffect(() => {
      async function check() {
        const result = await isValidToken(token);
        if (result.valid)
        {
          navigate("/home");
        }
      }

      check();
    }, [token, navigate]);
	return (
		<>
			<div className="flex flex-col  xl:flex-row overflow-y-scroll h-screen w-full bg-[url('/src/userAuth/LoginAndSignup/iconsAndImages/mainBG.png')] bg-cover">
      <GoogleOAuthProvider clientId="917057465162-k81haa2us30sg6ddker0bu9gk4qigb9r.apps.googleusercontent.com">
				<WelcomeText />
				<LoginSide />
      </GoogleOAuthProvider>
			</div>
		</>
	)
}




{/* <AnimatePresence mode="wait">
          {isSignup ? (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <SignupArea />
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <LoginArea />
            </motion.div>
          )}
        </AnimatePresence> */}