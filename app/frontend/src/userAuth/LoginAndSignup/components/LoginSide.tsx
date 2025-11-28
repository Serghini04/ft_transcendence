
import SwitchBetweenLoginAndSignin from "./SwitchBetweenLoginAndSignin"



export default function LoginSide()
{

	return (
			<div className="w-full h-full flex items-center justify-center pl-[5.4vw] pt-[3vw] font-[outfit]">
				<div className="flex flex-col items-center  justify-center 
					rounded-[1vw] border-[#FFFFFF] border-[0.05vw] h-[30vw] w-[28vw] bg-[rgba(13,34,51,50%)] font-outfit scale-250 md:scale-150 xl:scale-100 gap-[1vw] md:gap-[1.5vw] xl:gap-[2vw]">
					<SwitchBetweenLoginAndSignin />
				</div>
			</div>
	)
}
