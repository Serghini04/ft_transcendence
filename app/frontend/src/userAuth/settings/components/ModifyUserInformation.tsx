
import { User } from "lucide-react";
import { useState } from "react";
import Input from "./Input";
import { BioInput } from "./BioInput";
import { UseBioStore } from "../../zustand/useStore";


export default function ModifyUserInformation() {
    const [name, setName] = useState("");
    const {bio, setBio} = UseBioStore();
    return (
        <div className="flex w-full p-6 bg-amber-300">
            <div className="flex flex-col w-[30vw] gap-2 mb-4">
                <div className="flex gap-2">
                    <User color="#ffffff" size={"2vw"} className="mt-[0.45vw]"/>
                    <h2 className="font-[outfit] text-[2vw]">Account</h2>
                </div>
                <div className="flex flex-col w-full gap-10 mt-10">
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
        </div>
    );
}