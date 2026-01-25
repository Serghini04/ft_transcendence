import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react"; 
import { Link } from "react-router-dom";
import tournamentImg from "../assets/images/tournament.png";
import onlineImg from "../assets/images/online.png";
import aiImg from "../assets/images/ai.png";
import localImg from "../assets/images/local.png";


const gameModes = [
  {
    title: "Tournament",
    desc: "Compete against the best players and rise through the leaderboard.",
    img: tournamentImg,
    button: "Enter Tournament",
    route: "tournament",
  },
  {
    title: "Play Online",
    desc: "Challenge real opponents across the web in real-time matches.",
    img: onlineImg,
    button: "Play Online",
    route: "online",
  },
  {
    title: "Play with AI",
    desc: "Test your skills against an intelligent AI opponent.",
    img: aiImg,
    button: "Play with AI",
    route: "ai",
  },
  {
    title: "Play Local",
    desc: "Enjoy the game with a friend on the same device.",
    img: localImg,
    button: "Play with a Friend",
    route: "local",
  },
];

export default function GameMenu() {
  return (
    <div className="game-menu-scroll relative w-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto flex justify-center items-start px-6 md:px-10 pt-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md sm:max-w-2xl md:max-w-5xl mx-auto my-auto">
        {gameModes.map((mode, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          >
            <motion.div
              {...({ whileHover: { scale: 1.05 } } as any)}
              {...({ whileTap: { scale: 0.98 } } as any)}
              {...({ transition: { type: "spring", stiffness: 300, damping: 20 } } as any)}
              className="relative group bg-gradient-to-br from-[#0f172a] to-[#1e293b] transition-all duration-300 flex flex-col justify-between h-72 sm:h-80 md:h-96"
            >
              {/* Background Image */}
              <img
                src={mode.img}
                alt={mode.title}
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition duration-500"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-500"></div>

              {/* Title */}
              <div className="absolute top-4 w-full text-center z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                  {mode.title}
                </h2>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-4 w-full px-6 text-center flex flex-col items-center z-10">
                <p className="text-sm sm:text-base text-white opacity-90 mb-3 line-clamp-3">
                  {mode.desc}
                </p>

                {/* BUTTON */}
                <div className="inline-flex">
                  <button
                    className="
                      flex items-center justify-center
                      px-4 sm:px-5 md:px-6
                      py-1 sm:py-1.5 md:py-2
                      text-white/80 font-medium text-[0.8rem] sm:text-[0.9rem] md:text-base
                      rounded-full
                      bg-[rgba(190,189,189,0.26)]
                      border border-[rgba(57,64,73,0.5)]
                      backdrop-blur-sm
                      transition-all duration-300
                      shadow-md
                    "
                  >
                    <span className="pr-2 sm:pr-3">{mode.button}</span>

                    {/* Arrow Link */}
                    <Link to={mode.route === "tournament" ? `/game/tournament` : `/game/setup?${mode.route}`}>
                      <div
                        className="
                          flex items-center justify-center
                          w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10
                          rounded-full
                          bg-gradient-to-br from-[#12C0AD] to-[#0B5049]
                          shadow-[0_0_10px_rgba(18,192,173,0.3)]
                          mr-[-8px] sm:mr-[-10px]
                          transition-transform transition-shadow duration-300
                          hover:scale-[1.15]
                          hover:shadow-[0_0_15px_rgba(18,192,173,0.5)]
                          active:scale-95
                          cursor-pointer
                        "
                      >
                        <ArrowRightIcon
                          className="h-4 w-4 sm:h-5 sm:w-5 text-white rotate-[310deg]"
                        />
                      </div>
                    </Link>
                  </button>
                </div>
                {/* END BUTTON */}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}