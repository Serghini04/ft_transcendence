import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, User, Users, Star} from "lucide-react";
import Circle from "./Assets/circle.png";
import cross from "./Assets/cross.png";
import { UseUserStore } from "../userAuth/LoginAndSignup/zustand/useStore";


export interface TicTacGameProps {
  isSidebarOpen?: boolean;
  mode: "local" | "online";
  onlineProps?: {
    currentGame?: any;
    opponent?: any;
    user?: any;
    makeMove: (index: number) => void;
    forfeit: () => void;
    findMatch: () => void;
    resetGame: () => void;
    isSearching?: boolean;
    cancelSearch?: () => void;
    isConnected?: boolean;
  };
}

const TicTacGame = ({isSidebarOpen, mode, onlineProps }: TicTacGameProps) => 
{
  const [board, setBoard] = useState(["", "", "", "", "", "", "", "", ""]);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const { user: authUser } = UseUserStore();
  const [playerXName] = useState(authUser?.name || "Player 1");
  const [playerOName] = useState("Player 2");
  
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  
  const isOnline = mode === "online";
  const currentGame = onlineProps?.currentGame;
  const opponent = onlineProps?.opponent;
  const user = onlineProps?.user;

const isPlayer1 = isOnline ? currentGame?.player1Id === user?.id : true;
const playerSymbol = isPlayer1 ? 'X' : 'O';

const isPlayersTurn = isOnline ? currentGame?.currentTurn === playerSymbol : true;

  useEffect(() => {
    
  }, [isOnline, currentGame?.status]);

  const checkWinner = (board: string[]) => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6]
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setWinningLine(combination);
        setScores(prev => ({ ...prev, [board[a]]: prev[board[a] as 'X' | 'O'] + 1 }));
        return board[a];
      }
    }
    
    if (board.every(cell => cell !== "")) {
      setWinner("Draw");
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      return "Draw";
    }
    
    return null;
  };

  const handleCellClick = (index: number) => {
    if (isOnline) {

      if (!currentGame || currentGame.status !== 'active' || currentGame.board[index] !== '')
        return;
      const isPlayer1 = currentGame.player1Id === user?.id;
      const playerSymbol = isPlayer1 ? 'X' : 'O';
      if (currentGame.currentTurn !== playerSymbol) return;
      onlineProps?.makeMove(index);

    } else {

      if (board[index] !== "" || winner) return;
      const newBoard = [...board];
      newBoard[index] = isXNext ? "X" : "O";
      setBoard(newBoard);
      setIsXNext(!isXNext);
      checkWinner(newBoard);

    }
  };

  const resetGame = () => {

    setBoard(["", "", "", "", "", "", "", "", ""]);
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
  };

  const renderCell = (index: number) => {
    const cellContent = isOnline ? currentGame?.board[index] : board[index];
    const isWinningCell = winningLine.includes(index);
    const isHovered = hoveredCell === index;
    const canPlay = isOnline
      ? (currentGame?.status === 'active' && !cellContent && !!isPlayersTurn)
      : (!winner && !cellContent);

    return (
      <button
        type="button"
        onClick={() => handleCellClick(index)}
        onMouseEnter={() => canPlay && setHoveredCell(index)}
        onMouseLeave={() => setHoveredCell(null)}
        className={`
          group relative aspect-square
          flex items-center justify-center 
          ${isWinningCell ? 'bg-gradient-to-br from-yellow-400/30 via-orange-400/30 to-yellow-400/30' : 'bg-gradient-to-br from-[#1a2332] to-[#27445E]'}
          rounded-2xl lg:rounded-3xl
          border-2 ${isWinningCell ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-[#27445E]/50'}
          transition-all duration-300 transform-gpu
          ${canPlay ? 'hover:scale-105 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-400/30 cursor-pointer' : ''}
          ${isWinningCell ? 'animate-[winningCell_0.6s_ease-out]' : ''}
          overflow-hidden
        `}
      >
        {/* Animated background gradient */}
        {!cellContent && canPlay && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-green-500/0 
                          group-hover:from-cyan-500/20 group-hover:via-green-500/20 group-hover:to-green-500/20 
                          transition-all duration-500 rounded-2xl" />
            {isHovered && (
              <div className="absolute inset-0 animate-[pulse_1s_ease-in-out_infinite]">
                <div className="absolute inset-2 border-2 border-green-400/30 rounded-xl" />
              </div>
            )}
          </>
        )}
        
        {/* Cell content with enhanced animations */}
        {cellContent === "X" && (
          <div className="relative w-3/4 h-3/4 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
              <img 
                src={cross} 
                alt="cross" 
                className="relative w-full h-full object-contain 
                        animate-[zoomRotate_0.5s_cubic-bezier(0.34,1.56,0.64,1)]
                        filter drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]"
              />
          </div>
        )}
        
        {cellContent === "O" && (
          <div className="relative w-3/4 h-3/4 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
              <img 
                src={Circle} 
                alt="circle" 
                className="relative w-full h-full object-contain 
                        animate-[zoomRotate_0.5s_cubic-bezier(0.34,1.56,0.64,1)]
                        filter drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
              />
          </div>
        )}
        
        {/* Hover preview */}
        {!cellContent && canPlay && isHovered && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <img 
              src={isOnline ? 
                (currentGame?.currentTurn === 'X' ? cross : Circle) : 
                (isXNext ? cross : Circle)
              } 
              alt="preview" 
              className="w-3/4 h-3/4 object-contain animate-pulse"
            />
          </div>
        )}
        
      </button>
    );
  };


  // Matchmaking Screen (Online Mode Only)
  if (isOnline && !currentGame) {
    console.log(`is side bar open : ${isSidebarOpen}`)
    return (
    <div
      className={`
          relative
          flex justify-center
          bg-[rgba(18,19,20,0.5)]
          shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_#27445E]
          transition-all
          
          mask-t-from-20%
          h-screen
          overflow-auto hide-scrollbar
         

          px-3 sm:px-6 md:px-10
          pt-6 sm:pt-8 md:pt-10

          md:rounded-tl-4xl
          xl:ml-10
          mt-7
        ${isSidebarOpen ? "ml-20" : "ml-0"}
      `}
      >
    
      <div className="flex flex-col items-center justify-center max-h-screen text-white p-4 pb-24 ">
        {/* Animated background */}
        {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full mix-blend-screen animate-pulse"
              style={{
                width: `${300 + i * 100}px`,
                height: `${300 + i * 100}px`,
                background: `radial-gradient(circle, rgba(34,211,238,${0.05 + i * 0.02}) 0%, transparent 70%)`,
                left: `${30 * i}%`,
                top: `${20 * i}%`,
                animationDelay: `${i}s`,
                animationDuration: `${3 + i}s`
              }}
            />
          ))}
        </div> */}

        <div className="relative z-10 w-full max-w-md hide-scrollbar">
          <div className="backdrop-blur-xl p-8 rounded-3xl border-2 border-cyan-400/30  overflow-hidden " >
  
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-cyan-400 animate-bounce" />
                <h2 className="text-3xl font-black text-cyan-400">Online Match</h2>
              </div>
              <p className="text-gray-400 text-sm">
                {user?.username} {onlineProps?.isConnected ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>

            {onlineProps?.isSearching ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-cyan-400/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-transparent border-t-purple-400 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-10 h-10 text-cyan-400 animate-pulse" />
                    </div>
                  </div>
                </div>
                <p className="text-center text-cyan-300 font-medium">
                  Searching for opponent...
                </p>
                <button
                  onClick={onlineProps?.cancelSearch}
                  className="w-full px-6 py-3 bg-red-500/80 hover:bg-red-600 text-white font-medium rounded-xl
                           transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Cancel Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={onlineProps?.findMatch}
                  disabled={!onlineProps?.isConnected}
                  className="
                  w-full px-6 py-4
                  bg-white/10 backdrop-blur-md
                  border border-green-400/30
                  text-green-300 font-bold rounded-xl

                  hover:bg-gradient-to-r
                  hover:from-green-20
                  hover:to-green-600/60
                  hover:text-white

                  disabled:bg-gray-800/40
                  disabled:border-gray-600/30
                  disabled:text-gray-400

                  shadow-lg hover:shadow-2xl
                  transition-all duration-300
                  transform hover:scale-105 active:scale-95
                  disabled:cursor-not-allowed disabled:transform-none

                  flex items-center justify-center gap-3
                  relative overflow-hidden group
                "
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  
                  {/* Animated search icon */}
                  <div className="relative">
                    <svg 
                      className="w-6 h-6 animate-[spin_3s_linear_infinite]" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" className="animate-pulse" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                      <circle cx="11" cy="11" r="4" fill="currentColor" opacity="0.5" className="animate-ping" />
                    </svg>
                  </div>
                  
                  <span className="relative z-10">
                    {onlineProps?.isConnected ? 'Find Match' : 'Connecting...'}
                  </span>
                </button>

                <Link to="/SecondGame">
                  <button className="w-full px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-medium rounded-xl
                                   transition-all duration-200 flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Menu
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  }

  // Main Game Board
  const currentPlayer = isOnline ? 
    (currentGame?.currentTurn === 'X' ? 'X' : 'O') :
    (isXNext ? 'X' : 'O');
  
  const gameActive = isOnline ? currentGame?.status === 'active' : !winner;
  
  
  const displayWinner = isOnline ? 
    (currentGame?.winner === user?.id ? 'You' : currentGame?.winner === null ? 'Draw' : opponent?.username) :
    (winner === 'Draw' ? 'Draw' : (winner === 'X' ? playerXName : playerOName));


    //bg-[rgba(18,19,20,0.5)]

  return (
    // her
  <div
        className={`
          relative
          flex justify-center
          bg-[rgba(18,19,20,0.5)]
          shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_#27445E]
          transition-all
          
          mask-t-from-40%
          min-h-screen
          overflow-y-auto hide-scrollbar

          px-3 sm:px-6 md:px-10
          pt-6 sm:pt-8 md:pt-10

          md:rounded-tl-4xl
          xl:ml-10
          mt-7
        ${isSidebarOpen ? "ml-20" : "ml-0"}
      `}
      >
  

      <div className="
          pt-7
          w-full
          max-w-md
          sm:max-w-lg
          md:max-w-1/3xl
          lg:max-w-1/2xl
          xl:max-w-xl
          mx-auto
         ">
       {/* class="relative w-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto flex justify-center items-start px-6 md:px-10 py-10 pb-16" */}
          {/* w-full max-w-4xl */}
        {/* Score Board */}
        <div className="flex justify-center gap-4 sm:gap-8 mb-6">
          <div className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
            currentPlayer === 'X' && gameActive 
              ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400 scale-110 shadow-lg shadow-cyan-400/30' 
              : 'bg-gray-800/50 border border-gray-600/30'
          }`}>
            <User className={`w-6 h-6 mb-2 ${currentPlayer === 'X' && gameActive ? 'text-cyan-400 animate-bounce' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-400 mb-1">{isOnline ? (currentGame?.player1Id === user?.id ? 'You' : opponent?.username) : playerXName}</p>
            <p className="text-3xl font-black text-cyan-400">{isOnline ? '—' : scores.X}</p>
          </div>

          {!isOnline && (
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gray-800/50 border-0">
              <Star className="w-6 h-6 mb-2 text-gray-400" />
              <p className="text-sm text-gray-400 mb-1">Draws</p>
              <p className="text-3xl font-black text-gray-400">{scores.draws}</p>
            </div>
          )}

          <div className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
            currentPlayer === 'O' && gameActive 
              ? 'bg-gradient-to-br from-green-500/30 to-green-500/30 border-2 border-green-400 scale-110 shadow-lg shadow-pink-400/30' 
              : 'bg-gray-800/50 border border-gray-600/30'
          }`}>
            <User className={`w-6 h-6 mb-2 ${currentPlayer === 'O' && gameActive ? 'text-green-400 animate-bounce' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-400 mb-1">{isOnline ? (currentGame?.player2Id === user?.id ? 'You' : opponent?.username) : playerOName}</p>
            <p className="text-3xl font-black text-green-400">{isOnline ? '—' : scores.O}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative max-w-2xl mx-auto mb-6 p-4 sm:p-6
                      backdrop-blur-xl rounded-3xl border-2 border-cyan-400/30 shadow-2xl shadow-cyan-400/10">
          
          {/* Winner Overlay - Full Screen Celebration */}
          {!gameActive && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl">
              
              {/* Confetti Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-10%`,
                      width: '8px',
                      height: '8px',
                      background: ['#60a5fa', '#fbbf24', '#34d399'][Math.floor(Math.random() * 3)],
                      borderRadius: Math.random() > 0.5 ? '50%' : '0',
                      animation: `confettiFall ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 0.5}s infinite`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      opacity: 0.8
                    }}
                  />
                ))}
              </div>

              {/* Expanding Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border-2"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderColor: displayWinner === 'Draw' ? '#fbbf24' : (displayWinner === playerXName || displayWinner === 'You') ? '#60a5fa' : '#f472b6',
                      animation: `expandRing ${2}s ease-out ${i * 0.3}s infinite`,
                      opacity: 0
                    }}
                  />
                ))}
              </div>

              {/* Winner Content */}
              <div className="relative z-10 text-center px-6 py-8 animate-[zoomRotate_0.6s_ease-out]">
                {displayWinner === 'Draw' ? (
                  <>
                    <h2 className="text-5xl  mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      Draw
                    </h2>
                    {/* <p className="text-xl text-gray-300">Well played by both!</p> */}
                  </>
                ) : isOnline ? (
                  currentGame?.winner === user?.id ? (
                    <>
                      <div className="text-8xl mb-4"></div>
                      <h2 className="text-5xl  mb-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                        Victory!
                      </h2>
                      <p className="text-xl text-gray-300">You defeated {opponent?.username}!</p>
                    </>
                  ) : (
                    <>
                      <div className="text-8xl mb-4"></div>
                      <h2 className="text-5xl  mb-2 bg-red-400 bg-clip-text text-transparent">
                        Defeat
                      </h2>
                      <p className="text-xl text-red-300">{opponent?.username} won this round</p>
                    </>
                  )
                ) : (
                  <>
                    <div className="text-8xl mb-4"></div>
                    <h2 className="text-5xl  mb-2 bg-gradient-to-r from-green-400 via-green-500 to-green-400 bg-clip-text text-transparent">
                      {displayWinner} Wins 
                    </h2>
                    <p className="text-xl text-green-300">Congratulations!</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => renderCell(index))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 justify-center px-4 mb-10">
         {!isOnline &&<button
                        onClick={isOnline ? onlineProps?.resetGame : resetGame}
                        className="
                          px-6 py-3
                          bg-transparent
                          border border-cyan-400/40
                          text-cyan-300
                          font-medium rounded-xl

                          hover:bg-cyan-400/10
                          hover:shadow-lg

                          transition-all duration-300
                          transform hover:scale-105 active:scale-95
                          flex items-center gap-2
                        "
                      >
                    <RotateCcw className="w-4 h-4" />
                    New Round
                  </button>}

          {!isOnline && (
            <button
              onClick={() => {
                resetGame();
                setScores({ X: 0, O: 0, draws: 0 });
              }}
              className="
                          px-6 py-3
                          bg-transparent
                          border border-green-400/40
                          text-cyan-300
                          font-medium rounded-xl

                          hover:bg-green-400/10
                          hover:shadow-lg

                          transition-all duration-300
                          transform hover:scale-105 active:scale-95
                          flex items-center gap-2
                        "
                      >
              <Trophy className="w-4 h-4" />
              Reset Match
            </button>
          )}

          {isOnline && currentGame?.status === 'active' && (
            <button
              onClick={onlineProps?.forfeit}
              className="
                        px-6 py-3
                        bg-white/10 backdrop-blur-md
                        border border-red-400/40
                        text-red-300 font-medium rounded-xl

                        hover:bg-gradient-to-r
                        hover:from-red-00/80
                        hover:to-red-500/80
                        hover:text-white

                        shadow-lg hover:shadow-2xl
                        transition-all duration-300
                        transform hover:scale-105 active:scale-95
                      "
                    >
              Forfeit
            </button>

          )}

          {isOnline && currentGame?.status === 'finished' && (
            <button
                onClick={() => {
                  onlineProps?.resetGame();
                  onlineProps?.findMatch();
                }}
                className="
                  px-6 py-3
                  bg-transparent
                  border border-green-400/50
                  text-green-400 font-medium rounded-xl

                  hover:bg-green-400/10
                  hover:text-green-300

                  transition-all duration-300
                  transform hover:scale-105 active:scale-95
                  flex items-center gap-2
                "
              >
              New Match
            </button>

          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(5deg); }
          50% { transform: translate(-15px, 10px) rotate(-5deg); }
          75% { transform: translate(15px, 5px) rotate(3deg); }
        }
        @keyframes zoomRotate {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes winningCell {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        @keyframes expandRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    {/* </div> */}
    </div>
  );
}

export default TicTacGame;
