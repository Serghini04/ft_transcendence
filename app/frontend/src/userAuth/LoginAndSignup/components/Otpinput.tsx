import { useRef, useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UseOtpStore, UseShowOtpInputStore, UseTokenStore, UseUserStore } from "../../zustand/useStore";
import { toast } from "react-toastify";

export default function OtpInput() {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const navigate = useNavigate();
  const {user, setUser} = UseUserStore();
  const {otpOriginal, flag} = UseOtpStore();
  const {setOtpFlag} = UseShowOtpInputStore();
  const {setToken} = UseTokenStore();


  const submitOtp = async (otpString: string) => {
    try {
        if (otpString === otpOriginal && flag === "signup") {
            const res = await fetch("http://localhost:8080/api/v1/auth/verifyEmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailOrName: user.email, key: "signup"}),
                credentials: "include"
            });
            const data = await res.json();
            setToken(data.accessToken);
            setUser(data.user);
            // console.error("OTP verification successful:", data);
            navigate("/home");
        }
        else if (otpString === otpOriginal && flag === "login") {
            const res = await fetch("http://localhost:8080/api/v1/auth/verifyEmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailOrName: user.name, key: "login"}),
                credentials: "include"
            });
            const data = await res.json();
            setToken(data.accessToken);
            setUser(data.user);
            console.error("OTP verification successful:", data);
            navigate("/home");
        }
        else {
            setToken("");
            setOtpFlag(false);
        }
    } catch (err: any) {
      console.error(err);
      toast.error("OTP verification failed. Please try again.");
    }
  };
  
  const handleChange = (index: number, value: string) => {
      if (!/^[0-9]?$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

    // Move to next input if a digit is typed
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      const otpString = newOtp.join("");
      submitOtp(otpString);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement | null>) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-[3%] justify-center h-[5vw]">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          maxLength={1}
          ref={(el) => {inputsRef.current[index] = el}}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-[11.5%] h-[82%] border border-gray-300 text-gray-300 rounded-[23%] text-center text-[50%] sm:text-[70%] md:text-[90%]  xl:text-[150%] font-semibold outline-none focus:border-blue-500"
        />
      ))}
    </div>
  );
}
