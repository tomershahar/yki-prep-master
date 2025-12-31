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
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Theme colors - easily customizable
const CHART_COLORS = {
  primary: '#3b82f6',    // blue-500
  secondary: '#10b981',  // green-500
  tertiary: '#f59e0b',   // amber-500
  quaternary: '#ef4444'  // red-500
};

const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.quaternary];

// Utility to convert minutes to hours and minutes
const formatMinutes = (minutes) => {
  if (!minutes || minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Utility to fill missing dates with zero values
const fillMissingDates = (data, days = 7) => {
  if (!data || data.length === 0) return [];
  
  const filledData = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    const existingData = data.find(d => d.date === dateKey);
    filledData.push(existingData || { date: dateKey, new: 0, returning: 0 });
  }
  
  return filledData;
};

// Safe date formatter to handle invalid dates
const safeFormatDate = (dateStr, formatStr) => {
  try {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return original if invalid
    return format(date, formatStr);
  } catch (error) {
    console.warn('Invalid date format:', dateStr);
    return dateStr;
  }
};

export function VisitsChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Daily Visits (Last 7 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Fill missing dates with zeros
  const filledData = fillMissingDates(data, 7);

  return (
    <Card>
      <CardHeader><CardTitle>Daily Visits (Last 7 Days)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" aspect={2}>
          <BarChart data={filledData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => safeFormatDate(str, 'dd.MM')}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => safeFormatDate(label, 'dd MMM yyyy')}
            />
            <Bar dataKey="new" stackId="a" fill={CHART_COLORS.primary} name="New Visits" />
            <Bar dataKey="returning" stackId="a" fill={CHART_COLORS.secondary} name="Returning Visits" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EngagementDistributionChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Average Daily Engagement</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <ResponsiveContainer width="100%" aspect={2}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              tickFormatter={(str) => format(new Date(str), 'dd.MM')}
            />
            <YAxis 
              label={{ value: 'Average Time', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [formatMinutes(value), 'Avg. Practice Time']}
              labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
            />
            <Bar dataKey="averageMinutes" fill={CHART_COLORS.primary} name="averageMinutes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TimeSpentChart({ data, moduleStats, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Time Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <ResponsiveContainer width="100%" aspect={2}>
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="module" />
            <YAxis label={{ value: 'Time', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [formatMinutes(value), "Total Time"]} />
            <Bar dataKey="totalMinutes" fill={CHART_COLORS.primary} name="Total Time" />
          </BarChart>
        </ResponsiveContainer>
        
        {moduleStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(moduleStats).map(([module, stats]) => (
              <div key={module} className="text-center p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold capitalize">{module}</h4>
                <p className="text-2xl font-bold text-blue-600">{formatMinutes(stats.totalMinutes)}</p>
                <p className="text-xs text-gray-600">{stats.totalSessions} sessions</p>
                <p className="text-xs text-gray-500">{formatMinutes(stats.avgPerSession)}/session</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivity({ data, isLoading }) {
    if (isLoading) {
        return (
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        );
    }

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

export default function AnalyticsCharts({ 
    chartData, 
    moduleStats, 
    recentActivity, 
    isLoading = false,
    loadingStates = {}
}) {
    // Individual loading states for each chart
    const {
        visitsLoading = isLoading,
        engagementLoading = isLoading,
        timeSpentLoading = isLoading,
        activityLoading = isLoading
    } = loadingStates;
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VisitsChart 
                    data={chartData?.visitsChart || []} 
                    isLoading={visitsLoading}
                />
                <EngagementDistributionChart 
                    data={chartData?.engagementDistribution || []} 
                    isLoading={engagementLoading}
                />
            </div>
            <TimeSpentChart 
                data={chartData?.timeSpent || []} 
                moduleStats={moduleStats} 
                isLoading={timeSpentLoading}
            />
            <RecentActivity 
                data={recentActivity || []} 
                isLoading={activityLoading}
            />
        </div>
    );
}