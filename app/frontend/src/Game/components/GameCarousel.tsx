
import { motion } from "framer-motion";

const gameModes = [
  {
    title: "Tournament",
    desc: "Compete against the best players and rise through the leaderboard.",
    img: "/src/assets/images/tournament.png",
  },
  {
    title: "Play Online",
    desc: "Challenge real opponents across the web in real-time matches.",
    img: "/src/assets/images/online.png",
  },
  {
    title: "Play with AI",
    desc: "Test your skills against an intelligent AI opponent.",
    img: "/src/assets/images/ai.png",
  },
  {
    title: "Play Local",
    desc: "Enjoy the game with a friend on the same device.",
    img: "/src/assets/images/local.png",
  },
];

export default function GameModes() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1b] px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-6xl w-full">
        {gameModes.map((mode, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b]"
          >
            <img
              src={mode.img}
              alt={mode.title}
              className="w-full h-56 object-cover opacity-70 group-hover:opacity-100 transition duration-500"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 p-6 text-white">
              <h2 className="text-2xl font-semibold mb-2">{mode.title}</h2>
              <p className="text-sm opacity-80">{mode.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
