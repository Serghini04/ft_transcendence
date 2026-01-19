import React, { useState } from "react";

type InputProps = {
	text: string;
    label: string;
	ErrorMsg?: string;
	readonlyFlag?: boolean;
	type: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	children?: React.ReactNode;
  };

export default function Input(props: InputProps)
{
	const childrenArray = React.Children.toArray(props.children);
	const [ispasswordhide , setIspasswordhide] = useState(true);
	// useEffect(() => {
	// 	console.log("Error state changed in Input component:", props.error);
	// }, [props.error]);
	return (
		<div className="flex flex-col ml-[1.4vw] h-full justify-center">
            <label className="ml-[0.8vw] mb-[0.2vw] font-[outfit] text-white text-xs lg:text-[0.85vw]">{props.label}</label>
			<input onChange={props.onChange} type={ispasswordhide ? props.type : "text"} placeholder={props.text} {...(props.readonlyFlag ? { readOnly: true } : {})}  className={`text-[#D2D2D2] h-8 w-[85vw] sm:h-10 sm:w-120 lg:w-[27vw] lg:h-[3.3vw] pl-[1.8vw] text-xs lg:text-[0.8vw] border-[0.3vw] sm:border-[0.2vw] lg:border-[0.1vw] rounded-[0.25rem] sm:rounded-[0.5rem] lg:rounded-[0.5vw] bg-[rgba(1,9,16,50%)] ${props.ErrorMsg ? "border-red-600" : "border-[#27445E]"} outline-none `} />
			<button className="absolute right-5" onClick={() => setIspasswordhide(!ispasswordhide)} type="button">
				{ispasswordhide ? childrenArray[2] : childrenArray[1]}
			</button>
		</div>
	)
}