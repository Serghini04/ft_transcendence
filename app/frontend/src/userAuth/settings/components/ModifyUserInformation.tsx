
import { Lock, User } from "lucide-react";
import { useState } from "react";
import Input from "./Input";
import { BioInput } from "./BioInput";
import { UseBioStore } from "../../zustand/useStore";


export default function ModifyUserInformation() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [c_NewPassword, setC_NewPassword] = useState("");
    const {bio, setBio} = UseBioStore();
    return (
        <div className="flex gap-4 w-full py-6">
            <div className="flex flex-col w-[30vw] gap-[0.36vw]">
                <div className="flex gap-[0.3vw] ml-[1.4vw]">
                    <User color="#ffffff" size={"2vw"} className="mt-[0.45vw]"/>
                    <h2 className="font-[outfit] text-[2vw]">Account</h2>
                </div>
                <div className="flex flex-col w-full gap-[1.65vw] mt-10">
                    <Input label="Username" text="Username" type="text"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                    <Input label="Email" text="Email" type="Email"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />  
                    <BioInput label="Profile bio" value={bio} onChange={(e) => setBio(e.target.value)}/>
                </div>
            </div>
            <div className="h-[27vw] w-0.5 bg-[#27445E]"></div>
            <div className="flex flex-col w-[30vw] gap-[0.36vw] mb-4">
                <div className="flex gap-[0.3vw] ml-[1.4vw]">
                    <Lock color="#ffffff" size={"2vw"} className="mt-[0.45vw]"/>
                    <h2 className="font-[outfit] text-[2vw]">Account</h2>
                </div>
                <div className="flex flex-col w-full gap-[1.65vw] mt-10">
                    <Input label="Current Password" text="...................." type="password"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)}
                    />
                    <Input label="New Password" text="...................." type="password"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPassword(e.target.value)}
                    />  
                    <Input label="confirm Password" text="...................." type="password"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setC_NewPassword(e.target.value)}
                    />  
                    
                </div>
            </div>
            <div className="h-[27vw] w-0.5 bg-[#27445E]"></div>
        </div>
    );
}