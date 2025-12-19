
import { Lock, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import Input from "./Input";
import { BioInput } from "./BioInput";
import { UseBioStore, UseSettingsErrorStore, UseTokenStore, UseUserStore } from "../../zustand/useStore";
import { set } from "date-fns";

interface params {
    user :{
        name: string;
        email: string;
        photoURL: string;
        bgPhotoURL: string;
        showNotifications: string;
        profileVisibility: string;
    }
}

export default function ModifyUserInformation(props: params) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [c_NewPassword, setC_NewPassword] = useState("");
    const [showNotifications, setShowNotifications] = useState();
    const [profileVisibility, setProfileVisibility] = useState();
    const {nameErrorMsg, currentPasswordErrorMsg, newPasswordErrorMsg, confirmPasswordErrorMsg, setCurrentPasswordErrorMsg, setNewPasswordErrorMsg, setConfirmPasswordErrorMsg, setNameErrorMsg} = UseSettingsErrorStore();
    // const [c_NewPassword, setC_NewPassword] = useState("");
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
            newpassword: newPassword,
            cnewpassword: c_NewPassword,
            showNotifications: showNotifications,
            profileVisibility: profileVisibility,
            photoURL: "",
            bgPhotoURL: "",
            bio: bio,
            flag: flag
        })
    });
        const data = await res.json();
        if (data.code === "NAME_ALR_EXIST")
        {
            setNameErrorMsg("name already exist");
            setCurrentPasswordErrorMsg("");
            setNewPasswordErrorMsg("");
            setConfirmPasswordErrorMsg("");
        }
        if (data.code === "INVALID_PASSWORD")
        {
            setCurrentPasswordErrorMsg("invalid current password");
            setNameErrorMsg("");
            setNewPasswordErrorMsg("");
            setConfirmPasswordErrorMsg("");
        }
        if (data.code === "PASSWORD_NOT_STRONG")
        {
            setNewPasswordErrorMsg("Min 8 chars, 1 uppercase, 1 number, 1 symbol");
            setNameErrorMsg("");
            setCurrentPasswordErrorMsg("");
            setConfirmPasswordErrorMsg("");
        }
        if (data.code === "CPASSWORD_NOT_MATCHING")
        {
            setConfirmPasswordErrorMsg("new passwords do not match");
            setNameErrorMsg("");
            setCurrentPasswordErrorMsg("");
            setNewPasswordErrorMsg("");
        }
        if (data.code === "USER_DATA_UPDATED_SUCCESS")
        {
            setNameErrorMsg("");
            setCurrentPasswordErrorMsg("");
            setNewPasswordErrorMsg("");
            setConfirmPasswordErrorMsg("");
        }
        console.log("updateUserData Reponse: ", data);
    }
    return (
        <div className="grid grid-cols-1 place-content-center lg:place-items-center lg:grid-cols-2 lg:pl-0  gap-8 w-full pt-[5vw] lg:pt-0 lg:mt-[7vw] xl:mt-[1vw]">
            <div className="flex flex-col w-full md:pl-[15vw] lg:pl-0 lg:w-[30vw] ml-[27vw] md:ml-0 lg:ml-0  xl:ml-[1.4vw] gap-[0.36vw] mb-2  lg:scale-130 xl:scale-100">
                <div className="flex gap-[0.3vw]">
                    <User color="#ffffff" className="mt-[0.45vw] w-5 h-5 md:w-[2vw] md:h-[2vw]"/>
                    <h2 className="font-[outfit] text-xl md:text-[2vw]">Account</h2>
                </div>
                <div className="flex flex-col w-full gap-[1.65vw] mt-6 md:mt-[1.7vw]">
                    <Input label="Username" text={props.user.name} ErrorMsg={nameErrorMsg} readonlyFlag={false} type="text"  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                    {nameErrorMsg && <p className="text-red-600 mt-[-1.9vw] mb-[1.5vw] ml-[3.4vw] lg:ml-[2.4vw] text-[1.9vw] sm:text-[1.6vw] md:text-[1.4vw] lg:text-[0.9vw]">{nameErrorMsg}</p>}
                    <Input label="Email" text={props.user.email} readonlyFlag={true} type="Email"  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)}
                    />
                    <BioInput label="Profile bio" value={bio} onChange={(e) => setBio(e.target.value)}/>
                </div>
            </div>
            {/* <div className="h-0 w-0 xl:h-[27vw] xl:w-0.5 bg-[#27445E] ml-[1.2vw]"></div> */}
            <div className="flex flex-col w:full md:pl-[15vw] lg:pl-0 lg:w-[30vw] ml-[27vw] md:ml-0 gap-[0.2vw] mb-2 md:mb-0 lg:col-start-2 lg:row-start-1 lg:scale-130 lg:mt-[-3.5vw] xl:scale-100">
                <div className="flex gap-[0.3vw] ml-[1.4vw]">
                    <Lock color="#ffffff" className="mt-[0.45vw] w-5 h-5 md:w-[2vw] md:h-[2vw]"/>
                    <h2 className="font-[outfit] text-xl md:text-[2vw]">Security</h2>
                </div>
                <div className="flex flex-col w-full gap-[1.65vw] mt-6 md:mt-[1.7vw]">
                    <Input label="Current Password" text="...................." ErrorMsg={currentPasswordErrorMsg} type="password"  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)}
                    />
                    {currentPasswordErrorMsg && <p className="text-red-600 mt-[-1.9vw] mb-[1.5vw] ml-[3.4vw] lg:ml-[2.4vw] text-[1.9vw] sm:text-[1.6vw] md:text-[1.4vw] lg:text-[0.9vw]">{currentPasswordErrorMsg}</p>}
                    <Input label="New Password" text="...................." ErrorMsg={newPasswordErrorMsg} type="password"  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPassword(e.target.value)}
                    />
                    {newPasswordErrorMsg && <p className="text-red-600 mt-[-1.9vw] mb-[1.5vw] ml-[3.4vw] lg:ml-[2.4vw] text-[1.9vw] sm:text-[1.6vw] md:text-[1.4vw] lg:text-[0.9vw]">{newPasswordErrorMsg}</p>}
                    <Input label="confirm Password" text="...................." ErrorMsg={confirmPasswordErrorMsg} type="password"  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setC_NewPassword(e.target.value)}
                    />  
                    {confirmPasswordErrorMsg && <p className="text-red-600 mt-[-1.9vw] mb-[1.5vw] ml-[3.4vw] lg:ml-[2.4vw] text-[1.9vw] sm:text-[1.6vw] md:text-[1.4vw] lg:text-[0.9vw]">{confirmPasswordErrorMsg}</p>}
                </div>
            </div>
            {/* <div className="h-0 w-0 xl:h-[27vw] xl:w-0.5 bg-[#27445E] ml-[1.2vw]"></div> */}
            <div className="flex flex-col h-50 md:h-[20vw] w-full md:pl-[15vw] lg:mt-10 lg:pl-0 lg:w-[30vw] ml-[27vw]  md:ml-0  xl:ml-[1.4vw]  xl:mt-0 gap-[0.36vw] lg:scale-130 xl:scale-100">
                <div className="flex gap-[0.3vw] ml-[1.4vw]">
                    <ShieldCheck color="#ffffff" className="mt-[0.45vw] w-5 h-5 md:w-[2vw] md:h-[2vw]"/>
                    <h2 className="font-[outfit] text-xl md:text-[2vw]">Privacy</h2>
                </div>
                <div className="flex items-center   pl-[7vw] md:pl-[2vw] md:ml-8 gap-[11vw] mt-[2vw]">
                    <p className="text-[3.5vw] md:text-xl lg:text-[1.3vw]">Show notifications</p>
                    <div onClick={() => setActiveNotif(!activeNotif)} className={`flex items-center  scale-270 lg:scale-160 md:scale-190   h-[0.95vw] w-[1.7vw] md:w-[1.7vw] rounded-[3vw]  ${!activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"} mt-[0.5vw]`}>
                        <div className={` h-[0.8vw] w-[0.8vw] ${!activeNotif ? "ml-[0.08vw]" : "ml-[0.82vw]"} rounded-full ${activeNotif ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}></div>
                    </div>
                </div>
                <div className="flex items-center pl-[7vw] md:pl-[2vw] md:ml-8 gap-[13vw] mt-[1vw]">
                    <p className="text-[3.5vw] md:text-xl lg:text-[1.3vw]">Profile visibility</p>
                    <div onClick={() => setActivePvisibility(!activePvisibility)} className={`flex items-center ml-[3.2vw] md:ml-[1.4vw] lg:ml-0 scale-270  lg:scale-160 md:scale-190   h-[0.95vw] w-[1.7vw] rounded-[3vw]  ${!activePvisibility ? "bg-[#D9D9D9]" : "bg-[#145084]"} mt-[0.5vw]`}>
                        <div className={` h-[0.8vw] w-[0.8vw] ${!activePvisibility ? "ml-[0.08vw]" : "ml-[0.82vw]"} rounded-full ${activePvisibility ? "bg-[#D9D9D9]" : "bg-[#145084]"}`}></div>
                    </div>
                </div>
            </div>
                <button onClick={changeData} className="mt-auto mb-10 ml-[57vw] sm:ml-[50vw] md:ml-auto mr-auto xl:mr-12 h-[6vw] md:scale-190 lg:scale-100   w-[20vw] md:h-[3vw] md:w-[10vw] bg-primary rounded-[0.8vw] md:rounded-[0.4vw] text-white text-[2vw] md:text-[1vw] font-outfit font-medium hover:bg-[rgba(12,115,104,85%)]">Save Changes</button>
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