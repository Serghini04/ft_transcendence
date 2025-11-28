import { useRef, useState } from "react";

export default function PhotosSide() {
  const filrInputRef = useRef<HTMLInputElement | null>(null)
  const [ imageDataUrl, setImageDataUrl ] = useState("");
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
        className={`bg-[${imageDataUrl}] h-[21vw] w-full rounded-tl-4xl`}
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