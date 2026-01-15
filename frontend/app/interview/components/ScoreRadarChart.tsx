/**
 * Score Radar Chart Component
 * Visualizes category scores in a radar chart
 */

'use client';

import { InterviewScore } from '../types';

interface ScoreRadarChartProps {
  categories: InterviewScore['categories'];
}

export default function ScoreRadarChart({ categories }: ScoreRadarChartProps) {
  const data = [
    { label: 'Technical', score: categories.technicalKnowledge.score },
    { label: 'Problem Solving', score: categories.problemSolving.score },
    { label: 'Communication', score: categories.communication.score },
    { label: 'Projects', score: categories.projectUnderstanding.score },
  ];

  const size = 280;
  const center = size / 2;
  const maxRadius = center - 40;
  const levels = 5;

  // Calculate points for a polygon
  const getPoint = (angle: number, distance: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + distance * Math.cos(radian),
      y: center + distance * Math.sin(radian),
    };
  };

  // Create path for data
  const dataPath = data
    .map((item, index) => {
      const angle = (360 / data.length) * index;
      const distance = (item.score / 100) * maxRadius;
      const point = getPoint(angle, distance);
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ') + ' Z';

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Background levels */}
        {Array.from({ length: levels }).map((_, i) => {
          const radius = (maxRadius / levels) * (i + 1);
          const points = data
            .map((_, index) => {
              const angle = (360 / data.length) * index;
              return getPoint(angle, radius);
            })
            .map((p) => `${p.x},${p.y}`)
            .join(' ');

          return (
            <polygon
              key={i}
              points={points}
              fill="none"
              stroke="#475569"
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, index) => {
          const angle = (360 / data.length) * index;
          const point = getPoint(angle, maxRadius);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#475569"
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={dataPath}
          fill="url(#radarGradient)"
          stroke="#A78BFA"
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((item, index) => {
          const angle = (360 / data.length) * index;
          const distance = (item.score / 100) * maxRadius;
          const point = getPoint(angle, distance);
          
          return (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#A78BFA"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="#A78BFA"
                opacity="0.3"
              />
            </g>
          );
        })}

        {/* Labels */}
        {data.map((item, index) => {
          const angle = (360 / data.length) * index;
          const labelDistance = maxRadius + 25;
          const point = getPoint(angle, labelDistance);
          
          return (
            <text
              key={index}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium fill-slate-300"
            >
              {item.label}
            </text>
          );
        })}

        {/* Score labels */}
        {data.map((item, index) => {
          const angle = (360 / data.length) * index;
          const scoreDistance = maxRadius + 40;
          const point = getPoint(angle, scoreDistance);
          
          return (
            <text
              key={index}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-bold fill-purple-400"
            >
              {item.score}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
