
function Line(props :any){

	return (
			<div className={`bg-[#FFFFFF] h-0.5 ${props.width}`}></div>
	)
}
export default function OrLine(){
	return (
		<>
			<div className="flex justify-center items-center gap-[1.1vw] h-7 text-white">
				<Line width="w-[8vw]"/>
				<text className="text-[0.8vw]">Or</text>
				<Line width="w-[8vw]"/>
			</div>
		</>
	)
}