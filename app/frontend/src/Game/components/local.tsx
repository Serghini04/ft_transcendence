import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react"; // you can replace with avatar images

export default function Local() {
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [time, setTime] = useState(0); // seconds = 2:08
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simple countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // let ball = { x: width / 2, y: height / 2, dx: 4, dy: 3, size: 8, visible: true};
    // let leftPaddle = { x: 0, y: height / 2 - 45, width: 10, height: 90, speed: 6 };
    // let rightPaddle = { x: width - 10, y: height / 2 - 45, width: 10, height: 90, speed: 6 };

    const ballRef = {
      current: { x: width / 2, y: height / 2, dx: 4, dy: 3, size: 8, visible: true },
    } as const as { current: { x: number; y: number; dx: number; dy: number; size: number; visible: boolean } };

    const leftPaddleRef = { current: { x: 0, y: height / 2 - 45, width: 10, height: 90, speed: 6 } };
    const rightPaddleRef = { current: { x: width - 10, y: height / 2 - 45, width: 10, height: 90, speed: 6 } };

    const lScoreRef = { current: 0 };
    const rScoreRef = { current: 0 };
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
        ball.dx = 3 * direction;
        ball.dy = 3;
        ball.visible = true;
        scoredRef.current = false;
      }, 1000);
    };


    const draw = () => {
      const ball = ballRef.current;
      const leftPaddle = leftPaddleRef.current;
      const rightPaddle = rightPaddleRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, width, height);

      // Center dashed line
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.setLineDash([20]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

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
      const leftPaddle = leftPaddleRef.current;
      const rightPaddle = rightPaddleRef.current; 

      if (!ball.visible) return;

      if (keysPressed["w"]) leftPaddle.y -= leftPaddle.speed;
      if (keysPressed["s"]) leftPaddle.y += leftPaddle.speed;
      if (keysPressed["arrowup"]) rightPaddle.y -= rightPaddle.speed;
      if (keysPressed["arrowdown"]) rightPaddle.y += rightPaddle.speed;

      // ******** mathmin(???) ***************************&&&&&&&*****&*&*&**&&*&****
      // Prevent paddles from going outside canvas
      leftPaddle.y = Math.max(0, Math.min(height - leftPaddle.height, leftPaddle.y));
      rightPaddle.y = Math.max(0, Math.min(height - rightPaddle.height, rightPaddle.y));

      ball.x += ball.dx;
      ball.y += ball.dy;

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

      // Scoring
      if (!scoredRef.current && ball.x + ball.size < 0) {
        ball.visible = false;
        scoredRef.current = true;
        rScoreRef.current += 1;
        setRightScore(rScoreRef.current);
        resetBall(1);
        return ;
      }
      
      if (!scoredRef.current && ball.x - ball.size > width) {
        ball.visible = false;
        scoredRef.current = true;
        lScoreRef.current += 1;
        setLeftScore(lScoreRef.current);
        resetBall(-1);
        return ;
      }
    };

    const loop = () => {
      update();
      draw();
      rafIdRef.current = requestAnimationFrame(loop);
    };


    if (!startRef.current) {
      startRef.current = true;
      loop();
    }

    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-5rem)]">
      {/* Scoreboard */}
      <div className="flex justify-center items-center w-full mt-6">
        <div
          className="flex justify-between items-center w-[600px] max-w-[90%] px-6 py-3 rounded-lgtext-white"
          style={{
            background: "linear-gradient(90deg, rgba(18,32,38,0.28) 0%, rgba(169,255,246,0.28) 50%, rgba(15,21,27,0.28) 100%)",
          }}
        >
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <img
              src="/public/user.png"
              alt="Player 1"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-2xl font-semibold">{leftScore}</span>
          </div>

          {/* Middle Time Section */}
          <div
            className="flex flex-col items-center justify-center px-10 py-2 text-black font-medium"
            style={{
              background: "rgba(217, 217, 217, 0.5)",
              clipPath: "polygon(0% 0%, 100% 0%, 60% 100%, 40% 100%)",
            }}
          >
            <span className="text-sm">Time</span>
            <span className="text-lg font-semibold">{time}</span>
          </div>


          {/* Right Side */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">{rightScore}</span>
            <img
              src="/public/user.png"
              alt="Player 2"
              className="w-8 h-8 rounded-full"
            />
          </div>
        </div>
      </div>

      
      {/* Game Canvas */}
      <div className="w-full max-w-4xl aspect-[16/9] bg-[rgba(0,0,0,0.75)] border border-white/10 rounded-b-xl overflow-hidden shadow-xl">
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
