import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
};

const formatMinutes = (minutes) => {
  if (!minutes || minutes < 60) return `${Math.round(minutes || 0)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

function EmptyState({ title, height = 200 }) {
  return (
    <div className={`flex items-center justify-center text-gray-400 text-sm`} style={{ height }}>
      No data available yet
    </div>
  );
}

// Daily Visits: new vs returning users per day
function VisitsChart({ data, range, onRangeChange }) {
  if (!data || data.length === 0) return <EmptyState title="Daily Visits" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Daily Users</CardTitle>
          <p className="text-sm text-gray-500 mt-1">New vs returning users per day</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onRangeChange(7)} className={`px-3 py-1 rounded text-sm ${range === 7 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>7d</button>
          <button onClick={() => onRangeChange(30)} className={`px-3 py-1 rounded text-sm ${range === 30 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>30d</button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [value, name === 'new' ? 'New Users' : 'Returning Users']}
            />
            <Legend formatter={(v) => v === 'new' ? 'New Users' : 'Returning Users'} />
            <Bar dataKey="new" stackId="a" fill={COLORS.primary} name="new" radius={[0, 0, 0, 0]} />
            <Bar dataKey="returning" stackId="a" fill={COLORS.secondary} name="returning" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Daily active users (practice sessions)
function DailyActiveUsersChart({ data }) {
  if (!data || data.length === 0) return <EmptyState title="Daily Active Users" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Daily Active Learners</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Users completing practice sessions per day</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Active Learners']} />
            <Line type="monotone" dataKey="activeUsers" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} name="Active Learners" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Module time breakdown
function ModuleChart({ data, moduleStats }) {
  if (!data || data.length === 0) return <EmptyState title="Module Stats" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Practice by Module</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Total time spent in each section</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="module" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatMinutes(v), 'Total Time']} />
            <Bar dataKey="totalMinutes" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {moduleStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(moduleStats).map(([module, stats]) => (
              <div key={module} className="text-center p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold capitalize text-sm">{module}</h4>
                <p className="text-xl font-bold text-blue-600">{formatMinutes(stats.totalMinutes)}</p>
                <p className="text-xs text-gray-500">{stats.totalSessions} sessions</p>
                <p className="text-xs text-gray-400">{formatMinutes(stats.avgPerSession)}/session</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Score / difficulty distribution
function ScoreDistributionChart({ data }) {
  if (!data || data.every(d => d.count === 0)) return <EmptyState title="Score Distribution" />;

  const levelColors = { A1: COLORS.amber, A2: COLORS.secondary, B1: COLORS.primary, B2: COLORS.purple };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Sessions by Level</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Distribution of practice difficulty levels</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="level" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Sessions']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Sessions"
              fill={COLORS.primary}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Recent activity feed
function RecentActivity({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent><EmptyState title="" height={120} /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Recent Visits</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((activity, i) => (
            <div key={activity.id || i} className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{activity.user_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{activity.user_name}</p>
                <p className="text-xs text-gray-500 truncate">{activity.user_email}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={activity.returning ? "secondary" : "default"} className="text-xs mb-1">
                  {activity.returning ? 'Returning' : 'New'}
                </Badge>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsCharts({ chartData, moduleStats, recentActivity, topUsers }) {
  const [visitRange, setVisitRange] = useState(7);

  const visitsData = visitRange === 7
    ? (chartData?.visitsChart7Days || chartData?.visitsChart?.slice(-7) || [])
    : (chartData?.visitsChart || []);

  return (
    <div className="space-y-6">
      {/* Row 1: Visits + Daily Active Learners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisitsChart data={visitsData} range={visitRange} onRangeChange={setVisitRange} />
        <DailyActiveUsersChart data={chartData?.engagementDistribution || []} />
      </div>

      {/* Row 2: Module breakdown + Score distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleChart data={chartData?.timeSpent || []} moduleStats={moduleStats} />
        <ScoreDistributionChart data={chartData?.scoreDistribution || []} />
      </div>

      {/* Row 3: Recent activity + Top users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity data={recentActivity || []} />
        {topUsers && topUsers.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Most Active Users</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topUsers.map((u, i) => (
                  <div key={u.email} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{u.email?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="flex-1 text-sm truncate">{u.email}</p>
                    <Badge variant="outline">{u.sessions} sessions</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}