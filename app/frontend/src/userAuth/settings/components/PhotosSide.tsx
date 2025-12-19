import { useEffect, useRef, useState } from "react";
import { UseimageDataUrlStore } from "../../zustand/useStore";

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
  useEffect(() => {
    if (props.user.bgPhotoURL) {
      setBgImageDataUrl(props.user.bgPhotoURL);
    }
  }, [props.user.bgPhotoURL]);
    const handleChoosePhoto = () => {
        filrInputRef.current?.click();
    }
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          setBgImageDataUrl(reader.result as string);
        };

        reader.readAsDataURL(file);
    };
    return (
      <div
        style={{
          backgroundImage: BgImageDataUrl ? `url(${BgImageDataUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="h-40 sm:h-60 lg:h-80 xl:h-[20vw]  rounded-tl-4xl cursor-pointer"
        onClick={handleChoosePhoto}
    >
          <input
        type="file"
        accept="image/*"
        ref={filrInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
    );
}