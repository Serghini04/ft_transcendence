import { useState } from "react";
import { TicTacAPI, type User, type UserStats } from "./services/api";
import { useOnlineGame } from "./hooks/useOnlineGame";
import Circle from "./Assets/circle.png";
import cross from "./Assets/cross.png";

const OnlineTicTac = () => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showLogin, setShowLogin] = useState(true);

  const {
    currentGame,
    isSearching,
    opponent,
    error,
    isConnected,
    findMatch,
    cancelSearch,
    makeMove,
    forfeit,
    resetGame
  } = useOnlineGame(user);

  const handleLogin = async () => {
    if (username.trim().length < 3) {
      alert("Username must be at least 3 characters");
      return;
    }

    try {
      console.log('Attempting to login with username:', username);
      console.log('Window hostname:', window.location.hostname);
      console.log('Expected API URL:', `http://${window.location.hostname}:3003/api`);
      console.log('Expected WS URL:', `ws://${window.location.hostname}:3003/ws`);
      
      const newUser = await TicTacAPI.createOrGetUser(username);
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

  const handleCellClick = (index: number) => {
    if (!currentGame || !user) return;
    if (currentGame.status !== 'active') return;
    if (currentGame.board[index] !== '') return;
    
    // Check if it's user's turn
    const isPlayer1 = currentGame.player1Id === user.id;
    const playerSymbol = isPlayer1 ? 'X' : 'O';
    
    if (currentGame.currentTurn !== playerSymbol) return;

    makeMove(index);
  };

  const renderCell = (index: number) => {
    if (!currentGame) return null;

    const cellContent = currentGame.board[index];
    const isWinning = false; // TODO: Add winning line highlighting

    return (
      <button
        type="button"
        onClick={() => handleCellClick(index)}
        className={`
          group relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44
          flex items-center justify-center 
          bg-[#1a2332] rounded-lg md:rounded-xl lg:rounded-2xl
          border-2 ${isWinning ? 'border-green-400 bg-green-900/30 animate-pulse' : 'border-[#27445E]'}
          transition-all duration-300
          ${currentGame.status === 'active' && !cellContent ? 'hover:bg-[#27445E] hover:border-[#3d5a7e] hover:scale-105 cursor-pointer' : 'cursor-default'}
          transform-gpu
        `}
      >
        {!cellContent && currentGame.status === 'active' && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/0 to-purple-500/0 
                          group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300" />
        )}
        
        {cellContent === "X" && (
          <img 
            src={cross} 
            alt="cross" 
            className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 animate-[spin_0.4s_ease-out]"
            style={{ animationIterationCount: '1' }}
          />
        )}
        
        {cellContent === "O" && (
          <img 
            src={Circle} 
            alt="circle" 
            className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 animate-[ping_0.4s_ease-out]"
            style={{ animationIterationCount: '1' }}
          />
        )}
      </button>
    );
  };

  if (showLogin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1a24] text-white p-2 sm:p-4">
        <div className="bg-[rgba(79,103,127,0.2)] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-[#27445E] backdrop-blur-sm max-w-md w-full mx-2 sm:mx-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#4f677f] text-center">
            🎮 Online TicTacToe
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your username"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#1a2332] border-2 border-[#27445E] rounded-lg 
                         text-sm sm:text-base text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none
                         transition-colors"
                minLength={3}
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={username.trim().length < 3}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 
                       text-sm sm:text-base text-white rounded-lg font-medium shadow-md hover:shadow-lg
                       transition-all duration-200 hover:scale-105 active:scale-95
                       disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Start Playing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1a24] text-white p-2 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-4xl mb-4 sm:mb-6 px-3 sm:px-0">
        <div className="flex justify-between items-center flex-wrap gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#4f677f]">
              Online TicTacToe
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {user?.username} {isConnected ? '🟢' : '🔴'} Rating: {stats?.rating || 1000}
            </p>
          </div>
          
          {stats && (
            <div className="flex gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <p className="text-gray-400">Wins</p>
                <p className="text-green-400 font-bold">{stats.wins}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Losses</p>
                <p className="text-red-400 font-bold">{stats.losses}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Draws</p>
                <p className="text-gray-400 font-bold">{stats.draws}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="relative z-10 mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-3 bg-red-500/20 border border-red-500 rounded-lg text-xs sm:text-sm text-red-200 mx-3 sm:mx-0">
          {error}
        </div>
      )}

      {/* Matchmaking */}
      {!currentGame && (
        <div className="relative z-10 bg-[rgba(79,103,127,0.2)] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-[#27445E] backdrop-blur-sm mx-2 sm:mx-3 md:mx-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-center">Find a Match</h2>
          
          {isSearching ? (
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              <p className="text-gray-300">Searching for opponent...</p>
              <button
                onClick={cancelSearch}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base rounded-lg font-medium
                         transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel Search
              </button>
            </div>
          ) : (
            <button
              onClick={findMatch}
              disabled={!isConnected}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white 
                       text-sm sm:text-base rounded-lg font-medium shadow-md hover:shadow-lg
                       transition-all duration-200 hover:scale-105 active:scale-95
                       disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isConnected ? 'Find Match' : 'Connecting...'}
            </button>
          )}
        </div>
      )}

      {/* Game board */}
      {currentGame && (
        <>
          {/* Game info */}
          <div className="relative z-10 mb-3 sm:mb-4 text-center px-3 sm:px-0">
            {opponent && (
              <p className="text-sm sm:text-base text-gray-300 mb-2">
                Playing against: <span className="text-blue-400 font-bold">{opponent.username}</span>
              </p>
            )}
            
            {currentGame.status === 'active' && (
              <p className="text-base sm:text-lg font-medium">
                {currentGame.currentTurn === (currentGame.player1Id === user?.id ? 'X' : 'O') 
                  ? "Your turn" 
                  : "Opponent's turn"}
              </p>
            )}
            
            {currentGame.status === 'finished' && (
              <p className="text-xl sm:text-2xl font-bold">
                {currentGame.winner === user?.id ? (
                  <span className="text-green-400">🎉 You Won!</span>
                ) : currentGame.winner === null ? (
                  <span className="text-gray-300">Draw!</span>
                ) : (
                  <span className="text-red-400">You Lost</span>
                )}
              </p>
            )}
          </div>

          {/* Board */}
          <div className="bg-[rgba(79,103,127,0.2)] p-3 sm:p-5 md:p-7 lg:p-8 rounded-xl md:rounded-2xl border border-[#27445E] mb-3 sm:mb-6 
                        backdrop-blur-sm relative z-10 mx-2 sm:mx-0 w-full max-w-[98vw] sm:max-w-none">
            
            {/* Win/Loss/Draw Overlay Animation */}
            {currentGame.status === 'finished' && currentGame.winner === user?.id && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md rounded-2xl animate-[fadeIn_0.3s_ease-out]" />
                
                {/* Confetti particles */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full opacity-0 animate-[floatUp_3s_ease-out_infinite]"
                      style={{
                        backgroundColor: ['#10b981', '#06b6d4', '#22d3ee', '#14b8a6'][i % 4],
                        left: `${(i * 5) % 100}%`,
                        bottom: '-10px',
                        animationDelay: `${i * 0.15}s`,
                        filter: 'blur(1px)'
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative animate-[victorySlide_0.7s_cubic-bezier(0.34,1.56,0.64,1)]">
                  {/* Expanding rings */}
                  <div className="absolute inset-0 animate-[expandRing_1.5s_ease-out_infinite]">
                    <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400 opacity-40" />
                  </div>
                  <div className="absolute inset-0 animate-[expandRing_1.5s_ease-out_0.5s_infinite]">
                    <div className="absolute inset-0 rounded-3xl border-2 border-teal-400 opacity-40" />
                  </div>
                  
                  <div className="relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/30 to-cyan-500/20 
                                px-4 py-3 sm:px-6 sm:py-4 md:px-12 md:py-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-300/40
                                animate-[glassShimmer_3s_ease-in-out_infinite]">
                    {/* Light rays */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl hidden sm:block">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent
                                    blur-sm animate-[lightRay_3s_ease-in-out_infinite]"
                          style={{
                            top: `${30 + i * 20}%`,
                            animationDelay: `${i * 0.7}s`,
                            transform: 'rotate(-10deg)'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Sparkles */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl hidden sm:block">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-[sparkle_2s_ease-in-out_infinite]"
                          style={{
                            left: `${15 + i * 15}%`,
                            top: `${10 + (i % 3) * 30}%`,
                            animationDelay: `${i * 0.3}s`
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative text-center space-y-1 sm:space-y-2 md:space-y-4">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-cyan-400 rounded-full blur-2xl opacity-30 scale-150 animate-[pulse_2s_ease-in-out_infinite]" />
                        <div className="relative text-3xl sm:text-5xl md:text-8xl animate-[trophyBounce_0.6s_ease-out_0.7s] transform scale-0 filter drop-shadow-2xl"
                             style={{ animation: 'trophyBounce 0.8s ease-out 0.9s forwards' }}>
                          🏆
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 sm:space-y-1 md:space-y-2 backdrop-blur-sm bg-emerald-500/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-4 border border-cyan-300/30">
                        <div className="text-[7px] sm:text-[8px] md:text-xs font-bold text-cyan-200 uppercase tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] opacity-90">
                          ⚡ Victory ⚡
                        </div>
                        <div className="text-xl sm:text-3xl md:text-6xl font-black text-emerald-100 drop-shadow-2xl tracking-tight
                                      animate-[textGlow_2s_ease-in-out_infinite]">
                          You Win!
                        </div>
                        <div className="text-[10px] sm:text-sm md:text-xl font-semibold text-cyan-100/80 flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
                          <span>✦</span>
                          <span>Congratulations!</span>
                          <span>✦</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loss Overlay Animation */}
            {currentGame.status === 'finished' && currentGame.winner !== null && currentGame.winner !== user?.id && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md rounded-2xl animate-[fadeIn_0.3s_ease-out]" />
                
                {/* Falling particles */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-red-400 opacity-0 animate-[floatUp_4s_ease-out_infinite]"
                      style={{
                        left: `${(i * 7) % 100}%`,
                        bottom: '-10px',
                        animationDelay: `${i * 0.2}s`,
                        filter: 'blur(1px)'
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative animate-[victorySlide_0.7s_cubic-bezier(0.34,1.56,0.64,1)]">
                  <div className="relative backdrop-blur-xl bg-gradient-to-br from-red-500/20 via-rose-500/30 to-orange-500/20 
                                px-4 py-3 sm:px-6 sm:py-4 md:px-12 md:py-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-red-300/40">
                    <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                      <div className="absolute w-32 h-32 bg-red-400/10 rounded-full blur-2xl -top-10 -right-10 animate-pulse" />
                    </div>
                    
                    <div className="relative text-center space-y-1 sm:space-y-2 md:space-y-3">
                      <div className="text-3xl sm:text-5xl md:text-7xl animate-[trophyBounce_0.6s_ease-out_0.7s] transform scale-0"
                           style={{ animation: 'trophyBounce 0.6s ease-out 0.7s forwards' }}>
                        😔
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="text-[7px] sm:text-[8px] md:text-xs font-semibold text-red-200 uppercase tracking-wider sm:tracking-widest">
                          Game Over
                        </div>
                        <div className="text-xl sm:text-3xl md:text-5xl font-black text-red-100 drop-shadow-lg">
                          You Lost
                        </div>
                        <div className="text-[10px] sm:text-sm md:text-xl font-medium text-red-100/80">
                          Better luck next time!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Draw Overlay Animation */}
            {currentGame.status === 'finished' && currentGame.winner === null && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md rounded-2xl animate-[fadeIn_0.3s_ease-out]" />
                
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-gray-400 opacity-0 animate-[floatUp_3s_ease-out_infinite]"
                      style={{
                        left: `${(i * 7) % 100}%`,
                        bottom: '-10px',
                        animationDelay: `${i * 0.2}s`,
                        filter: 'blur(1px)'
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative animate-[victorySlide_0.7s_cubic-bezier(0.34,1.56,0.64,1)]">
                  <div className="relative bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 
                                px-4 py-3 sm:px-6 sm:py-4 md:px-12 md:py-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-slate-300">
                    <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                      <div className="absolute w-32 h-32 bg-white/10 rounded-full blur-2xl -top-10 -right-10 animate-pulse" />
                    </div>
                    
                    <div className="relative text-center space-y-1 sm:space-y-2 md:space-y-3">
                      <div className="text-3xl sm:text-5xl md:text-7xl animate-[trophyBounce_0.6s_ease-out_0.7s] transform scale-0"
                           style={{ animation: 'trophyBounce 0.6s ease-out 0.7s forwards' }}>
                        🤝
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="text-[7px] sm:text-[8px] md:text-xs font-semibold text-white/70 uppercase tracking-wider sm:tracking-widest">
                          Match Result
                        </div>
                        <div className="text-xl sm:text-3xl md:text-5xl font-black text-white drop-shadow-lg">
                          Draw Game
                        </div>
                        <div className="text-[10px] sm:text-sm md:text-xl font-medium text-white/80">
                          Well played!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 lg:gap-6">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <div key={index}>
                  {renderCell(index)}
                </div>
              ))}
            </div>
          </div>

          {/* Game controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full max-w-[96%] sm:max-w-md mx-auto px-2 sm:px-3 md:px-4 relative z-10">
            {currentGame.status === 'active' && (
              <button
                onClick={forfeit}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base rounded-lg font-medium
                         shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
              >
                Forfeit
              </button>
            )}
            
            {currentGame.status === 'finished' && (
              <button
                onClick={() => {
                  resetGame();
                  findMatch();
                }}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base rounded-lg font-medium
                         shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
              >
                New Match
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OnlineTicTac;
