import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { getAnalytics } from "@/functions/getAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, BarChart3, Users, Clock, Target } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import KpiCard from "../components/dashboard/KpiCard";
import AnalyticsCharts from "../components/analytics/AnalyticsCharts";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAccessLoading, setIsAccessLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        if (currentUser.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "This page is for administrators only.",
            variant: "destructive",
            duration: 5000,
          });
          navigate(createPageUrl("Dashboard"));
          return;
        }

        // Automatically load analytics data
        loadAnalyticsData();
      } catch (error) {
        console.error("Error checking access:", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsAccessLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  const loadAnalyticsData = async () => {
    setIsLoadingAnalytics(true);
    setError(null);
    try {
      console.log("Fetching analytics data...");
      const { data } = await getAnalytics();
      console.log("Analytics data received:", data);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(`Failed to load analytics: ${error.message}`);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  if (isAccessLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Alert variant="destructive" className="w-fit">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Access denied.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive insights into user engagement and app performance</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoadingAnalytics ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Loading Analytics...</p>
            <p className="text-gray-500">Analyzing user data and engagement patterns</p>
          </div>
        </div>
      ) : analyticsData ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Total Users"
              value={analyticsData.kpis?.uniqueUsers || 0}
              subtitle="Unique active users"
              icon={Users}
              color="blue"
            />
            <KpiCard
              title="Daily Active"
              value={analyticsData.kpis?.dailyActiveUsers || 0}
              subtitle="Users active today"
              icon={Target}
              color="green"
            />
            <KpiCard
              title="Weekly Active"
              value={analyticsData.kpis?.weeklyActiveUsers || 0}
              subtitle="Users active this week"
              icon={Clock}
              color="amber"
            />
            <KpiCard
              title="Total Sessions"
              value={analyticsData.kpis?.totalPracticeSessions || 0}
              subtitle="Practice sessions completed"
              icon={BarChart3}
              color="purple"
            />
          </div>

          {/* Charts Section */}
          <AnalyticsCharts 
            chartData={analyticsData.chartData}
            moduleStats={analyticsData.moduleStats}
            recentActivity={analyticsData.recentActivity}
          />
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
            <p className="text-gray-500 mb-4">Click the button below to load your analytics data</p>
            <button 
              onClick={loadAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Load Analytics
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}