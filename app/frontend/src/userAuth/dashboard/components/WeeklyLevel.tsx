import React from "react";

const weeklyData = [
  { day: "Sun", pingPong: 30, ticTacToe: 25 },
  { day: "Mon", pingPong: 80, ticTacToe: 45 },
  { day: "Tue", pingPong: 50, ticTacToe: 70 },
  { day: "Wed", pingPong: 35, ticTacToe: 45 },
  { day: "Thu", pingPong: 95, ticTacToe: 85 },
  { day: "Fri", pingPong: 90, ticTacToe: 65 },
  { day: "Sat", pingPong: 40, ticTacToe: 50 },
];

export default function WeeklyLevel() {
  const maxValue = 100;

  return (
    <div className="w-full xl:h-6 xl:mt-[-7rem]">
      <div className="rounded-2xl p-6 bg-[rgba(68,78,106,0.3)] border border-white/10 shadow-xl backdrop-blur-md">
        <h2 className="text-white text-lg font-semibold  mb-6 xl:mb-76">Weekly Level</h2>
        
        <div className="relative">
          {/* Percentage markers on the left */}
          <div className="absolute left-0 top-11 h-48 flex flex-col justify-between text-xs text-gray-500 pr-2">
            {[100, 75, 50, 25, 0].map((value) => (
              <span key={value} className="-mt-1">{value}%</span>
            ))}
          </div>
          
          {/* Bar chart with left margin for percentage labels */}
          <div className="ml-10 h-64 flex items-end justify-around gap-4 px-4">
            {weeklyData.map((day, index) => {
              const pingPongHeight = (day.pingPong / maxValue) * 100;
              const ticTacToeHeight = (day.ticTacToe / maxValue) * 100;

              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  {/* Bars container */}
                  <div className="flex gap-1 items-end h-48 w-full justify-center">
                    {/* PingPong bar */}
                    <div
                      className="w-3 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t transition-all duration-500 hover:opacity-80"
                      style={{ height: `${pingPongHeight}%` }}
                    />
                    {/* TicTacToe bar */}
                    <div
                      className="w-3 bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-t transition-all duration-500 hover:opacity-80"
                      style={{ height: `${ticTacToeHeight}%` }}
                    />
                  </div>
                  
                  {/* Day label */}
                  <span className="text-xs text-gray-400 font-medium">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded"></div>
            <span className="text-amber-400">PingPong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded"></div>
            <span className="text-cyan-400">TicTacToe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
