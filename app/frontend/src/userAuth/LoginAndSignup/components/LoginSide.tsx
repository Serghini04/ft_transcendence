
import { UseOtpStore, UseShowOtpInputStore } from "../zustand/useStore";
import OtpInput from "./Otpinput";
import SwitchBetweenLoginAndSignin from "./SwitchBetweenLoginAndSignin"



export default function LoginSide()
{
	return (
		<>
			<div className="w-full h-full flex items-center justify-center pl-[5.4vw] pt-[3vw] pb-[17vw] font-[outfit] sm:pb-[0.5vw] xl:pb-[0vw]:">
				<div className="flex flex-col items-center  justify-center 
					rounded-[1vw] border-[#FFFFFF] border-[0.05vw] h-[30vw] w-[28vw]  bg-[rgba(13,34,51,50%)] font-outfit scale-210 sm:scale-200 md:scale-120 xl:scale-100  gap-[1vw] md:gap-[1.5vw] xl:gap-[2vw]">
					<SwitchBetweenLoginAndSignin />
				</div>
			</div>
		</>
	)
}
