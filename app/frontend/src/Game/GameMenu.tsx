import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/solid"; 
const gameModes = [
  {
    title: "Tournament",
    desc: "Compete against the best players and rise through the leaderboard.",
    img: "/src/assets/images/tournament.png",
    button: "Enter Tournament",
  },
  {
    title: "Play Online",
    desc: "Challenge real opponents across the web in real-time matches.",
    img: "/src/assets/images/online.png",
    button: "Play Online",
  },
  {
    title: "Play with AI",
    desc: "Test your skills against an intelligent AI opponent.",
    img: "/src/assets/images/ai.png",
    button: "Play with AI",
  },
  {
    title: "Play Local",
    desc: "Enjoy the game with a friend on the same device.",
    img: "/src/assets/images/local.png",
    button: "Play with a Friend",
  },
];

export default function GameMenu() {
  return (
    <div className="relative w-full min-h-[calc(100vh-5rem)] flex justify-center items-center px-6 md:px-10 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        {gameModes.map((mode, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, rotate: 0.5 }}
            whileTap={{ scale: 0.98 }}
            className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] transition-all duration-300 flex flex-col justify-between h-72 sm:h-80 md:h-96"
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
              <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">{mode.title}</h2>
            </div>

             {/* Bottom Content */}
            <div className="absolute bottom-4 w-full px-6 text-center flex flex-col items-center z-10">
              <p className="text-sm sm:text-base text-white opacity-90 mb-3 line-clamp-3">{mode.desc}</p>
              
              {/* MODIFIED BUTTON START */}
            <button
              className="
                px-5 py-2.5
                bg-[rgba(190,189,189,0.26)]
                text-white
                font-semibold
                rounded-xl
                shadow-lg
                border border-[rgba(57,64,73,0.5)] border-[1px]
                transform transition-all duration-300
                hover:scale-[1.02] 
                hover:brightness-110
                focus:outline-none
                flex items-center space-x-2
              "
            >
              <span>{mode.button}</span>
              <ArrowRightIcon
                className="h-5 w-5 p-1 rounded-full shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #12C0AD 0%, #0B5049 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              />
            </button>
            {/* MODIFIED BUTTON END */}

              
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
