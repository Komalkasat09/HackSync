"use client";

import { useEffect, useState } from 'react';
import {
  Briefcase,
  Award,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  BookOpen,
  Video,
  Loader2,
  Activity
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { API_ENDPOINTS } from '@/lib/config';

interface DashboardStats {
  applications_count: number;
  career_sessions: number;
  topics_learned: number;
  interviews_given: number;
  skills_count: number;
  learning_hours: number;
  recent_applications: number;
  recent_interviews: number;
}

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [skillsProgress, setSkillsProgress] = useState<any[]>([]);
  const [careerInterests, setCareerInterests] = useState<any[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 5.2 },
    { day: 'Wed', hours: 4.8 },
    { day: 'Thu', hours: 6.1 },
    { day: 'Fri', hours: 4.3 },
    { day: 'Sat', hours: 7.5 },
    { day: 'Sun', hours: 5.9 }
  ]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [monthlyApplications, setMonthlyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, skillsRes, careerRes, activityRes, activitiesRes, appsRes] = await Promise.all([
        fetch(API_ENDPOINTS.DASHBOARD.STATS, { headers }),
        fetch(API_ENDPOINTS.DASHBOARD.SKILLS_PROGRESS, { headers }),
        fetch(API_ENDPOINTS.DASHBOARD.CAREER_INTERESTS, { headers }),
        fetch(API_ENDPOINTS.DASHBOARD.WEEKLY_ACTIVITY, { headers }),
        fetch(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES, { headers }),
        fetch(API_ENDPOINTS.DASHBOARD.MONTHLY_APPLICATIONS, { headers }),
      ]);

      const [statsData, skillsData, careerData, activityData, activitiesData, appsData] = await Promise.all([
        statsRes.json(),
        skillsRes.json(),
        careerRes.json(),
        activityRes.json(),
        activitiesRes.json(),
        appsRes.json(),
      ]);

      setStats(statsData.stats);
      setSkillsProgress(skillsData.data);
      setCareerInterests(careerData.data);
      setWeeklyActivity(activityData.data);
      setRecentActivities(activitiesData.activities || []);
      setMonthlyApplications(appsData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Briefcase className="w-4 h-4" />;
      case 'learning':
        return <BookOpen className="w-4 h-4" />;
      case 'interview':
        return <Video className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-500" />
            </div>
            {stats && stats.recent_applications > 0 && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{stats.recent_applications} this month
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {stats?.applications_count || 0}
          </h3>
          <p className="text-sm text-foreground/60">Job Applications</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {stats?.career_sessions || 0}
          </h3>
          <p className="text-sm text-foreground/60">Career Counseling Sessions</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {stats?.topics_learned || 0}
          </h3>
          <p className="text-sm text-foreground/60">Topics Learned</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Video className="w-6 h-6 text-orange-500" />
            </div>
            {stats && stats.recent_interviews > 0 && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{stats.recent_interviews} this month
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {stats?.interviews_given || 0}
          </h3>
          <p className="text-sm text-foreground/60">Interview Sessions</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        {/* Skills Progress */}
        <div className="bg-card border border-border rounded-xl p-6 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Skills Progress</h3>
              <p className="text-sm text-foreground/60 mt-1">Your learning journey over time</p>
            </div>
            <Award className="w-5 h-5 text-foreground/40" />
          </div>
          <div style={{ height: '250px' }}>
            <ResponsiveLine
              data={[
                {
                  id: 'skills',
                  data: skillsProgress.map(d => ({ x: d.month, y: d.skills }))
                }
              ]}
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
              curve="natural"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              colors={['#0a7fff']}
              lineWidth={3}
              pointSize={10}
              pointColor="#0a7fff"
              pointBorderWidth={2}
              pointBorderColor="#ffffff"
              enableArea={true}
              areaOpacity={0.25}
              areaBaselineValue={0}
              useMesh={true}
              animate={true}
              motionConfig="slow"
              enableGridX={false}
              enableGridY={true}
              gridYValues={5}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.95)',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    {slice.points[0].data.xFormatted}
                  </div>
                  <div style={{ color: '#0a7fff', fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                    {slice.points[0].data.yFormatted} skills
                  </div>
                </div>
              )}
              defs={[
                {
                  id: 'skillsGradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: '#0a7fff', opacity: 0.5 },
                    { offset: 100, color: '#0a7fff', opacity: 0 }
                  ]
                }
              ]}
              fill={[{ match: '*', id: 'skillsGradient' }]}
              theme={{
                axis: {
                  ticks: {
                    text: { fill: '#888', fontSize: 12 }
                  }
                },
                grid: {
                  line: { stroke: '#333', strokeWidth: 1, opacity: 0.1 }
                },
                crosshair: {
                  line: {
                    stroke: '#0a7fff',
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                    strokeDasharray: '6 6'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Career Interests */}
        <div className="bg-card border border-border rounded-xl p-6 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Career Interests</h3>
              <p className="text-sm text-foreground/60 mt-1">Distribution of your focus areas</p>
            </div>
            <Target className="w-5 h-5 text-foreground/40" />
          </div>
          <div style={{ height: '250px' }}>
            <ResponsivePie
              data={careerInterests.map(d => ({ id: d.name, label: d.name, value: d.value }))}
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.65}
              padAngle={2}
              cornerRadius={6}
              activeOuterRadiusOffset={12}
              colors={['#0a7fff', '#1a8fff', '#3aaeff', '#5ac0ff', '#7ad1ff']}
              borderWidth={0}
              borderColor="#ffffff"
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#888"
              arcLinkLabelsThickness={3}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={15}
              arcLabelsTextColor="#ffffff"
              valueFormat={value => `${value}%`}
              animate={true}
              motionConfig="slow"
              transitionMode="startAngle"
              enableArcLinkLabels={true}
              defs={[
                {
                  id: 'lines',
                  type: 'patternLines',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.1)',
                  rotation: -45,
                  lineWidth: 4,
                  spacing: 8
                }
              ]}
              theme={{
                tooltip: {
                  container: {
                    background: 'rgba(0, 0, 0, 0.95)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {/* Weekly Activity */}
        <div className="bg-card border border-border rounded-xl p-6 animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Weekly Activity</h3>
              <p className="text-sm text-foreground/60 mt-1">Hours spent on learning & prep</p>
            </div>
            <Clock className="w-5 h-5 text-foreground/40" />
          </div>
          <div style={{ height: '250px' }}>
            <ResponsiveBar
              data={weeklyActivity}
              keys={['hours']}
              indexBy="day"
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              padding={0.25}
              colors={['#0a7fff']}
              borderRadius={12}
              borderWidth={2}
              borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              valueFormat={value => `${value} hrs`}
              animate={true}
              motionConfig="wobbly"
              enableGridY={true}
              gridYValues={5}
              enableGridX={false}
              defs={[
                {
                  id: 'barGradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: '#0a7fff', opacity: 1 },
                    { offset: 100, color: '#0a7fff', opacity: 0.7 }
                  ]
                }
              ]}
              fill={[{ match: '*', id: 'barGradient' }]}
              theme={{
                axis: {
                  ticks: {
                    text: { fill: '#888', fontSize: 12 }
                  }
                },
                grid: {
                  line: { stroke: '#333', strokeWidth: 1, opacity: 0.15 }
                },
                tooltip: {
                  container: {
                    background: 'rgba(0, 0, 0, 0.95)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Monthly Applications Trend */}
        <div className="bg-card border border-border rounded-xl p-6 animate-scale-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Application Trend</h3>
              <p className="text-sm text-foreground/60 mt-1">Job applications over 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-foreground/40" />
          </div>
          <div style={{ height: '250px' }}>
            <ResponsiveLine
              data={[
                {
                  id: 'applications',
                  data: monthlyApplications.map(d => ({ x: d.month, y: d.applications }))
                }
              ]}
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
              curve="natural"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
              }}
              colors={['#0a7fff']}
              lineWidth={3}
              pointSize={10}
              pointColor="#0a7fff"
              pointBorderWidth={2}
              pointBorderColor="#ffffff"
              useMesh={true}
              animate={true}
              motionConfig="slow"
              enableGridX={false}
              enableGridY={true}
              gridYValues={5}
              enableArea={true}
              areaOpacity={0.25}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.95)',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                    {slice.points[0].data.xFormatted}
                  </div>
                  <div style={{ color: '#0a7fff', fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                    {slice.points[0].data.yFormatted} applications
                  </div>
                </div>
              )}
              defs={[
                {
                  id: 'appsGradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: '#0a7fff', opacity: 0.5 },
                    { offset: 100, color: '#0a7fff', opacity: 0 }
                  ]
                }
              ]}
              fill={[{ match: '*', id: 'appsGradient' }]}
              theme={{
                axis: {
                  ticks: {
                    text: { fill: '#888', fontSize: 12 }
                  }
                },
                grid: {
                  line: { stroke: '#333', strokeWidth: 1, opacity: 0.1 }
                },
                crosshair: {
                  line: {
                    stroke: '#0a7fff',
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                    strokeDasharray: '6 6'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <p className="text-sm text-foreground/60 mt-1">Your latest actions and milestones</p>
          </div>
          <Calendar className="w-5 h-5 text-foreground/40" />
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-foreground/20 mb-3" />
            <p className="text-foreground/60">No recent activity</p>
            <p className="text-sm text-foreground/40 mt-1">Start applying, learning, or practicing interviews!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'application' ? 'bg-blue-500/10 text-blue-500' :
                  activity.type === 'learning' ? 'bg-green-500/10 text-green-500' :
                  'bg-orange-500/10 text-orange-500'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-foreground/60 mt-1">{activity.description}</p>
                </div>
                <span className="text-xs text-foreground/40 whitespace-nowrap">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-border rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Learning Summary</h3>
            <p className="text-foreground/60">
              You've acquired <span className="font-bold text-foreground">{stats?.skills_count || 0} skills</span> and
              invested <span className="font-bold text-foreground">{stats?.learning_hours || 0} hours</span> in learning.
              Keep up the great work! 🎉
            </p>
          </div>
          <Award className="w-16 h-16 text-primary opacity-20" />
        </div>
      </div>
    </div>
  );
}
