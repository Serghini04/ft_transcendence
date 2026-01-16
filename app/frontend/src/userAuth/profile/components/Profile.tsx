import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Bio from "./Bio";
import GoalStats from "./GoalStats";
import LastMatches from "./LastMatches";
import PlayerStats from "./PlayerStats";
import ProfileCard from "./ProfileCard";
import ProfileHeader from "./ProfileHeader";
import verifyToken from "../../../globalUtils/verifyToken";
import { UseTokenStore, UseUserStore } from "../../zustand/useStore";

export default function Profile()
{
    const { id } = useParams<{ id: string }>(); // Extract ID from URL
    const { user } = UseUserStore();
    const { token } = UseTokenStore();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Validate URL structure - check for extra path segments
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const isValidPath = pathSegments.length === 2 && pathSegments[0] === 'profile';
    
    // Validate ID parameter
    const isValidId = id ? /^\d+$/.test(id) : true;
    const profileUserId = id ? parseInt(id, 10) : user.id;
    
    // Redirect if invalid URL structure or invalid ID format
    useEffect(() => {
        if (!isValidPath || !isValidId || (id && isNaN(profileUserId))) {
            console.error("Invalid profile URL or ID format");
            navigate('/home', { replace: true });
        }
    }, [isValidPath, isValidId, profileUserId, id, navigate]);
    
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        photoURL: "",
        bgPhotoURL: "public/profileBG.png",
        profileVisibility: true,
        showNotifications: true,
        bio: ""
      });
      const [error, setError] = useState<string | null>(null);
      
      useEffect(() => {
        // Skip fetch if validation failed
        if (!isValidPath || !isValidId || (id && isNaN(profileUserId))) {
            return;
        }
        
        async function fetchUserData() {
          try {
            const res = await fetch("http://localhost:8080/api/v1/auth/profile/getProfileUser", {
              method: "POST",
              headers: { "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
              },
              credentials: "include",
              body: JSON.stringify({ id: profileUserId })
            });
        const data = await res.json();
        
        // Handle invalid user ID from backend
        if (!res.ok || data.code === "INVALID_USER_ID") {
          console.error("Invalid user ID:", profileUserId);
          setError("User not found");
          navigate('/home', { replace: true });
          return;
        }
        
        console.log("USER DATA SETTINGS: ", data);
        verifyToken(data);
        setUserInfo({
          name: data.user.name,
          email: data.user.email,
          photoURL: data.user.photoURL,
          bgPhotoURL: data.user.bgPhotoURL,
          profileVisibility: Boolean(data.user.profileVisibility),
          showNotifications: Boolean(data.user.showNotifications),
          bio: data.user.bio
        });
        console.log("USER INFO IN SETTINGS: ", userInfo);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile");
        navigate('/home', { replace: true });
      }
    }
    fetchUserData();
    }, [token, profileUserId, isValidPath, isValidId, id, navigate]); // Re-fetch when ID changes

    console.log("--------------------> : ", userInfo);
    
    // Show loading or error state
    if (error) {
        return null; // Will redirect, so show nothing
    }
    
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
        <div className="w-full flex flex-col gap-8 pb-8 pt-4">
                <ProfileCard user={userInfo} />
                <Bio userId={profileUserId} bio={userInfo.bio} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-4 items-center justify-center">
                <div className="">
                    <LastMatches />
                </div>
                    <div className=" flex flex-col items-center justify-center w-full">
                        <PlayerStats />
                        <GoalStats />
                    </div>
            </div>
        </div>
      </div>
      );
}

