import React, { useEffect, useState } from "react";

type InputProps = {
	text: string;
    label: string;
	type: string;
	error: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	children?: React.ReactNode;
  };

export default function Input(props: InputProps)
{
	const childrenArray = React.Children.toArray(props.children);
	const [ispasswordhide , setIspasswordhide] = useState(true);
	useEffect(() => {
		console.log("Error state changed in Input component:", props.error);
	}, [props.error]);
	return (
		<div className="relative flex flex-col ">
            <label className="ml-4 mb-1 font-[outfit] text-white">{props.label}</label>
			<input onChange={props.onChange} type={ispasswordhide ? props.type : "text"} placeholder={props.text} className={`text-[#D2D2D2] w-[27vw] h-[3.3vw] pl-[1.8vw] text-[0.8vw] border-[0.1vw] b rounded-[0.5vw] bg-[rgba(1,9,16,50%)] ${props.error ? "border-red-600" : "border-[#27445E]"} outline-none `} />
			<div className="absolute left-[1vw]">
				{childrenArray[0]}
			</div>
			<button className="absolute right-5" onClick={() => setIspasswordhide(!ispasswordhide)} type="button">
				{ispasswordhide ? childrenArray[2] : childrenArray[1]}
			</button>
		</div>
	)
}