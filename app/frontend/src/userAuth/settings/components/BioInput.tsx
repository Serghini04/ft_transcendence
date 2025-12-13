

interface BioInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const BioInput: React.FC<BioInputProps> = ({ label, placeholder, value, onChange }) => {
  return (
    <div className="flex flex-col w-full ml-[1.4vw]">
      <label className="ml-[0.8vw] mb-[0.2vw] font-[outfit] text-white text-xs md:text-[0.85vw]">{label}</label>
      <textarea
        className="text-[#D2D2D2] w-120 h-30 md:w-[27vw] md:h-[6.3vw] pl-[1.8vw] pt-[0.7vw] text-xs md:text-[0.8vw] border-[0.2vw] md:border-[0.1vw] b rounded-[0.5rem] md:rounded-[0.5vw] bg-[rgba(1,9,16,50%)] border-[#27445E] outline-none"
        placeholder={placeholder || "Tell us about yourself..."}
        value={value}
        onChange={onChange}
        rows={5}
      />
    </div>
  );
};
