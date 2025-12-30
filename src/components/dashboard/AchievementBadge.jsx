import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Flame, BookOpen, Award, CheckCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SafeRender, safeText, safeNumber } from "./SafeRender";
import ErrorBoundary from "./ErrorBoundary";

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  book: BookOpen,
  award: Award
};

export default function AchievementBadge({ achievement, earned = false, userProgress = null }) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!achievement) {
    return null;
  }

  const Icon = iconMap[achievement.icon] || Trophy;
  const title = safeText(achievement.title, 'Achievement');
  const description = safeText(achievement.description, 'Complete this achievement');
  const points = safeNumber(achievement.points, 0);
  const requirement = safeNumber(achievement.requirement, 1);
  const category = safeText(achievement.category, 'general');
  
  const getRequirementText = () => {
    if (earned) return 'Unlocked!';
    
    switch(category) {
      case 'completion':
        return `Complete ${requirement} sessions`;
      case 'streak':
        return `Reach a ${requirement}-day streak`;
      case 'hours':
        return `Practice for ${requirement} hours`;
      case 'reading':
      case 'listening':
      case 'speaking':
      case 'writing':
        return `Pass ${requirement} ${category} practice(s)`;
      case 'milestone':
        return `Achieve milestone`;
      default:
        return 'Keep practicing!';
    }
  };

  const getProgressPercentage = () => {
    if (earned || !userProgress) return 100;
    
    const current = safeNumber(userProgress.current, 0);
    const target = safeNumber(requirement, 1);
    
    return Math.min((current / target) * 100, 100);
  };

  return (
    <ErrorBoundary>
      <SafeRender>
        <div 
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 cursor-pointer
            ${earned 
              ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg ring-2 ring-amber-200' 
              : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80'
            }
          `}
          onClick={() => setShowDetails(true)}
          role="button"
          tabIndex={0}
          aria-label={`${title} achievement. ${earned ? 'Earned' : 'Not earned yet'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`
              p-3 rounded-xl transition-all duration-300
              ${earned 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' 
                : 'bg-gray-300 text-gray-500'
              }
            `}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className={`font-bold text-sm ${earned ? 'text-gray-900' : 'text-gray-600'}`}>
                  {title}
                </h3>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  {earned && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600 font-bold">EARNED</span>
                    </div>
                  )}
                </div>
              </div>
              <p className={`text-xs mt-1 ${earned ? 'text-gray-700' : 'text-gray-500'}`}>
                {description}
              </p>
              
              {!earned && userProgress && (
                <div className="mt-2">
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {safeNumber(userProgress.current, 0)} / {requirement}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <Badge variant={earned ? "default" : "outline"} className={`text-xs ${earned ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}`}>
                  {points} pts
                </Badge>
                {!earned && (
                  <span className="text-xs text-gray-500 font-medium">
                    {getRequirementText()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {earned && (
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
          )}
        </div>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {title}
                {earned && <CheckCircle className="w-5 h-5 text-green-600" />}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={earned ? "default" : "outline"} className={earned ? 'bg-amber-100 text-amber-800' : ''}>
                  {points} points
                </Badge>
                <Badge variant="outline">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700">
                {description}
              </p>
              
              {!earned && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-500">
                      {safeNumber(userProgress?.current, 0)} / {requirement}
                    </span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {getRequirementText()}
                  </p>
                </div>
              )}
              
              {earned && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium">🎉 Achievement Unlocked!</p>
                  <p className="text-xs text-green-700 mt-1">
                    You've earned {points} points for completing this milestone.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SafeRender>
    </ErrorBoundary>
  );
}