import React from "react";
import ProfileCard from "./ProfileCard";

export default function ProfileHeader() {
  return (
    <div className="w-full  h-[260px] relative overflow-hidden rounded-2xl shadow-lg">
      {/* Background image */}
      <img
        src="/banner.png"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Profile card */}
      <ProfileCard />

    </div>
  );
}
