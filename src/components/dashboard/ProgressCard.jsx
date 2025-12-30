
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProgressCard({ 
  title, 
  skillLevel, 
  practiceCount,
  examCount,
  practiceHours = 0,
  examHours = 0,
  totalHours = 0,
  icon: Icon,
  color = "amber",
  sectionId
}) {
  const colorClasses = {
    amber: "from-amber-400 to-orange-500",
    blue: "from-blue-400 to-cyan-500",
    green: "from-green-400 to-emerald-500",
    purple: "from-purple-400 to-pink-500"
  };

  const formatTime = (hours) => {
    if (!hours || hours === 0) return "0m";
    
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

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full transform translate-x-12 -translate-y-12`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">{title}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                Level {skillLevel}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-600">Practice</span>
            <span className="font-bold text-gray-900">{practiceCount}</span>
            <span className="text-xs text-blue-600">{formatTime(practiceHours)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-600">Exams</span>
            <span className="font-bold text-gray-900">{examCount}</span>
            <span className="text-xs text-purple-600">{formatTime(examHours)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-600">Total Time</span>
          <span className="font-bold text-gray-900">{formatTime(totalHours)}</span>
        </div>

        <Link to={createPageUrl(`Practice?start=${sectionId}`)} className="block">
          <Button className={`w-full bg-gradient-to-r ${colorClasses[color]} hover:opacity-90 text-white shadow-lg mt-3`}>
            <Play className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
