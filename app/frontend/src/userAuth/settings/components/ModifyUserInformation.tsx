
import { Lock, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import Input from "./Input";
import { BioInput } from "./BioInput";
import { UseBioStore, UseTokenStore, UseUserStore } from "../../zustand/useStore";

interface params {
    user :{
        name: string;
        email: string;
        photoURL: string;
        bgPhotoURL: string;
    }
}

export default function ModifyUserInformation(props: params) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [c_NewPassword, setC_NewPassword] = useState("");
    const {bio, setBio} = UseBioStore();
    const { token } = UseTokenStore();
    const { user } = UseUserStore();
    const [activeNotif, setActiveNotif] = useState(false);
    const [activePvisibility, setActivePvisibility] = useState(false);
    const flag = (password || newPassword || c_NewPassword) ? "PW" : "NO PW";

    const changeData = async () => {
        const res = await fetch("http://localhost:8080/api/v1/auth/setting/updateUserData", {
            method: "POST",
            headers: { "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
            id: user.id,
            name: name,
            password: password,
            newPassword: newPassword,
            c_NewPassword: c_NewPassword,
            bio: bio,
            flag: flag
        })
    });
        const data = await res.json();
        console.log("updateUserData Reponse: ", data);
    }
    return (
        <div className="flex flex-col md:flex-row w-full py-6">
            <div className="flex flex-col w:full md:w-[30vw] ml-[27vw] md:ml-[1.4vw] gap-[0.36vw] mb-10 md:mb-0 ">
                <div className="flex gap-[0.3vw]">
                    <User color="#ffffff" className="mt-[0.45vw] w-5 h-5 md:w-[2vw] md:h-[2vw]"/>
                    <h2 className="font-[outfit] text-xl md:text-[2vw]">Account</h2>
                </div>
                <div className="flex flex-col w-full gap-[1.65vw] mt-6 md:mt-[1.7vw]">
                    <Input label="Username" text={props.user.name} type="text"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                    <Input label="Email" text={props.user.email} type="Email"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                    <BioInput label="Profile bio" value={bio} onChange={(e) => setBio(e.target.value)}/>
                </div>
            </div>
            <div className="h-0 w-0 md:h-[27vw] md:w-0.5 bg-[#27445E]"></div>
            <div className="flex flex-col w:full md:w-[30vw] ml-[27vw] md:ml-[1.4vw] gap-[0.36vw]  mb-10 md:mb-0">
                <div className="flex gap-[0.3vw] ml-[1.4vw]">
                    <Lock color="#ffffff" className="mt-[0.45vw] w-5 h-5 md:w-[2vw] md:h-[2vw]"/>
                    <h2 className="font-[outfit] text-xl md:text-[2vw]">Security</h2>
                </div>
                <div className="flex flex-col w-full gap-[1.65vw] mt-6 md:mt-[1.7vw]">
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
            <div className="h-0 w-0 md:h-[27vw] md:w-0.5 bg-[#27445E]"></div>
            <div className="flex flex-col h-50 md:h-[20vw] w-full md:w-[30vw] ml-[27vw] md:ml-[1.4vw] gap-[0.36vw] xl:self-end">
                <div className="flex gap-[0.3vw] ml-[1.4vw]">
                    <ShieldCheck color="#ffffff" className="mt-[0.45vw] w-5 h-5 md:w-[2vw] md:h-[2vw]"/>
                    <h2 className="font-[outfit] text-xl md:text-[2vw]">Privacy</h2>
                </div>
                <div className="flex items-center  md:justify-center ml-7 md:ml-0 gap-[11vw] mt-[4vw]">
                    <p className="text-[1.3vw]">Show notifications</p>
                    <div onClick={() => setActiveNotif(!activeNotif)} className={`flex items-center  h-[0.95vw] w-[1.7vw] rounded-[3vw]  ${!activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}>
                        <div className={` h-[0.8vw] w-[0.8vw] ${!activeNotif ? "ml-[0.08vw]" : "ml-[0.82vw]"} rounded-full ${activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}></div>
                    </div>
                </div>
                <div className="flex items-center  md:justify-center ml-7 md:ml-0 gap-[13vw] mt-[1vw]">
                    <p className="text-[1.3vw]">Profile visibility</p>
                    <div onClick={() => setActivePvisibility(!activePvisibility)} className={`flex items-center  h-[0.95vw] w-[1.7vw] rounded-[3vw]  ${!activePvisibility ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}>
                        <div className={` h-[0.8vw] w-[0.8vw] ${!activePvisibility ? "ml-[0.08vw]" : "ml-[0.82vw]"} rounded-full ${activePvisibility ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}></div>
                    </div>
                </div>
                    <button onClick={changeData} className="mt-auto ml-auto mr-[39vw] md:mr-2 h-[6vw] w-[20vw] md:h-[3vw] md:w-[10vw] bg-primary rounded-[0.8vw] md:rounded-[0.4vw] text-white text-[2vw] md:text-[1vw] font-outfit font-medium hover:bg-[rgba(12,115,104,85%)]">Save Changes</button>
            </div>
        </div>
    );
}









{/* <div className="flex flex-row md:flex-col gap-4 w-full py-6">
<div className="flex flex-col w-[30vw] gap-[0.36vw]">
    <div className="flex gap-[0.3vw] ml-[1.4vw]">
        <User color="#ffffff" size={"2vw"} className="mt-[0.45vw]"/>
        <h2 className="font-[outfit] text-[2vw]">Account</h2>
    </div>
    <div className="flex flex-col w-full gap-[1.65vw] mt-10">
        <Input label="Username" text={props.user.name} type="text"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)}
        />
        <Input label="Email" text={props.user.email} type="Email"  error={false} onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)}
        />  
        <BioInput label="Profile bio" value={bio} onChange={(e) => setBio(e.target.value)}/>
    </div>
</div>
<div className="h-[27vw] w-0.5 bg-[#27445E]"></div>
<div className="flex flex-col w-[30vw] gap-[0.36vw] mb-4">
    <div className="flex gap-[0.3vw] ml-[1.4vw]">
        <Lock color="#ffffff" size={"2vw"} className="mt-[0.45vw]"/>
        <h2 className="font-[outfit] text-[2vw]">Security</h2>
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
<div className="flex flex-col w-[30vw] gap-[0.36vw] mb-4">
    <div className="flex gap-[0.3vw] ml-[1.4vw]">
        <ShieldCheck color="#ffffff" size={"2vw"} className="mt-[0.45vw]"/>
        <h2 className="font-[outfit] text-[2vw]">Privacy</h2>
    </div>
    <div className="flex items-center  justify-center gap-[11vw] mt-[4vw]">
        <p className="text-[1.3vw]">Show notifications</p>
        <div onClick={() => setActiveNotif(!activeNotif)} className={`flex items-center  h-[0.95vw] w-[1.7vw] rounded-[3vw]  ${!activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}>
            <div className={` h-[0.8vw] w-[0.8vw] ${!activeNotif ? "ml-[0.08vw]" : "ml-[0.82vw]"} rounded-full ${activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}></div>
        </div>
    </div>
    <div className="flex items-center  justify-center gap-[13vw] mt-[1vw]">
        <p className="text-[1.3vw]">Profile visibility</p>
        <div onClick={() => setActiveNotif(!activeNotif)} className={`flex items-center  h-[0.95vw] w-[1.7vw] rounded-[3vw]  ${!activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}>
            <div className={` h-[0.8vw] w-[0.8vw] ${!activeNotif ? "ml-[0.08vw]" : "ml-[0.82vw]"} rounded-full ${activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}></div>
        </div>
    </div>
        <button onClick={changeData} className="mt-auto ml-auto ml-10 h-[3vw] w-[10vw] bg-primary rounded-[0.4vw] text-white text-[1vw] font-outfit font-medium hover:bg-[rgba(12,115,104,85%)]">Save Changes</button>
</div>
</div> */}