"use client";

import { Briefcase, Award, Clock, CheckCircle } from 'lucide-react';

const skillsData = [
  { month: 'Jan', skills: 12 },
  { month: 'Feb', skills: 19 },
  { month: 'Mar', skills: 28 },
  { month: 'Apr', skills: 35 },
  { month: 'May', skills: 42 },
  { month: 'Jun', skills: 48 },
];

const careerData = [
  { name: 'Software Engineer', value: 35 },
  { name: 'Data Scientist', value: 28 },
  { name: 'Product Manager', value: 22 },
  { name: 'Other', value: 15 },
];

const activityData = [
  { day: 'Mon', hours: 4 },
  { day: 'Tue', hours: 5 },
  { day: 'Wed', hours: 3 },
  { day: 'Thu', hours: 6 },
  { day: 'Fri', hours: 4 },
  { day: 'Sat', hours: 7 },
  { day: 'Sun', hours: 5 },
];

const COLORS = ['#0a7fff', '#1a8fff', '#3aaeff', '#5ac0ff'];

// Helper function to calculate pie chart paths
function calculatePieSlice(index: number, total: number, values: number[]) {
  const totalValue = values.reduce((a, b) => a + b, 0);
  let currentAngle = 0;
  
  for (let i = 0; i < index; i++) {
    currentAngle += (values[i] / totalValue) * 360;
  }
  
  const sliceAngle = (values[index] / totalValue) * 360;
  const startAngle = currentAngle - 90; // Start from top
  const endAngle = currentAngle + sliceAngle - 90;
  
  const centerX = 125;
  const centerY = 125;
  const radius = 90;
  const innerRadius = 60;
  
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;
  
  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);
  
  const x3 = centerX + innerRadius * Math.cos(endAngleRad);
  const y3 = centerY + innerRadius * Math.sin(endAngleRad);
  const x4 = centerX + innerRadius * Math.cos(startAngleRad);
  const y4 = centerY + innerRadius * Math.sin(startAngleRad);
  
  const largeArc = sliceAngle > 180 ? 1 : 0;
  
  const path = [
    `M ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z'
  ].join(' ');
  
  return path;
}

export default function DashboardHome() {
  const maxSkills = Math.max(...skillsData.map(d => d.skills));
  const maxHours = Math.max(...activityData.map(d => d.hours));
  const careerValues = careerData.map(d => d.value);
  const totalCareer = careerValues.reduce((a, b) => a + b, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-foreground/60">Welcome to SkillSphere - Your AI Career Companion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Career Paths Explored", value: "12", icon: Briefcase, change: "+15%" },
          { title: "Skills Mastered", value: "48", icon: Award, change: "+23%" },
          { title: "Learning Hours", value: "134", icon: Clock, change: "+18%" },
          { title: "Interview Sessions", value: "8", icon: CheckCircle, change: "+12%" }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all">
              <div className="flex items-center justify-between mb-3">
                <Icon className="text-primary" size={24} />
                <span className="text-sm font-semibold text-primary">{stat.change}</span>
              </div>
              <p className="text-sm text-foreground/60 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Progress - Hardcoded SVG Line Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Skills Progress</h3>
          <div className="w-full" style={{ height: '250px' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 250" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Y-axis labels */}
              {[0, 12, 24, 36, 48].map((val, i) => (
                <g key={i}>
                  <line x1="40" y1={220 - (val / maxSkills) * 180} x2="480" y2={220 - (val / maxSkills) * 180} 
                        stroke="currentColor" strokeWidth="1" opacity="0.1" strokeDasharray="3 3" />
                  <text x="35" y={225 - (val / maxSkills) * 180} fill="currentColor" fontSize="12" opacity="0.6" textAnchor="end">
                    {val}
                  </text>
                </g>
              ))}
              
              {/* X-axis labels */}
              {skillsData.map((d, i) => (
                <text key={i} x={80 + i * 70} y="240" fill="currentColor" fontSize="12" opacity="0.6" textAnchor="middle">
                  {d.month}
                </text>
              ))}
              
              {/* Line path */}
              <polyline
                points={skillsData.map((d, i) => `${80 + i * 70},${220 - (d.skills / maxSkills) * 180}`).join(' ')}
                fill="none"
                stroke="#0a7fff"
                strokeWidth="3"
              />
              
              {/* Data points */}
              {skillsData.map((d, i) => (
                <circle
                  key={i}
                  cx={80 + i * 70}
                  cy={220 - (d.skills / maxSkills) * 180}
                  r="5"
                  fill="#0a7fff"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Career Interests - Hardcoded SVG Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Career Interests</h3>
          <div className="w-full flex items-center justify-center" style={{ height: '250px' }}>
            <svg width="250" height="250" viewBox="0 0 250 250">
              {careerData.map((entry, index) => {
                const path = calculatePieSlice(index, totalCareer, careerValues);
                const percent = ((entry.value / totalCareer) * 100).toFixed(0);
                const labelAngle = careerValues.slice(0, index).reduce((a, b) => a + b, 0) / totalCareer * 360 + 
                                  (entry.value / totalCareer) * 180 - 90;
                const labelRadius = 75;
                const labelX = 125 + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
                const labelY = 125 + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
                
                return (
                  <g key={index}>
                    <path
                      d={path}
                      fill={COLORS[index % COLORS.length]}
                      stroke="var(--card)"
                      strokeWidth="2"
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      fill="currentColor"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {entry.name.split(' ')[0]} {percent}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Weekly Activity - Hardcoded Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Weekly Learning Activity</h3>
        <div className="w-full" style={{ height: '250px' }}>
          <div className="flex items-end justify-between h-full gap-2 px-4">
            {activityData.map((d, i) => {
              const heightPercent = (d.hours / maxHours) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1 h-full">
                  <div className="w-full flex items-end justify-center flex-1 mb-2">
                    <div
                      className="w-full bg-[#0a7fff] rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                      title={`${d.hours} hours`}
                    />
                  </div>
                  <span className="text-xs text-foreground/60">{d.day}</span>
                  <span className="text-xs font-semibold text-foreground mt-1">{d.hours}h</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
