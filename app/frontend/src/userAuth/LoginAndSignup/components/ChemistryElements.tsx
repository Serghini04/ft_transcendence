
export default function ChemistryElements(props: Record<string, string>)
{
	return (
		<div className=" relative h-[6.1vw] w-[6.5vw]  border-[0.14vw] border-[#FFFFFF] bg-[rgba(4,64,45,80%)] flex justify-center">

				<h1 className="flex justify-center items-center font-bold text-[4.6vw]  max-sm:font-normal sm:font-medium md:font-semibold xl:font-bold">{props.element}</h1>
				<h2 style={{fontFamily: "'Smooch Sans', sans-serif",}} className="absolute top-0 right-[0.6vw]  text-[1.6vw] font-bold">{props.num}</h2>
		</div>
	)
}
//text-[7.36vw] md:text-[6.36vw] xl:text-[3.36vw] leading-[8.13vw] xl:leading-[5.13vw]