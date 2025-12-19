import { useState, useEffect, useRef} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

interface Player {
  id: number;
  name: string;
  image: string;
}

interface Players {
  first: Player;
  second: Player;
}

export default function Local() {
  const [players, setPlayers] = useState<Players>({
    first: { id: 0, name: "", image: "" },
    second: { id: 0, name: "", image: "" },
  });
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [winner, setWinner] = useState<"left" | "right" | null>(null);
  const winnerRef = useRef<"left" | "right" | null>(null);
  const [time, setTime] = useState(0);
  const [isVertical, setIsVertical] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef< () => void>(() => {});

  // Game options from navigation state 
  const location = useLocation();
  const { map = "Classic", powerUps = false, speed = "Normal" } = location.state || {};

  console.log("Game Options:", { map, powerUps, speed });
  const gameThemes = {
    Classic: {
      background: "bg-[rgba(0,0,0,0.75)]",
      color: "#8ADDD4",
    },
    Desert: {
      background: "bg-gradient-to-b from-yellow-600 via-amber-800 to-orange-900",
      color: "#FFD580",
    },
    Chemistry: {
      background: "bg-gradient-to-br from-lime-600 via-emerald-800 to-green-950",
      color: "#A8FF60",
    },
  };
  const theme = gameThemes[map as keyof typeof gameThemes] || gameThemes.Classic;
  const speedMultiplier = { Slow: 0.8, Normal: 1.3, Fast: 2.5 };
  type SpeedType = keyof typeof speedMultiplier;

  const lScoreRef = useRef(0);
  const rScoreRef = useRef(0);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/players")
      .then((response) => setPlayers(response.data))
      .catch((error) => console.error("Error fetching players:", error));
  }, []);

  // Simple timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!winnerRef.current)
        setTime((prev) => (prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect scrren size to switch the layout
  useEffect(() => {
    const handleResize = () => setIsVertical(window.innerWidth < 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  const resetGame = () => {
    lScoreRef.current = 0;
    rScoreRef.current = 0;
    setLeftScore(0);
    setRightScore(0);
    setWinner(null);
    winnerRef.current = null;
    setTime(0);

    // restart loop
    if (loopRef.current) {
      requestAnimationFrame(loopRef.current);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = isVertical ? 0.6 : 1;
    const width = canvas.width;
    const height = canvas.height;

    const ballRef = {
      current: { x: width / 2, y: height / 2, dx: 4 * scale * speedMultiplier[speed as SpeedType], dy: 3 * scale * speedMultiplier[speed as SpeedType], size: 8 * scale, visible: true },
    } as const as { current: { x: number; y: number; dx: number; dy: number; size: number; visible: boolean } };

    const paddle1Ref = { current: { x: 0, y: height / 2 - 45 * scale, width: 10 * scale, height: 90 * scale, speed: 6 * scale} };
    const paddle2Ref = { current: { x: width - 10 * scale, y: height / 2 - 45 * scale, width: 10 * scale, height: 90 * scale, speed: 6 *scale} };

    const powerUpRef = {
      current: { x: width / 2 - 20 * scale, y: height / 2 - 40 * scale, width: 12 * scale, height: 150 * scale, visible: false },
    };

    if (isVertical)
    {
      paddle1Ref.current.x = width / 2 - 45 * scale;
      paddle1Ref.current.y = height - 10 * scale;
      paddle1Ref.current.width = 90 * scale;
      paddle1Ref.current.height = 10 * scale;

      paddle2Ref.current.x = width / 2 - 45 * scale;
      paddle2Ref.current.y = 0;
      paddle2Ref.current.width = 90 * scale;
      paddle2Ref.current.height = 10 * scale;

      ballRef.current.dx = 3 * scale * speedMultiplier[speed as SpeedType];
      ballRef.current.dy = 4 * scale * speedMultiplier[speed as SpeedType];

      powerUpRef.current.width = 150 * scale;
      powerUpRef.current.height = 12 * scale;
    }

    const startRef = { current: false };
    const rafIdRef = { current: 0 as number | null };
    const scoredRef = { current: false };

    const keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLocaleLowerCase()] = true;
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLocaleLowerCase()] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastPowerUpTime = performance.now();
    const powerUpDuration = 5000; // visible for 5s
    const powerUpInterval = 5000; // reappears every 5s

    const spawnPowerUp = () => {
      powerUpRef.current.x = width / 2 + (Math.random() * 100 - 100);
      powerUpRef.current.y = height / 2 + (Math.random() * 100 - 100);
      powerUpRef.current.visible = true;

      setTimeout(() => {
        powerUpRef.current.visible = false;
      }, powerUpDuration);
    };


    const resetBall = (direction : number) => {
      const ball = ballRef.current;
      ball.visible = false;
      
      setTimeout(() => {
        ball.x = width / 2;
        ball.y = height / 2;
        ball.dx = 3 * direction * scale * speedMultiplier[speed as SpeedType];
        ball.dy = 3 * scale * speedMultiplier[speed as SpeedType];
        ball.visible = true;
        scoredRef.current = false;
        if (isVertical)
        {
          ball.dy = 3 * direction * scale * speedMultiplier[speed as SpeedType];
          ball.dx = 3 * scale * speedMultiplier[speed as SpeedType];
        }
      }, 1000);
    };

    const draw = () => {
      const ball = ballRef.current;
      const leftPaddle = paddle1Ref.current;
      const rightPaddle = paddle2Ref.current;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, width, height);


      // Center dashed line
      if (isVertical)
      {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.setLineDash([20]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
      else
      {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.setLineDash([20]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
      }

      // Ball
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.roundRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, 8);
      ctx.fill();

      //Draw power-up paddle
      if (powerUps && powerUpRef.current.visible) {
        ctx.save();

        const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
        ctx.globalAlpha = pulse;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = theme.color;
        const hueShift = (Date.now() / 15) % 360;
        ctx.fillStyle = `hsl(${hueShift}, 80%, 60%)`;


        ctx.beginPath();
        ctx.roundRect(powerUpRef.current.x, powerUpRef.current.y, powerUpRef.current.width, powerUpRef.current.height, 6);
        ctx.fill();

        ctx.restore(); // restore globalAlpha, shadows, etc.
      }

    };

    const update = () => {
      const ball = ballRef.current;
      const leftPaddle = paddle1Ref.current;
      const rightPaddle = paddle2Ref.current; 

      if (!ball.visible) return;
      if (isVertical)
      {
        // Move paddles horizontally 
        if (keysPressed["a"]) leftPaddle.x -= leftPaddle.speed;
        if (keysPressed["d"]) leftPaddle.x += leftPaddle.speed;
        if (keysPressed["arrowleft"]) rightPaddle.x -= rightPaddle.speed;
        if (keysPressed["arrowright"]) rightPaddle.x += rightPaddle.speed;

        // Prevent paddles from going outside canvas
        leftPaddle.x = Math.max(0, Math.min(width - leftPaddle.width, leftPaddle.x));
        rightPaddle.x = Math.max(0, Math.min(width - rightPaddle.width, rightPaddle.x));
        
      }
      else
      {
        // Move paddles vertically
        if (keysPressed["w"]) leftPaddle.y -= leftPaddle.speed;
        if (keysPressed["s"]) leftPaddle.y += leftPaddle.speed;
        if (keysPressed["arrowup"]) rightPaddle.y -= rightPaddle.speed;
        if (keysPressed["arrowdown"]) rightPaddle.y += rightPaddle.speed;
        
        // Prevent paddles from going outside canvas
        leftPaddle.y = Math.max(0, Math.min(height - leftPaddle.height, leftPaddle.y));
        rightPaddle.y = Math.max(0, Math.min(height - rightPaddle.height, rightPaddle.y));
      }

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (isVertical)
      {
        // Bounce off left/right
        if (ball.x - ball.size < 0 || ball.x + ball.size > width) {
          ball.dx *= -1;
        }

        // Paddle collisions
        if (
          ball.y + ball.size > leftPaddle.y &&
          ball.x > leftPaddle.x &&
          ball.x < leftPaddle.x + leftPaddle.width
        ) {
          ball.dy *= -1;
          ball.y = leftPaddle.y - ball.size;
        }

        if (
          ball.y - ball.size < rightPaddle.y + rightPaddle.height &&
          ball.x > rightPaddle.x &&
          ball.x < rightPaddle.x + rightPaddle.width
        ) {
          ball.dy *= -1;
          ball.y = rightPaddle.y + rightPaddle.height + ball.size;
        }
      }
      else
      {
        // Bounce off top/bottom
        if (ball.y - ball.size < 0 || ball.y + ball.size > height) {
          ball.dy *= -1;
        }

        // Paddle collisions
        if (
          ball.x - ball.size < leftPaddle.x + leftPaddle.width &&
          ball.y > leftPaddle.y &&
          ball.y < leftPaddle.y + leftPaddle.height
        ) {
          ball.dx *= -1;
          ball.x = leftPaddle.x + leftPaddle.width + ball.size;
        }

        if (
          ball.x + ball.size > rightPaddle.x &&
          ball.y > rightPaddle.y &&
          ball.y < rightPaddle.y + rightPaddle.height
        ) {
          ball.dx *= -1;
          ball.x = rightPaddle.x - ball.size;
        }
      }

      //Power-up appearance timing
      const now = performance.now();
      if (now - lastPowerUpTime >= powerUpInterval + powerUpDuration) {
        spawnPowerUp();
        lastPowerUpTime = now;
      }

      //collision with Power-up paddle
      if (powerUps && powerUpRef.current.visible) {
        const p = powerUpRef.current;
        if (
          ball.x + ball.size > p.x &&
          ball.x - ball.size < p.x + p.width &&
          ball.y + ball.size > p.y &&
          ball.y - ball.size < p.y + p.height
        ) {
          // Bounce like normal paddle
          if (isVertical) ball.dy *= -1;
          else ball.dx *= -1;

          // Optional: small deflection effect
          ball.x += ball.dx * 0.5;
          ball.y += ball.dy * 0.5;

          powerUpRef.current.visible = false; // disappear immediately after collision
        }
      }

      // Scoring
      if (!scoredRef.current && (ball.x + ball.size < 0
          || (isVertical && ball.y + ball.size < 0))
      ) {
        ball.visible = false;
        scoredRef.current = true;
        rScoreRef.current += 1;
        setRightScore(rScoreRef.current);
        if (rScoreRef.current >= 5)
          setWinner("right");
        resetBall(1);
        return ;
      }
      
      if (!scoredRef.current && (ball.x - ball.size > width
          || (isVertical && ball.y - ball.size > height))
      ) {
        ball.visible = false;
        scoredRef.current = true;
        lScoreRef.current += 1;
        setLeftScore(lScoreRef.current);
        if (lScoreRef.current >= 5)
          setWinner("left");
        resetBall(-1);
        return ;
      }
    };

    const loop = () => {
      if (winnerRef.current)
      {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
          return;
      }
      update();
      draw();
      rafIdRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = () => requestAnimationFrame(loop);

    if (!startRef.current) {
      startRef.current = true;
      loop();
    }
    else if (!rafIdRef.current && !winner) {
      loop();
    }


    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };

  }, [isVertical, powerUps]);

  


  return (
    
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)]">
      {isVertical ? (
        <>
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className="mb-2 bg-[rgba(217,217,217,0.4)] rounded-md px-4 py-1 text-black font-medium text-sm backdrop-blur-sm">
              ⏱ {formatTime(time)}
            </div>
          </div>

          {/* Player 1 Top */}
          <div className="flex flex-col items-center gap-2 text-white">
            <img src={players.first.image} className="h-10 rounded-full" alt={players.first.name} />
            <span className="text-lg font-semibold">{leftScore}</span>
          </div>

          {/* Game */}
          <div className={`relative w-[90%] max-w-[300px] aspect-[9/16] border border-white/10 rounded-xl ${theme.background} overflow-hidden shadow-xl`}>
            <canvas ref={canvasRef} width={300} height={533} className="w-full h-full" />
          </div>

          {/* Winner Overlay — Mobile */}
          {winner && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-20 p-4">
              <div className="flex flex-col items-center justify-center translate-x-9 sm:translate-x-0">
                <img
                  src={winner === "left" ? players.first.image : players.second.image}
                  alt="Winner"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 shadow-lg mb-3 object-cover"
                />
                <h2 className="text-white text-lg sm:text-2xl font-bold text-center leading-snug">
                  {winner === "left" ? players.first.name : players.second.name} won the game! 🏆
                </h2>
                <button
                  onClick={resetGame}
                  className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md text-sm"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
          {/* Player 2 Bottom */}
          <div className="flex flex-col items-center gap-2 text-white">
            <span className="text-lg font-semibold">{rightScore}</span>
            <img src={players.second.image} className="h-10 rounded-full" alt={players.second.name} />
          </div>
        </>
      ) : (
        <>
          {/* Scoreboard */}
          <div className="flex justify-center items-center w-full mt-6 mb-10">
            <div
              className="flex justify-between items-center w-[700px] max-w-[90%] px-6 py-3 rounded-[15px] text-white"
              style={{
                background: "linear-gradient(90deg, rgba(14,19,24,0.28) 0%, rgba(169,255,246,0.28) 50%, rgba(14,23,30,0.28) 100%)",
                // background: "rgba(255, 255, 255, 0.5)",

                height: "65px", 
              }}
            >
              {/* Left Side */}
              <div className="flex items-center gap-3 w-20">
                <img
                  src={players.first.image}
                  alt={players.first.name}
                  className="h-10 rounded-full"
                />
                <span className="text-[22px] font-semibold">{leftScore}</span>
              </div>

              {/* Middle Time Section */}
              <div
                className="flex flex-col items-center justify-center px-10 py-2 text-black font-medium"
                style={{
                  background: "rgba(217, 217, 217, 0.5)",
                  clipPath: "polygon(0% 0%, 100% 0%, 70% 100%, 30% 100%)",
                  height: "65px",
                  width: "170px",
                }}
              >
                <span className="font-outfit text-[18px] font-meduim">Time</span>
                <span className="font-outfit text-[18px] font-meduim">{formatTime(time)}</span>
              </div>


              {/* Right Side */}
              <div className="flex items-center gap-3 w-20">
                <span className="text-[22px] font-semibold">{rightScore}</span>
                <img
                  src={players.second.image}
                  alt={players.second.name}
                  className="h-10 rounded-full"
                />
              </div>
            </div>
          </div>
          {/* Game Canvas */}
          <div  className={`border border-white/10 rounded-[7px] overflow-hidden shadow-xl ${theme.background} w-full max-w-5xl aspect-[16/9]`}>
            <canvas
              ref={canvasRef}
              width={1200}
              height={675}
              className="w-full h-full"
            />
            
            {/* Winner Overlay — Desktop */}
            {winner && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-tl-4xl z-20 p-6">
                <img
                  src={winner === "left" ? players.first.image : players.second.image}
                  alt="Winner"
                  className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-lg mb-4"
                />
                <h2 className="text-white text-2xl sm:text-3xl font-bold text-center">
                  {winner === "left" ? players.first.name : players.second.name} won the game! 🏆
                </h2>
                <button
                  onClick={resetGame}
                  className="mt-5 px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
                >
                  Play Again
                </button>
              </div>
            )}

          </div>
        </>
      )
      }
    </div>
  );
}
