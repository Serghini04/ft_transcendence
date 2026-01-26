import { useNavigate } from "react-router-dom";
import notFoundImg from "../assets/images/setting_photo.jpg";

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F1A24]">
      <div className="text-center max-w-2xl px-6">
        {/* 404 Image */}
        <div className="mb-8">
          <div className="relative inline-block">
            <img 
              src={notFoundImg} 
              alt="404 Not Found" 
              className="w-64 h-64 rounded-full object-cover mx-auto border-4 border-[#12C0AD] shadow-lg shadow-[#12C0AD]/30"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#12C0AD]/20 to-transparent"></div>
          </div>
        </div>

        {/* Not Found Text */}
        <h1 className="text-5xl font-bold text-[#12C0AD] mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          The page you're looking for doesn't exist
        </p>
      </div>
    </div>
  );
}