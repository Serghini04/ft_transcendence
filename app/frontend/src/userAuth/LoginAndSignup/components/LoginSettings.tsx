import { Eye, EyeClosed, Lock, User } from "lucide-react";
import Input from "./Input";
import LSButton from "./LSButton";
import { useState } from "react";
import {UseErrorStore, UseOtpStore, UseShowOtpInputStore, UseUserStore} from "../../zustand/useStore";

export default function LoginSettings()
{
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const {errormsg, setErrorMsg} = UseErrorStore();
	const {setUser} = UseUserStore();
	const {setOtpOriginal, setFlag} = UseOtpStore();
	const {setOtpFlag} = UseShowOtpInputStore();
	const [error, setError] = useState({
		username: false,
		password: false
	});
	
	
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		const res = await fetch("http://localhost:8080/api/v1/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: username, password: password }),
			credentials: "include"
		});
		const data = await res.json();
		console.log(data);
		if (data.code === "USER_ADDED_SUCCESS")
		{
			// set token
			// set user info
			setUser({id: data.user.id, name: data.user.name, email: data.user.email});
			// set otp
			setFlag("login");
			setOtpOriginal(data.otp);
			setOtpFlag(true);
			// navigate("/home");
			// console.log("login successful:", data);
		}
		else if (data.code)
			setErrorMsg(data.error);

		
		setError({
			username: (!username || data.code === "INVALID_CREDENTIALS") ? true : false,
			password: (!password || data.code === "INVALID_CREDENTIALS") ? true : false
		});

	};
		
	return (
		<div className="flex flex-col items-center mt-[2.4vw]  w-[20vw] md:mt-[1.2vw]">
			<form className="flex flex-col  gap-[1vw] w-full" onSubmit={handleSubmit}>
				<Input text="Username" type="text" error={error.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>{
					setUsername(e.target.value)
				}}>
					<User size={"1.4vw"} color="#d2d2d2" strokeWidth={1.7} />
				</Input>
				<Input  text="Password" type="password" error={error.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>{
					setPassword(e.target.value)
				}}>
					<Lock size={"1.2vw"} color="#d2d2d2" strokeWidth={1.7} />
					<Eye size={"0.8vw"} color="#d2d2d2" strokeWidth={3} />
					<EyeClosed size={"0.8vw"} color="#d2d2d2" strokeWidth={3} />
				</Input>
				<p className="absolute top-[15.3vw] text-red-500 text-[0.7vw] mt-[0.7vw] md:mt-[0.2vw] lg:mt-[0.3vw] xl:mt-[-0.9vw] ml-[0.5vw]">{errormsg}</p>
				<div className="flex justify-center mt-[1vw]">
					<LSButton  text="Login"/>
				</div>
			</form>
		</div>
	)
}