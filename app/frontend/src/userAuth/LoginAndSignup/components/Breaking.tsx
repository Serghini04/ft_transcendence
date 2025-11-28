
import ChemistryElements from "./ChemistryElements";

export default function Breaking(props: any)
{
	return (
		<div className="flex">
			<ChemistryElements element={props.element} num={props.num} />
			<text className="text-[4.2vw] ml-[0.08vw]">{props.content}</text>
		</div>
	)
}