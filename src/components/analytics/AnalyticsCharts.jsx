import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// Individual chart components remain the same
export function VisitsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Daily Visits (Last 7 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No visit data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Daily Visits (Last 7 Days)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="new" stackId="a" fill="#8884d8" name="New Visits" />
            <Bar dataKey="returning" stackId="a" fill="#82ca9d" name="Returning Visits" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EngagementDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Average Daily Engagement</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            No engagement data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Daily Engagement Time (Last 10 Days)</CardTitle>
        <p className="text-sm text-gray-600">
          Average minutes spent practicing per day by active users
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Average Minutes', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [`${value} min`, 'Avg Time']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar dataKey="averageMinutes" fill="#3b82f6" name="averageMinutes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TimeSpentChart({ data, moduleStats }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Time Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No time data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Total Time Spent by Module</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="module" />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} minutes`, "Total Time"]} />
            <Bar dataKey="totalMinutes" fill="#8884d8" name="Total Time" />
          </BarChart>
        </ResponsiveContainer>
        
        {moduleStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(moduleStats).map(([module, stats]) => (
              <div key={module} className="text-center p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold capitalize">{module}</h4>
                <p className="text-2xl font-bold text-blue-600">{stats.totalMinutes} min</p>
                <p className="text-xs text-gray-600">{stats.totalSessions} sessions</p>
                <p className="text-xs text-gray-500">{stats.avgPerSession} min/session</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivity({ data }) {
    if (!data || data.length === 0) {
        return (
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No recent user activity found.
              </div>
            </CardContent>
          </Card>
        );
    }

    return (
        <Card>
            <CardHeader><CardTitle>Recent User Activity</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map(activity => (
                        <div key={activity.id} className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{activity.user_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{activity.user_name}</p>
                                <p className="text-sm text-gray-500">
                                    {activity.returning ? 'Returned to the app' : 'Visited for the first time'}
                                </p>
                            </div>
                            <div className="ml-auto text-sm text-gray-500">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ** THE FIX: Create a default export that renders all the charts **
export default function AnalyticsCharts({ chartData, moduleStats, recentActivity }) {
    if (!chartData) {
        return (
          <div className="text-center py-10">
            <p className="text-gray-500">Waiting for chart data...</p>
          </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VisitsChart data={chartData.visitsChart} />
                <EngagementDistributionChart data={chartData.engagementDistribution} />
            </div>
            <TimeSpentChart data={chartData.timeSpent} moduleStats={moduleStats} />
            <RecentActivity data={recentActivity} />
        </div>
    );
}

// Other exported chart functions are kept below for modularity, no changes needed for them.
// ... (VisitsChart, EngagementDistributionChart, etc. code is unchanged)