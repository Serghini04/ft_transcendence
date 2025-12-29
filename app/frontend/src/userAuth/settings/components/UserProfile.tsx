import { useEffect, useRef} from "react";
import { UseimageDataUrlStore, UsephotosFileStore } from "../../zustand/useStore";

export default function UserProfile(props: {profilePhoto: string}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { profileImageDataUrl, setProfileImageDataUrl } = UseimageDataUrlStore();
  const { setProfileFile } = UsephotosFileStore();

  useEffect(() => {
      if (props.profilePhoto) {
        setProfileImageDataUrl(`https://localhost/${props.profilePhoto}`);
      }
    }, [props.profilePhoto]);
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 🚨 THIS IS THE KEY
    fileInputRef.current?.click();
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute ml-[18vw] top-25 sm:top-45 md:top-43 lg:top-62 left-4 md:left-[-9.5vw] lg:left-[-13vw] xl:top-[14.5vw] xl:left-[-8vw]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfileChange}
      />

      <div
      style={{
        backgroundImage: profileImageDataUrl ? `url(${profileImageDataUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
        onClick={handleProfileClick}
        className="w-24 h-24 md:w-28 md:h-28 xl:w-31 xl:h-31 rounded-full border-4 border-white overflow-hidden cursor-pointer group"
      >
        <img
          src={profileImageDataUrl || "public/breakingbad1.jpg"}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full">
          Change
        </div>
      </div>
    </div>
  );
}
