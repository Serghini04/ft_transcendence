import { useState, useEffect, useRef, useCallback} from "react";

export default function Local() {
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [winner, setWinner] = useState<"left" | "right" | null>(null);
  const winnerRef = useRef<"left" | "right" | null>(null);
  const [time, setTime] = useState(0);
  const [isVertical, setIsVertical] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lScoreRef = useRef(0);
  const rScoreRef = useRef(0);
  // Simple timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // useEffect(() => {
  //   if (leftScore >= 5) setWinner("left");
  //   else if (rightScore >= 5) setWinner("right");
  // }, [leftScore, rightScore]);

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

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || winnerRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // game update & draw logic handled here...
    requestAnimationFrame(loop);
  }, []);
  const resetGame = () => {
    lScoreRef.current = 0;
    rScoreRef.current = 0;
    setLeftScore(0);
    setRightScore(0);
    setWinner(null);
    winnerRef.current = null;
    setTime(0);

    // restart loop
    requestAnimationFrame(loop);
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
      current: { x: width / 2, y: height / 2, dx: 4 * scale, dy: 3 * scale, size: 8 * scale, visible: true },
    } as const as { current: { x: number; y: number; dx: number; dy: number; size: number; visible: boolean } };

    const paddle1Ref = { current: { x: 0, y: height / 2 - 45 * scale, width: 10 * scale, height: 90 * scale, speed: 6 * scale} };
    const paddle2Ref = { current: { x: width - 10 * scale, y: height / 2 - 45 * scale, width: 10 * scale, height: 90 * scale, speed: 6 *scale} };
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

      ballRef.current.dx = 3 * scale;
      ballRef.current.dy = 4 * scale;
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

    const resetBall = (direction : number) => {
      const ball = ballRef.current;
      ball.visible = false;
      // scoredRef.current = true;
      
      setTimeout(() => {
        ball.x = width / 2;
        ball.y = height / 2;
        ball.dx = 3 * direction * scale;
        ball.dy = 3 * scale;
        ball.visible = true;
        scoredRef.current = false;
        if (isVertical)
        {
          ball.dy = 3 * direction * scale;
          ball.dx = 3 * scale;
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
      ctx.fillStyle = "#8ADDD4";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      ctx.fillStyle = "#8ADDD4";
      ctx.beginPath();
      ctx.roundRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, 8);
      ctx.fill();

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
      window.removeEventListener("keydown", handleKeyUp);
    };

  }, [isVertical]);

  


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
            <img src="/src/assets/images/user1.jpeg" className="h-10 rounded-full" alt="Player 1" />
            <span className="text-lg font-semibold">{leftScore}</span>
          </div>

          {/* Game */}
          <div className="relative w-[90%] max-w-[300px] aspect-[9/16] border border-white/10 rounded-xl bg-[rgba(0,0,0,0.75)] overflow-hidden shadow-xl">
            <canvas ref={canvasRef} width={300} height={533} className="w-full h-full" />
          </div>


          {/* Player 2 Bottom */}
          <div className="flex flex-col items-center gap-2 text-white">
            <span className="text-lg font-semibold">{rightScore}</span>
            <img src="../src/assets/images/user2.jpeg" className="h-10 rounded-full" alt="Player 2" />
          </div>
        </>
      ) : (
        <>
          {/* Scoreboard */}
          <div className="flex justify-center items-center w-full mt-6 mb-10">
            <div
              className="flex justify-between items-center w-[700px] max-w-[90%] px-6 py-3 rounded-lg text-white"
              style={{
                background: "linear-gradient(90deg, rgba(18,32,38,0.28) 0%, rgba(169,255,246,0.28) 50%, rgba(15,21,27,0.28) 100%)",
                height: "65px", 
              }}
            >
              {/* Left Side */}
              <div className="flex items-center gap-3 w-20">
                <img
                  src="../src/assets/images/user2.jpeg"
                  alt="Player 1"
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
                  src="../src/assets/images/user1.jpeg"
                  alt="Player 2"
                  className="h-10 rounded-full"
                />
              </div>
            </div>
          </div>
          {/* Game Canvas */}
          <div  className={`border border-white/10 rounded-b-xl overflow-hidden shadow-xl bg-[rgba(0,0,0,0.75)w-full max-w-5xl aspect-[16/9]"
            }`}>
            <canvas
              ref={canvasRef}
              width={1200}
              height={675}
              className="w-full h-full"
            />
            {/* Winner Overlay */}
              {winner && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl">
                  <img
                    src={winner === "left" ? "../src/assets/images/user2.jpeg" : "../src/assets/images/user1.jpeg"}
                    alt="Winner"
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-yellow-400 shadow-lg mb-4"
                  />
                  <h2 className="text-white text-xl sm:text-3xl font-bold">
                    {winner === "left" ? "Player 1" : "Player 2"} won the game! 🏆
                  </h2>
                  <button
                    onClick={resetGame}
                    className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
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
