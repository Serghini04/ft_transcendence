import { Link } from "lucide-react";


export default function LSButton(props : any)
{

	return (
		<>
			<button  className=" flex justify-center items-center h-[2.5vw] w-[13vw]  rounded-2xl bg-primary hover:bg-[rgba(12,115,104,85%)] text-[#FFFFFF] text-[1vw] font-outfit font-medium hover:rgba(12,115,104,90%)">{props.text}</button>
		</>
	)
}