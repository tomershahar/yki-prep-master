import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, UserCheck, Activity, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsKPIs({ kpis, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No KPI data available
          </CardContent>
        </Card>
      </div>
    );
  }

  const TrendIndicator = ({ trend }) => {
    if (!trend || trend === 0) return null;
    const isPositive = trend > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(trend)}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{kpis.totalVisits}</div>
            <TrendIndicator trend={kpis.visitsTrend} />
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.newVisits} new visits, {kpis.returningVisits} returning visits
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{kpis.uniqueUsers}</div>
            <TrendIndicator trend={kpis.usersTrend} />
          </div>
          <p className="text-xs text-muted-foreground">
            Active in last 30 days
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Practice Sessions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{kpis.totalPracticeSessions}</div>
            <TrendIndicator trend={kpis.sessionsTrend} />
          </div>
          <p className="text-xs text-muted-foreground">
            avg {kpis.avgSessionsPerUser} sessions/user
          </p>
        </CardContent>
      </Card>
    </div>
  );
}