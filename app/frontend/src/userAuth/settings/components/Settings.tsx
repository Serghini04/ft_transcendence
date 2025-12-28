
import { useEffect, useState } from "react";
import ModifyUserInformation from "./ModifyUserInformation";
import PhotosSide from "./PhotosSide";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";
import verifyToken from "../../../globalUtils/verifyToken";
import bgPhoto from "../../../assets/images/profileBG.png"
import profilePhoto from "../../../assets/images/breakingbad1.jpg"

export default function Settings() {
  const { user } = UseUserStore();
  const { token } = UseTokenStore();
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    photoURL: profilePhoto,
    bgPhotoURL: bgPhoto,
    profileVisibility: true,
    showNotifications: true,
    bio: ""
  });
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("http://localhost:8080/api/v1/auth/setting/getUserData", {
          method: "POST",
          headers: { "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({ id: user.id })
        });
    const data = await res.json();
    console.log("USER DATA SETTINGS: ", data);
    verifyToken(data);
    setUserInfo({
      name: data.user.name,
      email: data.user.email,
      photoURL: data.user.photoURL || profilePhoto,
      bgPhotoURL: data.user.bgPhotoURL || bgPhoto,
      profileVisibility: Boolean(data.user.profileVisibility),
      showNotifications: Boolean(data.user.showNotifications),
      bio: data.user.bio
    });
    console.log("USER INFO IN SETTINGS: ", userInfo);
  } catch (err) {
    console.error("Error fetching user data:", err);
  }
}
fetchUserData();
}, [token]); 
  return (
    <div
    className="
      fixed
      flex
      flex-col
      inset-0
      bg-[rgba(15,26,36,0.5)]
      mt-30
      md:ml-30 ml-[-5rem]
      border-l-2 md:border-l-2 border-t-2
      border-[#27445E]
      rounded-tl-4xl
      shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_0_#27445E]
      overflow-y-auto
      overflow-x-hidden
      scrollbar-none
    "
  >
    <div className="flex-shrink-0">
      <PhotosSide user={userInfo} />
    </div>

    <ModifyUserInformation user={userInfo} />
  </div>

  );
  
  }
  