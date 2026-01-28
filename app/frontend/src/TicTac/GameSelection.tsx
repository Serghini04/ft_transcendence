import { Link, useOutletContext } from "react-router-dom";
import { Users, User} from "lucide-react";
import isValidToken from "../globalUtils/isValidToken";
import { UseTokenStore } from "../userAuth/zustand/useStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface OutletContextType {
  isSidebarOpen?: boolean;
}

const GameSelection = () => {
  const { isSidebarOpen } = useOutletContext<OutletContextType>();
  
  const navigate = useNavigate();
  const { token, setToken } = UseTokenStore();
  useEffect(() => {
    async function check() {
      const result = await isValidToken(token);
      if (!result.valid)
      {
        navigate("/auth");
      }
      
      if (result.newToken) {
        setToken(result.newToken);
      }
    }
  
    check();
  }, [token, navigate]);

  return (
   <div
    className={`
          h-[calc(100vh-80px)]
          relative
          bg-[rgba(15,26,36,0.5)]
          md:rounded-tl-4xl
          shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_#27445E]
         flex
         items-center
         justify-center
          transition-all
          pt-50
          md:mt-20
          xl:ml-10
           
          overflow-y-auto hide-scrollbar

          ${isSidebarOpen ? "ml-20" : "ml-0"}
        `}   
  >
   
    <div className="flex flex-col items-center justify-center text-white pl-0 md:pl-20 p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-visible pb-24">
      
      <div className="max-w-5xl w-full relative z-10 px-2 sm:px-4">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 lg:mb-10">
         
         
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-teal-400/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-cyan-500/30 to-teal-500/30 p-2 sm:p-3 md:p-4 rounded-2xl border border-cyan-400/50 
                          hover:scale-110 hover:rotate-12 transition-all duration-300 cursor-pointer
                          shadow-lg shadow-cyan-500/20">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-cyan-300">✕</span>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-center 
                      bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent
                      animate-bounce hover:scale-105 transition-transform duration-300 cursor-default
                      drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              style={{ animationIterationCount: '1' }}>
            TicTacToe
          </h1>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-2xl rounded-full animate-pulse" 
                 style={{ animationDelay: '1s' }}></div>
            <div className="relative bg-gradient-to-br from-emerald-500/30 to-teal-500/30 p-2 sm:p-3 md:p-4 rounded-2xl border border-emerald-400/50 
                          hover:scale-110 hover:-rotate-12 transition-all duration-300 cursor-pointer
                          shadow-lg shadow-emerald-500/20">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-300">○</span>
            </div>
          </div>
          
        </div>
        
        <p className="text-center text-gray-400 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
          Choose your battle mode  !
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 w-full max-w-4xl relative lg:ml-12 z-10 px-2 sm:px-3 md:px-4">
        
        
          {/* Local Game Card */}
          <Link to="/tictac" className="group animate-fade-in">
            <div className="bg-[rgba(79,103,127,0.2)] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-[#27445E] 
                          hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/20
                          backdrop-blur-sm cursor-pointer h-full relative overflow-hidden">


              <div className="relative flex flex-col items-center text-center space-y-3 sm:space-y-4">

                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-500/20 rounded-full flex items-center justify-center 
                              group-hover:bg-blue-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <User size={28} className="text-blue-400 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>
                
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Local Game
                </h2>
                
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                  Play against a friend on the same device. Take turns and compete for the highest score!
                </p>
                
                <div className="pt-3 md:pt-10">
                  <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 group-hover:bg-blue-600 text-white 
                                text-xs sm:text-sm md:text-base rounded-lg font-medium shadow-md transition-all
                                group-hover:shadow-lg group-hover:shadow-blue-400/50 relative overflow-hidden">
                    <span className="relative z-10">Play Local</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center pt-2">
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500/20 rounded-full text-[10px] sm:text-xs text-blue-300 
                                 group-hover:bg-blue-500/30 transition-all duration-300 group-hover:scale-110">
                    2 Players
                  </span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500/20 rounded-full text-[10px] sm:text-xs text-blue-300
                                 group-hover:bg-blue-500/30 transition-all duration-300 group-hover:scale-110"
                        style={{ transitionDelay: '50ms' }}>
                    Same Device
                  </span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500/20 rounded-full text-[10px] sm:text-xs text-blue-300
                                 group-hover:bg-blue-500/30 transition-all duration-300 group-hover:scale-110"
                        style={{ transitionDelay: '100ms' }}>
                    No Login
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Online Game Card */}
          <Link to="/tictac/online" className="group animate-fade-in">
            <div className="bg-[rgba(79,103,127,0.2)] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-[#27445E] 
                          hover:border-green-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-400/20
                          backdrop-blur-sm cursor-pointer h-full relative overflow-hidden">
             
              
              <div className="relative flex flex-col items-center text-center space-y-3 sm:space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center 
                              group-hover:bg-green-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <Users size={28} className="text-green-400 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>
                
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                  Online Game
                </h2>
                
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                  Challenge players worldwide! Matchmaking finds opponents with similar skill levels. Track your rating!
                </p>
                
                <div className="pt-3 sm:pt-4">
                  <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-500 group-hover:bg-green-600 text-white 
                                text-xs sm:text-sm md:text-base rounded-lg font-medium shadow-md transition-all
                                group-hover:shadow-lg group-hover:shadow-green-400/50 relative overflow-hidden">
                    <span className="relative z-10">Play Online</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center pt-2">
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 rounded-full text-[10px] sm:text-xs text-green-300
                                 group-hover:bg-green-500/30 transition-all duration-300 group-hover:scale-110">
                    Matchmaking
                  </span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 rounded-full text-[10px] sm:text-xs text-green-300
                                 group-hover:bg-green-500/30 transition-all duration-300 group-hover:scale-110"
                        style={{ transitionDelay: '50ms' }}>
                    ELO Rating
                  </span>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/20 rounded-full text-[10px] sm:text-xs text-green-300
                                 group-hover:bg-green-500/30 transition-all duration-300 group-hover:scale-110"
                        style={{ transitionDelay: '100ms' }}>
                    Real-time
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Tips */}
        
        {/* <div className="mt-6 sm:mt-8 md:mt-12 bg-[rgba(79,103,127,0.15)] p-3 sm:p-4 md:p-6 rounded-xl border border-[#27445E] backdrop-blur-sm
                hover:bg-[rgba(79,103,127,0.2)] hover:border-[#4f677f] transition-all duration-300
                animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 text-gray-300">💡 Quick Tips</h3>
          <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[10px] sm:text-xs md:text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span><strong className="text-gray-300">Local mode:</strong> Perfect for quick games with friends nearby</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">•</span>
              <span><strong className="text-gray-300">Online mode:</strong> Compete with players worldwide and climb the leaderboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span><strong className="text-gray-300">Rating system:</strong> Win games to increase your ELO rating</span>
            </li>
          </ul>
        </div> */}
      </div>
    </div>
  </div>
  );
};

export default GameSelection;

