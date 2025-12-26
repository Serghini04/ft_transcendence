import { Lock, User, Mail, Eye, EyeClosed} from "lucide-react";
import Input from "./Input";
import LSButton from "./LSButton";
import { useState } from "react";
import {UseErrorStore, UseOtpStore, UseShowOtpInputStore, UseUserStore} from "../../zustand/useStore";

export default function SignuoSettings()
{
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [cpassword, setCpassword] = useState("");
	const {errormsg, setErrorMsg} = UseErrorStore();
	const {setUser} = UseUserStore();
	const {setOtpFlag} = UseShowOtpInputStore();
	const {setOtpOriginal} = UseOtpStore();
	const {setFlag} = UseOtpStore();
	// const [errormsg, setErrormsg] = useState("");
	const [error, setError] = useState({
		name: false,
		email: false,
		password: false,
		cpassword: false
	});
	  
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		const res = await fetch("http://localhost:8080/api/v1/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, password, cpassword, photoURL: "/public/breakingbad1.jpg", bgPhotoURL: "/public/profileBG.png" }),
			credentials: "include"
		});

		const data = await res.json();
		
		
		setErrorMsg(data.error);
		console.log(data);
		
		
		setError({
			name: (!name || data.code === "NAME_ALR_EXIST") ? true : false,
			email: (!email || data.code === "EMAIL_ALR_EXIST") ? true : false,
			password: (!password || data.code === "PASSWORD_NOT_STROMG") ? true : false,
			cpassword: (!cpassword || data.code === "CPASSWORD_NOT_MATCHING") ? true : false
		});
		if (data.code === "USER_ADDED_SUCCESS")
		{
			// set token
			// setToken(data.AccessToken);
			// set user info
			console.log("USER: ", data.user);
			setUser({id: data.user.id, name: name, email: email});
			// set otp
			setFlag("signup");
			setOtpOriginal(data.otp);
			setOtpFlag(true);
			// navigate("/home");
			// <OtpInput onChange={setOtp}/>;
			console.log("Signup successful:", data);
		}
		
	};
	return (
		<div className="flex flex-col items-center  w-[72%] mt-[-1.1vw]">
			<form className="flex flex-col gap-[0.4vw] w-full" onSubmit={handleSubmit}>
				<Input text="Username" type="text"  error={error.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          			setName(e.target.value)}
				>
					<User size={"1.4vw"} color="#d2d2d2" strokeWidth={1.7} />
				</Input>
				<Input text="Email" type="Email" error={error.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          			setEmail(e.target.value)}
				>
					<Mail size={"1.1vw"} color="#d2d2d2" strokeWidth={1.7} />
				</Input>
				<Input  text="Password" type="password" error={error.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          				setPassword(e.target.value)}
				>
					<Lock size={"1.2vw"} color="#d2d2d2" strokeWidth={1.7} />
					<Eye size={"0.8vw"} color="#d2d2d2" strokeWidth={3} />
					<EyeClosed size={"0.8vw"} color="#d2d2d2" strokeWidth={3} />
				</Input>
				<Input  text="Confirm Password" type="password" error={error.cpassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          				setCpassword(e.target.value)}
				>
					<Lock size={"1.2vw"} color="#d2d2d2" strokeWidth={1.7} />
					<Eye size={"0.8vw"} color="#d2d2d2" strokeWidth={3} />
					<EyeClosed size={"0.8vw"} color="#d2d2d2" strokeWidth={3} />
				</Input>
					{errormsg && <p className=" text-red-500 text-[0.7vw] mt-[-0.3vw] lg:mt-[-0.3rem] xl:mt-[-0.4vw] ml-[0.5vw]">{errormsg}</p>}
				<div className="flex justify-center mb-[-1vw] mt-[1.1vw]">
					<LSButton  text="Sign up"/>
				</div>
			</form>
		</div>
	)
}