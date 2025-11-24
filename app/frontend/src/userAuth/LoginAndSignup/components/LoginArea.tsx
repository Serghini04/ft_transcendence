
import LoginSettings from "./LoginSettings";
import GoogleButton from "./GoogleButton";
import OrLine from "./OrLine";

export default function LoginArea()
{
	return (
		<>
			<LoginSettings />
			<OrLine />
			<GoogleButton text="Login with google" route="/api/auth/googleLogin"/>
		</>
	)

}