import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TicTacAPI, type User, type UserStats } from "./services/api";
import { useOnlineGame } from "./hooks/useOnlineGame";
import TicTacGame from "./TicTacGame";
import { ArrowLeft, Sparkles, Trophy, User as UserIcon } from "lucide-react";
import { UseUserStore } from "../userAuth/zustand/useStore";

const OnlineTicTac = () => {
  const { user: authUser } = UseUserStore();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showLogin, setShowLogin] = useState(!authUser || !authUser.name);

  const {
    currentGame,
    isSearching,
    opponent,
    isConnected,
    findMatch,
    cancelSearch,
    makeMove,
    forfeit,
    resetGame
  } = useOnlineGame(user);

  useEffect(() => {
    if (authUser && authUser.name && !user) {
      handleLogin();
    }
  }, [authUser]);

  const handleLogin = async () => {
    const usernameToUse = authUser?.name || username;
    if (usernameToUse.trim().length < 3) {
      alert("Username must be at least 3 characters");
      return;
    }

    try {
      console.log('Attempting to login with username:', usernameToUse);
      console.log('Window hostname:', window.location.hostname);
      console.log('Expected API URL:', `http://${window.location.hostname}:3003/api`);
      console.log('Expected WS URL:', `ws://${window.location.hostname}:3003/ws`);
      
      const newUser = await TicTacAPI.createOrGetUser(usernameToUse);
      console.log('User created/retrieved:', newUser);
      
      setUser(newUser);
      setShowLogin(false);
      
      // Load stats
      const userStats = await TicTacAPI.getUserStats(newUser.id);
      console.log('User stats loaded:', userStats);
      setStats(userStats);
    } catch (err) {
      console.error("Failed to login:", err);
      alert(`Failed to login: ${err instanceof Error ? err.message : 'Unknown error'}. Check console for details.`);
    }
  };

  if (showLogin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1a24] to-[#1a1f2e] text-white p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full mix-blend-screen animate-[float_20s_ease-in-out_infinite]"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                background: `radial-gradient(circle, ${['rgba(34,211,238,0.1)', 'rgba(168,85,247,0.1)', 'rgba(244,114,182,0.1)'][i % 3]} 0%, transparent 70%)`,
                left: `${20 * i}%`,
                top: `${15 * i}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${15 + i * 3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-gradient-to-br from-[#1e293b]/90 via-[#334155]/90 to-[#1e293b]/90 backdrop-blur-xl 
                        p-8 rounded-3xl border-2 border-cyan-400/30 shadow-2xl shadow-cyan-400/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Online TicTacToe
                </h1>
                <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm">Enter your username to start</p>
            </div>

            {/* Username Input */}
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-cyan-300">
                  <UserIcon className="w-4 h-4" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your username..."
                  className="w-full px-4 py-3 bg-[#0f172a] border-2 border-cyan-400/30 rounded-xl 
                           text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none
                           transition-all duration-200 focus:shadow-lg focus:shadow-cyan-400/20"
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-2">Minimum 3 characters</p>
              </div>

              {/* Stats Preview */}
              {stats && (
                <div className="flex gap-3 text-center bg-[#0f172a] rounded-xl p-3 border border-gray-700">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Rating</p>
                    <p className="text-lg font-bold text-yellow-400">{stats.rating}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Wins</p>
                    <p className="text-lg font-bold text-green-400">{stats.wins}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Losses</p>
                    <p className="text-lg font-bold text-red-400">{stats.losses}</p>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleLogin}
                disabled={username.trim().length < 3}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 
                         hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600
                         disabled:from-gray-600 disabled:to-gray-700
                         text-white font-bold rounded-xl shadow-lg hover:shadow-2xl
                         transition-all duration-300 transform hover:scale-105 active:scale-95
                         disabled:cursor-not-allowed disabled:transform-none
                         flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Playing
              </button>

              <Link to="/SecondGame" className="block">
                <button className="w-full px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-medium rounded-xl
                                 transition-all duration-200 flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Menu
                </button>
              </Link>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(10px, -15px) rotate(5deg); }
            50% { transform: translate(-15px, 10px) rotate(-5deg); }
            75% { transform: translate(15px, 5px) rotate(3deg); }
          }
        `}</style>
      </div>
    );
  }

  return <TicTacGame 
    mode="online" 
    onlineProps={{
      currentGame,
      opponent,
      user,
      makeMove,
      forfeit,
      findMatch,
      resetGame,
      isSearching,
      cancelSearch,
      isConnected
    }}
  />;
};

export default OnlineTicTac;
