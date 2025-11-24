import { useState } from "react";
import Circle from "./Assets/circle.png";
import cross from "./Assets/cross.png";

const TicTac = () => {
  const [board, setBoard] = useState(["", "", "", "", "", "", "", "", ""]);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);

  const checkWinner = (board: string[]) => {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setWinningLine(combination);
        setScores(prev => ({ ...prev, [board[a]]: prev[board[a] as 'X' | 'O'] + 1 }));
        
        setTimeout(() => setShowWinnerOverlay(true), 800);
        return board[a];
      }
    }
    
    if (board.every(cell => cell !== "")) {
      setWinner("Draw");
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      setTimeout(() => setShowWinnerOverlay(true), 800);
      return "Draw";
    }
    
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] !== "" || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
    checkWinner(newBoard);
  };

  const resetGame = () => {
    setBoard(["", "", "", "", "", "", "", "", ""]);
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setShowWinnerOverlay(false);
  };
  const renderCell = (index: number) => {
    const isWinningCell = winningLine.includes(index);
    const cellContent = board[index];
    
    return (
      <button
        type="button"
        aria-label={`cell ${index + 1}`}
        onClick={() => handleCellClick(index)}
        className={`
          group relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44
          flex items-center justify-center 
          ${isWinningCell ? 'bg-green-900/30' : 'bg-[#1a2332]'} rounded-lg md:rounded-xl
          border-2 ${isWinningCell ? 'border-green-400 animate-pulse' : 'border-[#27445E]'}
          transition-all duration-300
          ${!winner && !cellContent ? 'hover:bg-[#27445E] hover:border-[#3d5a7e] hover:scale-105 hover:shadow-lg hover:shadow-[#27445E]/50 cursor-pointer' : ''}
          ${winner || cellContent ? 'cursor-default' : ''}
          transform-gpu
        `}
      >
    
        {!cellContent && !winner && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/0 to-purple-500/0 
                          group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300" />
        )}
        
        
        {cellContent === "X" && (
          <img 
            src={cross} 
            alt="cross" 
            className="w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 animate-[spin_0.4s_ease-out]"
            style={{ animationIterationCount: '1' }}
          />
        )}
        
        
        {cellContent === "O" && (
          <img 
            src={Circle} 
            alt="circle" 
            className="w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 animate-[ping_0.4s_ease-out]"
            style={{ animationIterationCount: '1' }}
          />
        )}
      </button>
    );
  };
