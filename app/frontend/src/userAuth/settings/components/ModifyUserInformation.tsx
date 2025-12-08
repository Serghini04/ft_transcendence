
import { User } from "lucide-react";
import { useState } from "react";
import Input from "./Input";

export default function ModifyUserInformation() {
    const [name, setName] = useState("");
    return (
        <div className="flex  w-full  p-6">
            <div className="flex flex-col  w-[33%] gap-2 mb-4">
                <div className="flex gap-2 w-6">
                    <User color="#ffffff"/>
                    <h2 className="font-[outfit] text-[2vw]">Account</h2>
                </div>
                <div className="flex flex-col gap-10 mt-10">
                    <Input label="Username" text="Username" type="text"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                    <Input label="Email" text="Email" type="Email"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                </div>
            </div>
            <div className="h-100 w-0.5 bg-[#27445E]"></div>
        </div>
    );
}