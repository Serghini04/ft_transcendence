import { motion } from "framer-motion";

export default function Bio() {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between  mx-auto  gap-4 p-4 pl-[6rem] md:pl-4">
    
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide"
      >
        <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-primary bg-clip-text text-transparent animate-pulse">
        No matter how much the bed gets worn, another Messi will never be born
        </span>
      </motion.h1>

      <div className="flex flex-wrap gap-3 mt-4 lg:text-lg md:text-base sm:text-sm text-xs">
  {/* Add Friend */}
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="
    w-full
      inline-flex items-center justify-center gap-2
      whitespace-nowrap min-w-max
      px-5 py-2.5 rounded-xl
      bg-gradient-to-r from-emerald-400 to-teal-500
      text-black font-semibold
      shadow-lg shadow-emerald-500/30
      transition
    "
  >
    ➕ <span>Add Friend</span>
  </motion.button>

  {/* Send Message */}
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="
    w-full
      inline-flex items-center justify-center gap-2
      whitespace-nowrap min-w-max
      px-5 py-2.5 rounded-xl
      bg-white/10 backdrop-blur-md
      text-white font-semibold
      border border-white/20
      hover:bg-white/20
      transition
    "
  >
    💬 <span>Send Message</span>
  </motion.button>
</div>

    </div>
  );
}