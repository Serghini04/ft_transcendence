import { useGoogleLogin } from "@react-oauth/google";
import {UseErrorStore, UseTokenStore, UseUserStore} from "../zustand/useStore";
import { useNavigate } from "react-router-dom";

export default function GoogleButton(props :any) {
	const {setErrorMsg} = UseErrorStore();
	const {setToken} = UseTokenStore();
	const {setUser} = UseUserStore();
	const navigate = useNavigate();


	const login = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			try {
				const res = await fetch(`http://localhost:8080${props.route}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ accessToken: tokenResponse.access_token }),
					credentials: "include"
				});

				const data = await res.json();

				// console.log("Google auth response data:--------------------------------->", data);
				if (data.code === "USER_ADDED_SUCCESS")
				{
					// set token
					setToken(data.AccessToken);
					// set user info
					setUser({id: data.user.id, name: data.user.name, email: data.user.email});
					navigate("/home");
					console.log("Signup successful:", data);
				}
				else if (data.error)
					setErrorMsg(data.error);

			} catch (err) {
				console.error("Google auth error:", err);
				setErrorMsg("Something went wrong, please try again.");
			}
		},
		onError: () => setErrorMsg("Google Login Failed"),
		flow: "implicit",
	});
	return (
		<>
			<button onClick={() => login()} className=" flex justify-center items-center gap-[0.7vw]  font-medium w-[15vw] h-[2.5vw] rounded-full bg-[#DDDDDD] hover:bg-[rgba(221,221,221,85%)] text-[0.7vw] text-[#333333]">
				<img src="/src/userAuth/LoginAndSignup/iconsAndImages/googleIcon.svg" alt="google icon" className="h-[8vw] w-[1vw]" />
					{props.text}
			</button>
		</>
	)
}