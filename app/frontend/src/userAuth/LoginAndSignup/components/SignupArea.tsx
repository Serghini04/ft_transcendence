
import GoogleButton from "./GoogleButton";
import OrLine from "./OrLine";
import SignupSettings from "./SignupSettings";

export default function SignupArea()
{
	return (
		<>
			<SignupSettings/>
			<div className="flex flex-col items-center gap-[0.5vw] mt-[-0.5vw] w-[72%]">
				<OrLine />
				<GoogleButton text="Sign up with google" route="/api/auth/googleSignup"/>
			</div>
			
		</>
	)
}