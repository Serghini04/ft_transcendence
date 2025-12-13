import { useEffect, useRef, useState } from "react";

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
  const [ imageDataUrl, setImageDataUrl ] = useState("");
  useEffect(() => {
    if (props.user.bgPhotoURL) {
      setImageDataUrl(props.user.bgPhotoURL);
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
            setImageDataUrl(reader.result as string);
        };

        reader.readAsDataURL(file);
    };
    return (
      <div
        style={{
          backgroundImage: imageDataUrl ? `url(${imageDataUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="h-160 md:h-60 xl:h-120  w-full rounded-tl-4xl cursor-pointer"
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