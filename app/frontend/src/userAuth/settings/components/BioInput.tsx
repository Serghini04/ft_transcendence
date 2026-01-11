

interface BioInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const BioInput: React.FC<BioInputProps> = ({ label, placeholder, value, onChange }) => {
  return (
    <div className="flex flex-col w-full ml-[1.4vw] justify-center">
      <label className="ml-[0.8vw] mb-[0.2vw] font-[outfit] text-white text-xs lg:text-[0.85vw]">{label}</label>
      <textarea
        className="text-[#D2D2D2] w-[85vw] sm:w-120 h-30 lg:w-[27vw] lg:h-[6.3vw] pl-[1.8vw] pt-[0.7vw] text-xs lg:text-[0.8vw] border-[0.3vw] sm:border-[0.2vw] lg:border-[0.1vw] rounded-[0.25rem] sm:rounded-[0.5rem] lg:rounded-[0.5vw] bg-[rgba(1,9,16,50%)] border-[#27445E] outline-none"
        placeholder={placeholder || "Tell us about yourself..."}
        value={value}
        onChange={onChange}
        rows={5}
      />
    </div>
  );
};
