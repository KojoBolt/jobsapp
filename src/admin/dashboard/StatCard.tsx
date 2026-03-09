import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps): JSX.Element => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

type CircularProgressProps = {
  value: number; // 0 - 100
  accentColor?: string;
  size?: number; // px
  strokeWidth?: number;
};

const CircularProgress = ({
  value,
  accentColor = "#64748B",
  size = 72,
  strokeWidth = 8,
}: CircularProgressProps): JSX.Element => {
  const v = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - v / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          stroke="#E2E8F0"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          stroke={accentColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>

      {/* Center label */}
      <span className="absolute text-sm font-semibold text-slate-800">
        {v}%
      </span>
    </div>
  );
};

interface StatCardProps {
  number: string | number;
  label: string;
  percentage: number; 
  accentColor?: string;
}

const StatCard = ({
  number,
  label,
  percentage,
  accentColor = "#64748B",
}: StatCardProps): JSX.Element => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[32px] font-bold" style={{ color: accentColor }}>
          {number}
        </div>
        <div className="text-sm text-[#64748B] mt-1">{label}</div>
      </div>

      {/*  Percentage Tracker */}
      <CircularProgress value={percentage} accentColor={accentColor} />
    </div>
  </Card>
);

export { Card, StatCard };