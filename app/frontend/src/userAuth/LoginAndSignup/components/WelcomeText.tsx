import Logo from "./Logo"

export default function WelcomeText()
{
	return (
		<div className="w-[50%] font-[outfit] whitespace-nowrap py-[15.5vw] pl-[19vw]  md:py-[8.5vw] md:pl-[24vw] xl:pt-[11.5vw] xl:pl-[8vw] scale-220 sm:scale-140 md:scale-140 xl:scale-100">
			<div className="text-[#FFFFFF]  text-[3.36vw] leading-[5.13vw]">
				<p className="font-bold">Ready to serve up your</p>
				<p className="mt-[-1.8vw] font-bold mb-[0.6vw]">next victory?</p>
			</div>
			<div className="text-[#FFFFFF]">
				<Logo />
			</div>
		</div>
	)
}