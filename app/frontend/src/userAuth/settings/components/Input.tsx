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
		<div className="relative flex flex-col ml-[1.4vw] h-full justify-center">
            <label className="ml-[0.8vw] mb-[0.2vw] font-[outfit] text-white text-xs md:text-[0.85vw]">{props.label}</label>
			<input onChange={props.onChange} type={ispasswordhide ? props.type : "text"} placeholder={props.text} className={`text-[#D2D2D2] h-10 w-120 md:w-[27vw] md:h-[3.3vw] pl-[1.8vw] text-xs md:text-[0.8vw] border-[0.2vw] md:border-[0.1vw] b rounded-[0.5rem] md:rounded-[0.5vw] bg-[rgba(1,9,16,50%)] ${props.error ? "border-red-600" : "border-[#27445E]"} outline-none `} />
			<button className="absolute right-5" onClick={() => setIspasswordhide(!ispasswordhide)} type="button">
				{ispasswordhide ? childrenArray[2] : childrenArray[1]}
			</button>
		</div>
	)
}