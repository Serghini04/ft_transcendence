import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react"; // you can replace with avatar images

export default function Local() {
  const [leftScore, setLeftScore] = useState(2);
  const [rightScore, setRightScore] = useState(0);
  const [time, setTime] = useState(128); // seconds = 2:08
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simple countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
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

    let ball = { x: width / 2, y: height / 2, dx: 3, dy: 3, size: 8 };
    let leftPaddle = { x: 10, y: height / 2 - 40, width: 10, height: 80 };
    let rightPaddle = { x: width - 20, y: height / 2 - 40, width: 10, height: 80 };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, width, height);

      // Center dashed line
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Ball
      ctx.fillStyle = "#12C0AD";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      ctx.fillStyle = "#12C0AD";
      ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
      ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
    };

    const update = () => {
      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.y < 0 || ball.y > height) ball.dy *= -1;

      if (ball.x < 0 || ball.x > width) ball.dx *= -1;
    };

    const loop = () => {
      update();
      draw();
      requestAnimationFrame(loop);
    };

    loop();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-5rem)]">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full max-w-4xl px-6 py-3 bg-[rgba(13,34,52,0.55)] rounded-t-xl backdrop-blur-md border border-white/10 shadow-lg">
        {/* Left Player */}
        <div className="flex items-center space-x-2">
          <User className="text-[#12C0AD] h-6 w-6" />
          <span className="text-white font-semibold text-lg">{leftScore}</span>
        </div>

        {/* Time */}
        <div className="px-6 py-1 bg-[rgba(255,255,255,0.1)] rounded-md text-white/90 font-medium text-sm">
          Time {formatTime(time)}
        </div>

        {/* Right Player */}
        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold text-lg">{rightScore}</span>
          <User className="text-[#12C0AD] h-6 w-6" />
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
