
// export default function Online() {
//   return (
//     <div className="relative w-full min-h-screen">
      
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Online() {
  const navigate = useNavigate();

  // Game customization options
  const [map, setMap] = useState("Classic");
  const [powerUps, setPowerUps] = useState(false);
  const [speed, setSpeed] = useState("Normal");

  const handleStart = () => {
    navigate("/play/online/matchmaking", {
      state: { gameOptions: { map, powerUps, speed } },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-white p-6">
      <h1 className="text-3xl font-bold mb-8">🎮 Game Customization</h1>

      {/* Map Selection */}
      <div className="w-full max-w-md mb-6">
        <label className="block text-lg font-semibold mb-2">Map Type</label>
        <select
          value={map}
          onChange={(e) => setMap(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
        >
          <option value="Classic">Classic</option>
          <option value="Desert">Desert</option>
          <option value="Neon">Neon</option>
        </select>
      </div>

      {/* Power-Ups Toggle */}
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <label className="text-lg font-semibold">Enable Power-Ups</label>
        <input
          type="checkbox"
          checked={powerUps}
          onChange={() => setPowerUps(!powerUps)}
          className="w-5 h-5 accent-yellow-500"
        />
      </div>

      {/* Speed Selection */}
      <div className="w-full max-w-md mb-6">
        <label className="block text-lg font-semibold mb-2">Game Speed</label>
        <select
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
        >
          <option value="Normal">Normal</option>
          <option value="Fast">Fast</option>
          <option value="Crazy">Crazy</option>
        </select>
      </div>

      {/* Start Matchmaking */}
      <button
        onClick={handleStart}
        className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-lg shadow-md"
      >
        🔍 Find Match
      </button>
    </div>
  );
}
