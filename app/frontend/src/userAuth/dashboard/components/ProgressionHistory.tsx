import React from "react";

const monthlyData = [
  { month: "Jan", value1: 30, value2: 25 },
  { month: "Feb", value1: 45, value2: 35 },
  { month: "Mar", value1: 35, value2: 50 },
  { month: "Apr", value1: 55, value2: 45 },
  { month: "May", value1: 40, value2: 60 },
  { month: "Jun", value1: 70, value2: 55 },
  { month: "Jul", value1: 50, value2: 40 },
  { month: "Aug", value1: 65, value2: 70 },
  { month: "Sep", value1: 75, value2: 60 },
  { month: "Oct", value1: 60, value2: 80 },
  { month: "Nov", value1: 85, value2: 75 },
  { month: "Dec", value1: 70, value2: 85 },
];

export default function ProgressionHistory() {
  const maxValue = 100;
  const height = 150;
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = chartWidth / (monthlyData.length - 1);

  const getY = (value: number) => {
    return padding.top + chartHeight - (value / maxValue) * chartHeight;
  };

  const createPath = (dataKey: 'value1' | 'value2') => {
    return monthlyData.map((point, index) => {
      const x = padding.left + index * xStep;
      const y = getY(point[dataKey]);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl p-6 bg-[rgba(68,78,106,0.3)] shadow-xl backdrop-blur-md">
        <h2 className="text-white text-lg font-semibold mb-6">Progression History</h2>
        
        <div className="relative">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((value) => (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={getY(value)}
                  x2={width - padding.right}
                  y2={getY(value)}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.3"
                />
                <text
                  x={padding.left - 10}
                  y={getY(value)}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize="10"
                  dominantBaseline="middle"
                >
                  {value}
                </text>
              </g>
            ))}

            {/* Line 1 - Yellow/Amber */}
            <path
              d={createPath('value1')}
              fill="none"
              stroke="#FCD34D"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Line 2 - Cyan */}
            <path
              d={createPath('value2')}
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {monthlyData.map((point, index) => {
              const x = padding.left + index * xStep;
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={getY(point.value1)}
                    r="3"
                    fill="#FCD34D"
                  />
                  <circle
                    cx={x}
                    cy={getY(point.value2)}
                    r="3"
                    fill="#22D3EE"
                  />
                </g>
              );
            })}

            {/* X-axis labels */}
            {monthlyData.map((point, index) => {
              const x = padding.left + index * xStep;
              return (
                <text
                  key={index}
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="10"
                >
                  {point.month}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
