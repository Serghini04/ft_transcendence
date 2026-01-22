import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen">
      <div
        className="
        fixed
        bg-[rgba(15,26,36,0.5)]
        mt-20
        md:ml-30 ml-[-5rem]
        border-l-2 md:border-l-2 border-t-2
        rounded-tl-4xl
        border-[#27445E]
        inset-0
        flex
        items-center
        justify-center
        p-4
      "
      >
        <div className="max-w-2xl w-full text-center">
        
        {/* 404 Text with glow effect */}
        <div className="relative mb-8">
          <h1 
            className="text-[150px] sm:text-[200px] font-bold leading-none"
            style={{
              background: 'linear-gradient(135deg, #12C0AD 0%, #0ea89a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(18, 192, 173, 0.3)',
              filter: 'drop-shadow(0 0 20px rgba(18, 192, 173, 0.4))'
            }}
          >
            404
          </h1>
          <div 
            className="absolute inset-0 blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, #12C0AD 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Message */}
        <div className="space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white">
            Page Not Found
          </h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 border border-white/20 hover:border-[#12C0AD] hover:shadow-lg hover:shadow-[#12C0AD]/20"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#12C0AD] to-[#0ea89a] hover:from-[#0ea89a] hover:to-[#12C0AD] text-white rounded-lg transition-all duration-300 shadow-lg shadow-[#12C0AD]/30 hover:shadow-[#12C0AD]/50 hover:scale-105"
          >
            <Home size={20} />
            Back to Home
          </button>
        </div>
        </div>
      </div>
   
  );
}
