
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginArea from "./LoginArea";
import SignupArea from "./SignupArea";
import {UseErrorStore, UseOtpStore, UseShowOtpInputStore} from "../zustand/useStore";
import OtpInput from "./Otpinput";

export default function SwitchBetweenLoginAndSignin()
{
	const [isSignup, setIsSignup] = useState(false);
	const {setErrorMsg} = UseErrorStore();
	const { otpFlag } = UseShowOtpInputStore();
	return (
		<>
			<div className="flex flex-col items-center justify-center w-full">
			{otpFlag && (
				<div className="flex flex-col items-center justify-center">
					<h1 className="text-white text-[1vw] mb-[1vw]">Enter your 6-digit code</h1>
					<OtpInput />
				</div>
			)}
			{!otpFlag && (
				<> 
				<div className="relative flex justify-center items-center rounded-full h-[3vw] w-[12.7vw] bg-[rgba(10,17,25,90%)]">
					<motion.div
						transition={{ type: "spring", stiffness: 180, damping: 25 }}
						className="absolute top-[0.25vw] left-[0.25vw] h-[2.5vw] w-[6vw] rounded-full bg-primary border-[#DDDDDD] border-[0.13vw]"
						animate={{
							x: isSignup ? "6.2vw" : "0vw",
					}}
					/>
					<button className={`relative z-10 flex justify-center items-center h-[2.5vw] w-[6vw] text-[0.8vw] transition-colors duration-300 ${!isSignup ? "text-[#0B151F]" : "text-white"}`} onClick={() => {setIsSignup(false); setErrorMsg("");}}>Login</button>
					<button className={`relative z-10 flex justify-center items-center h-[2.5vw] w-[6vw] text-[0.8vw] transition-colors duration-300 ${isSignup ? "text-[#0B151F]" : "text-white"}`} onClick={() => {setIsSignup(true); setErrorMsg("");}}>Sign up</button>
				</div>

				<AnimatePresence mode="wait">
					{isSignup ? (
						<motion.div
							key="signup"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ duration: 0.3 }}
							className="mt-[2vw] w-full flex flex-col items-center justify-center gap-[0.8vw] md:gap-[1.2] xl:gap-[2vw]"
							>
								<SignupArea />
						</motion.div>
					) : (
						<motion.div
							key="login"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
							className="mt-[2vw] w-full flex flex-col items-center justify-center gap-[0.8vw] md:gap-[1.2] xl:gap-[2vw]"
							>
								<LoginArea />
						</motion.div>
					)}
				</AnimatePresence>
				</>
				)}
			</div>
		</>
	)
}

{/* <div className="mt-[2vw] w-full flex flex-col items-center justify-center gap-[2vw]"></div> */}