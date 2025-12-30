import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, Flame, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickStats({ totalHours, streak, currentGoal, minutesToday, totalAchievements }) {
  const formatTime = (hours) => {
    if (!hours) return "0m";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  };
  
  // Ensure we have valid numbers for calculation
  const safeCurrentGoal = Number(currentGoal) || 30;
  const safeMinutesToday = Number(minutesToday) || 0;
  const dailyProgress = Math.min((safeMinutesToday / safeCurrentGoal) * 100, 100);

  console.log('QuickStats debug:', { 
    currentGoal: safeCurrentGoal, 
    minutesToday: safeMinutesToday, 
    dailyProgress 
  }); // Debug log

  const stats = [
    {
      label: "Total Hours",
      value: formatTime(totalHours),
      icon: Clock,
      color: "text-blue-600"
    },
    {
      label: "Day Streak",
      value: streak || 0,
      icon: Flame,
      color: "text-orange-600"
    },
    {
      label: "Daily Goal",
      value: `${safeMinutesToday}/${safeCurrentGoal} min`,
      icon: Target,
      color: "text-green-600",
      progress: dailyProgress
    },
    {
      label: "Achievements",
      value: totalAchievements || 0,
      icon: Trophy,
      color: "text-amber-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        if (stat.label === "Achievements" && stat.value === 0) {
          return (
            <Link to={createPageUrl("Achievements")} key={stat.label} className="block h-full">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">View Achievements</p>
                      <p className="text-xs text-gray-600 flex items-center">
                        Start your journey <ArrowRight className="w-3 h-3 ml-1" />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        }

        return (
          <Card key={stat.label} className="border-0 shadow-md bg-white/80 backdrop-blur-sm h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              </div>
              {stat.progress !== undefined && (
                <div className="mt-3">
                  <Progress value={stat.progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(stat.progress)}% of daily goal
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}