"use client";
import React from "react";
import { motion, Variants } from "framer-motion";

const matches = [
  { id: 1, leftScore: 4, rightScore: 3 },
  { id: 2, leftScore: 0, rightScore: 2 },
  { id: 3, leftScore: 5, rightScore: 2 },
  { id: 4, leftScore: 0, rightScore: 5 },
  { id: 5, leftScore: 2, rightScore: 1 },
];

// Parent animation (stagger children)
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

// Each match animation
const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 14,
    },
  },
};

export default function LastMatches() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4 pl-[6rem] md:pl-4 xl:p-0 xl:mx-5"
    >
      <h2 className="text-xl font-semibold text-white mb-2">
        Last 5 Matches
      </h2>

      {matches.map((match) => {
        const isWin = match.leftScore > match.rightScore;
        const isLose = match.leftScore < match.rightScore;

        return (
          <motion.div
            key={match.id}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`
              relative flex items-center justify-between px-6 py-4 rounded-2xl
              bg-black/60 shadow-md overflow-hidden
              border-2
              border-primary
            `}
          >
            {/* Animated glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ opacity: [0.2, 0.55, 0.2] }}
              transition={{ duration: 2.8, repeat: Infinity }}
              style={{
                background: isWin
                  ? "radial-gradient(circle at top, rgba(34,197,94,0.35), transparent 70%)"
                  : isLose
                  ? "radial-gradient(circle at top, rgba(239,68,68,0.35), transparent 70%)"
                  : "radial-gradient(circle at top, rgba(156,163,175,0.3), transparent 70%)",
              }}
            />

            {/* Left player */}
            <div className="relative z-10 flex items-center gap-4">
              <img
                src="/rasell.png"
                alt="player left"
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
              <span className="text-2xl font-bold text-white">
                {match.leftScore}
              </span>
            </div>

            {/* Center */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span className="text-teal-400 text-sm font-semibold tracking-wide">
                Ping Pong
              </span>
              <span className="text-white font-semibold text-lg">vs</span>
            </div>

            {/* Right player */}
            <div className="relative z-10 flex items-center gap-4">
              <span className="text-2xl font-bold text-white">
                {match.rightScore}
              </span>
              <img
                src="/leclerc.jpg"
                alt="player right"
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}




// import React from "react";
// import { motion } from "framer-motion";

// const matches = [
//   { id: 1, leftScore: 4, rightScore: 3 },
//   { id: 2, leftScore: 3, rightScore: 2 },
//   { id: 3, leftScore: 5, rightScore: 2 },
//   { id: 4, leftScore: 4, rightScore: 0 },
//   { id: 5, leftScore: 2, rightScore: 1 },
// ];

// export default function LastMatches() {
//   return (
//     <div className="w-full max-w-2xl  mx-auto flex flex-col gap-4 p-4 pl-[6rem] md:pl-4 xl:p-0 xl:mx-5">
//       <h2 className="text-xl font-semibold text-white mb-2">Last 5 Matches</h2>
//       {matches.map((match) => (
//         <div
//           key={match.id}
//           className="relative flex items-center justify-between px-6 py-4 rounded-2xl bg-black/60 border border-primary shadow-md"
//         >
//           <motion.div
//             className="absolute inset-0 rounded-xl pointer-events-none"
//             animate={{ opacity: [0.25, 0.6, 0.25]}}
//             transition={{ duration: 3, repeat: Infinity }}
//             style={{
//               background: "radial-gradient(circle at top, rgba(59,130,246,0.35), transparent 70%)",
//             }}
//           />
//           {/* Left player */}
//           <div className="flex items-center gap-4">
//             <img
//               src="public/rasell.png"
//               alt="player left"
//               className="w-12 h-12 rounded-full border-2 border-white object-cover"
//             />
//             <span className="text-2xl font-bold text-white">
//               {match.leftScore}
//             </span>
//           </div>

//           {/* Center */}
//           <div className="flex flex-col items-center gap-1">
//             <span className="text-teal-400 text-sm font-semibold tracking-wide">
//               Ping Pong
//             </span>
//             <span className="text-white font-semibold text-lg">vs</span>
//           </div>

//           {/* Right player */}
//           <div className="flex items-center gap-4">
//             <span className="text-2xl font-bold text-white">
//               {match.rightScore}
//             </span>
//             <img
//               src="public/leclerc.jpg"
//               alt="player right"
//               className="w-12 h-12 rounded-full border-2 border-white object-cover"
//             />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }


// className={`
//   relative flex items-center justify-between px-6 py-4 rounded-2xl
//   border shadow-md overflow-hidden
//   ${
//     isWin
//       ? "bg-green-500/10 border-green-400/30"
//       : isLose
//       ? "bg-red-500/10 border-red-400/30"
//       : "bg-gray-500/10 border-gray-400/30"
//   }
// `}