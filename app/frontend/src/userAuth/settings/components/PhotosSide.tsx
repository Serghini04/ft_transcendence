import { useEffect, useRef } from "react";
import { UseimageDataUrlStore, UsephotosFileStore } from "../../zustand/useStore";
import UserProfile from "./UserProfile";

const bgPhoto = "/backgroundPhoto.png";



interface params {
  user :{
      name: string;
      email: string;
      photoURL: string;
      bgPhotoURL: string;
  }
}

export default function PhotosSide(props: params) {
  const filrInputRef = useRef<HTMLInputElement | null>(null)
  const { BgImageDataUrl, setBgImageDataUrl } = UseimageDataUrlStore();
  const { setBgImageFile } = UsephotosFileStore();
  useEffect(() => {
    if (props.user.bgPhotoURL) {
      setBgImageDataUrl(props.user.bgPhotoURL );
    }
  }, [props.user.bgPhotoURL]);

    const handleChoosePhoto = () => {
        filrInputRef.current?.click();
        console.log(filrInputRef);
    }
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

      setBgImageFile(file);

        const reader = new FileReader();
        reader.onload = () => {
          setBgImageDataUrl(reader.result as string);
        };

        reader.readAsDataURL(file);

    };
    return (
      <>
      <div
        style={{
          backgroundImage: BgImageDataUrl ? `url(${BgImageDataUrl})` : `url(${bgPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="relative group h-40 sm:h-60 lg:h-80 xl:h-[20vw] rounded-tl-4xl cursor-pointer"
        onClick={handleChoosePhoto}
    >
          <input
        type="file"
        accept="image/*"
        ref={filrInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
       <div className="absolute inset-0 bg-black/50 text-white text-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          Change
        </div>
    </div>
      <UserProfile profilePhoto={props.user.photoURL}/>
    </>
    );
}