import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function OnlineSetup() {
    const navigate = useNavigate();
    const location = useLocation();

    // const params = new URLSearchParams(location.search);
    const query = location.search.replace("?", "");
    const mode = query || "local";
    console.log("Selected mode:", mode);
    
    const handleStart = () => {
        navigate(`/game/${mode}`, {
            state: { map, powerUps, speed, difficulty },
        });
    };

    // Game customization options
    const [map, setMap] = useState("Classic");
    const [powerUps, setPowerUps] = useState(false);
    const [speed, setSpeed] = useState("Normal");
    const [difficulty, setDifficulty] = useState("medium");


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
            <option value="Chemistry">Chemistry</option>
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
            <option value="Slow">Slow</option>
            <option value="Normal">Normal</option>
            <option value="Fast">Fast</option>
        </select>
        </div>

        {/* AI Difficulty Selection - Only shown for AI mode */}
        {mode === "ai" && (
        <div className="w-full max-w-md mb-6">
            <label className="block text-lg font-semibold mb-2">AI Difficulty</label>
            <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
            <option value="easy">Easy - Forgiving AI</option>
            <option value="medium">Medium - Balanced Challenge</option>
            <option value="hard">Hard - Expert AI</option>
            </select>
            <p className="mt-2 text-sm text-gray-400">
            {difficulty === "easy" && "AI reacts slowly and makes mistakes"}
            {difficulty === "medium" && "AI provides a balanced challenge"}
            {difficulty === "hard" && "AI reacts quickly with accurate predictions"}
            </p>
        </div>
        )}

        {/* Start Matchmaking */}
        <button
        onClick={handleStart}
        className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-lg shadow-md"
        >
        {mode === "ai" ? "🤖 Start AI Match" : "🔍 Find Match"}
        </button>
    </div>
    );
    }