//bg-[#0f1a24]
  return (
    <div className="flex  flex-col  items-center justify-center bg-[#0f1a24] text-white  sm:p-6 md:p-8 relative overflow-y-auto hide-scrollbar">
      <div className="flex mt-10 pt-10 gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-4 md:mb-0 relative z-10">
        <div className="text-center transform transition-all hover:scale-110 duration-300 animate-[fadeIn_0.5s_ease-out]">
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Player X</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400 transition-all duration-300">{scores.X}</p>
        </div>
        <div className="text-center transform transition-all hover:scale-110 duration-300 animate-[fadeIn_0.5s_ease-out_0.1s] opacity-0"
             style={{ animation: 'fadeIn 0.5s ease-out 0.1s forwards' }}>
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Draws</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-400 transition-all duration-300">{scores.draws}</p>
        </div>
        <div className="text-center transform transition-all hover:scale-110 duration-300 animate-[fadeIn_0.5s_ease-out_0.2s] opacity-0"
             style={{ animation: 'fadeIn 0.5s ease-out 0.2s forwards' }}>
          <p className="text-xs sm:text-sm text-gray-400 mb-1">Player O</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-400 transition-all duration-300">{scores.O}</p>
        </div>
      </div>

      
      <div className="text-base sm:text-lg md:text-xl font-medium mb-4 md:mb-6 h-6 md:h-8 relative z-10">
        {winner ? (
          winner === "Draw" ? (
            <span className="text-gray-300 animate-[slideIn_0.5s_ease-out] inline-block">
              It's a Draw!
            </span>
          ) : (
            <span className="text-green-400 animate-[slideIn_0.5s_ease-out] inline-block">
              Player {winner} Wins !
            </span>
          )
        ) : (
          <span className="text-gray-300 transition-all duration-300">
            Player {isXNext ? "X" : "O"}'s Turn
          </span>
        )}
      </div>

      
      <div className="bg-[rgba(79,103,127,0.2)] p-6 rounded-2xl border border-[#27445E] mb-8 
                      backdrop-blur-sm relative z-10 animate-[scaleIn_0.5s_ease-out_0.3s] opacity-0"
           style={{ animation: 'scaleIn 0.5s ease-out 0.3s forwards' }}>
        
        
        {showWinnerOverlay && winner && winner !== "Draw" && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md rounded-2xl animate-[fadeIn_0.3s_ease-out]" />
            
            
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full opacity-0 animate-[floatUp_3s_ease-out_infinite]"
                  style={{
                    backgroundColor: winner === 'X' ? ['#14b8a6', '#06b6d4', '#22d3ee'][i % 3] : ['#6366f1', '#8b5cf6', '#a78bfa'][i % 3],
                    left: `${(i * 5) % 100}%`,
                    bottom: '-10px',
                    animationDelay: `${i * 0.15}s`,
                    filter: 'blur(1px)'
                  }}
                />
              ))}
            </div>
            
            
            <div className="relative animate-[victorySlide_0.7s_cubic-bezier(0.34,1.56,0.64,1)]">
              
              <div className="absolute inset-0 animate-[expandRing_1.5s_ease-out_infinite]">
                <div className={`absolute inset-0 rounded-3xl border-2 ${winner === 'X' ? 'border-emerald-400' : 'border-indigo-400'} opacity-40`} />
              </div>
              <div className="absolute inset-0 animate-[expandRing_1.5s_ease-out_0.5s_infinite]">
                <div className={`absolute inset-0 rounded-3xl border-2 ${winner === 'X' ? 'border-teal-400' : 'border-violet-400'} opacity-40`} />
              </div>
              
              
          
              <div className={`relative backdrop-blur-xl bg-gradient-to-br ${winner === 'X' ? 'from-emerald-500/20 via-teal-500/30 to-cyan-500/20' : 'from-indigo-500/20 via-violet-500/30 to-purple-500/20'} 
                            px-4 py-3 sm:px-8 sm:py-5 md:px-12 md:py-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 ${winner === 'X' ? 'border-emerald-300/40' : 'border-indigo-300/40'}
                            animate-[glassShimmer_3s_ease-in-out_infinite]`}>
               
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                  <div className={`absolute w-full h-full ${winner === 'X' ? 'bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10' : 'bg-gradient-to-br from-indigo-400/10 via-transparent to-violet-400/10'} 
                              animate-[gradientShift_4s_ease-in-out_infinite]`} />
                </div>
                
                
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl hidden sm:block">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute h-px w-full ${winner === 'X' ? 'bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent' : 'bg-gradient-to-r from-transparent via-violet-300/50 to-transparent'}
                                blur-sm animate-[lightRay_3s_ease-in-out_infinite]`}
                      style={{
                        top: `${30 + i * 20}%`,
                        animationDelay: `${i * 0.7}s`,
                        transform: 'rotate(-10deg)'
                      }}
                    />
                  ))}
                </div>
                
                
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl hidden sm:block">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 ${winner === 'X' ? 'bg-cyan-300' : 'bg-violet-300'} rounded-full animate-[sparkle_2s_ease-in-out_infinite]`}
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${10 + (i % 3) * 30}%`,
                        animationDelay: `${i * 0.3}s`
                      }}
                    />
                  ))}
                </div>
                
                <div className="relative text-center space-y-2 sm:space-y-4">
                  
                  <div className="relative inline-block">
                    <div className={`absolute inset-0 ${winner === 'X' ? 'bg-cyan-400' : 'bg-violet-400'} rounded-full blur-2xl opacity-30 scale-150 animate-[pulse_2s_ease-in-out_infinite]`} />
                    <div className="relative text-4xl sm:text-6xl md:text-8xl animate-[trophyBounce_0.6s_ease-out_0.7s] transform scale-0 filter drop-shadow-2xl"
                         style={{ animation: 'trophyBounce 0.8s ease-out 0.9s forwards' }}>
                      {winner === 'X' ? '🏆' : '👑'}
                    </div>
                  </div>
                  
                  
                  <div className={`space-y-1 sm:space-y-2 backdrop-blur-sm ${winner === 'X' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'} rounded-xl sm:rounded-2xl p-2 sm:p-4 border ${winner === 'X' ? 'border-cyan-300/30' : 'border-violet-300/30'}`}>
                    <div className={`text-[8px] sm:text-xs font-bold ${winner === 'X' ? 'text-cyan-200' : 'text-violet-200'} uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-90`}>
                      {winner === 'X' ? '⚡ Victory ⚡' : '✨ Champion ✨'}
                    </div>
                    <div className={`text-2xl sm:text-4xl md:text-6xl font-black ${winner === 'X' ? 'text-emerald-100' : 'text-indigo-100'} drop-shadow-2xl tracking-tight
                                  animate-[textGlow_2s_ease-in-out_infinite]`}>
                      Player {winner}
                    </div>
                    <div className={`text-xs sm:text-lg md:text-xl font-semibold ${winner === 'X' ? 'text-cyan-100/80' : 'text-violet-100/80'} flex items-center justify-center gap-1 sm:gap-2`}>
                      <span>✦</span>
                      <span>{winner === 'X' ? 'Wins the Match' : 'Takes the Crown'}</span>
                      <span>✦</span>
                    </div>
                  </div>
                  
                  
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div className={`h-[2px] w-16 ${winner === 'X' ? 'bg-gradient-to-r from-transparent via-cyan-300/60 to-cyan-300/60' : 'bg-gradient-to-r from-transparent via-violet-300/60 to-violet-300/60'} rounded-full`} />
                    <div className={`w-3 h-3 ${winner === 'X' ? 'bg-cyan-400' : 'bg-violet-400'} rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-lg`} />
                    <div className={`h-[2px] w-16 ${winner === 'X' ? 'bg-gradient-to-l from-transparent via-cyan-300/60 to-cyan-300/60' : 'bg-gradient-to-l from-transparent via-violet-300/60 to-violet-300/60'} rounded-full`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {showWinnerOverlay && winner === "Draw" && (
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
                            px-4 py-3 sm:px-8 sm:py-5 md:px-12 md:py-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-slate-300">
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                  <div className="absolute w-32 h-32 bg-white/10 rounded-full blur-2xl -top-10 -right-10 animate-pulse" />
                </div>
                
                <div className="relative text-center space-y-2 sm:space-y-3">
                  <div className="text-4xl sm:text-5xl md:text-7xl animate-[trophyBounce_0.6s_ease-out_0.7s] transform scale-0"
                       style={{ animation: 'trophyBounce 0.6s ease-out 0.7s forwards' }}>
                    🤝
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] sm:text-xs md:text-sm font-semibold text-white/70 uppercase tracking-wider sm:tracking-widest">
                      Match Result
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-5xl font-black text-white drop-shadow-lg">
                      Draw Game
                    </div>
                    <div className="text-xs sm:text-base md:text-xl font-medium text-white/80">
                      Well played by both!
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1 sm:pt-2">
                    <div className="h-px w-8 sm:w-12 bg-white/30" />
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/50" />
                    <div className="h-px w-8 sm:w-12 bg-white/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <div key={index} className="animate-[fadeIn_0.4s_ease-out] opacity-0"
                 style={{ animation: `fadeIn 0.4s ease-out ${0.4 + index * 0.05}s forwards` }}>
              {renderCell(index)}
            </div>
          ))}
        </div>
      </div>

      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-0 mb-10 sm:mt-0 w-full max-w-md mx-auto px-4">
        <button 
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white 
                     rounded-lg font-medium shadow-md hover:shadow-lg
                     transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
          onClick={resetGame}
        >
           New Round
        </button>
        <button 
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white 
                     rounded-lg font-medium shadow-md hover:shadow-lg
                     transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
          onClick={() => {
            resetGame();
            setScores({ X: 0, O: 0, draws: 0 });
          }}
        >
          Reset All
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes victorySlide {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
          60% {
            transform: translateY(10px) scale(1.05);
          }
          80% {
            transform: translateY(-5px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes trophyBounce {
          0% {
            transform: scale(0) rotate(-180deg);
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          70% {
            transform: scale(0.9) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-400px) translateX(var(--float-x, 20px));
          }
        }
        @keyframes expandRing {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes glassShimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes gradientShift {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: rotate(180deg) scale(1.2);
            opacity: 0.5;
          }
        }
        @keyframes lightRay {
          0%, 100% {
            opacity: 0;
            transform: translateX(-100%) rotate(-10deg);
          }
          50% {
            opacity: 0.6;
            transform: translateX(100%) rotate(-10deg);
          }
        }
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        @keyframes textGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px currentColor);
          }
          50% {
            filter: drop-shadow(0 0 20px currentColor);
          }
        }
      `}</style>
    </div>
  );
}

export default TicTac;