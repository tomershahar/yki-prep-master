
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Achievement } from "@/entities/Achievement";
import AchievementBadge from "../components/dashboard/AchievementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, BookOpen, Star, Award, CheckCircle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Imported Badge component

const categoryDetails = {
  milestone: { name: "Milestones", icon: Star },
  streak: { name: "Streaks", icon: Flame },
  completion: { name: "Completion", icon: Target },
  reading: { name: "Reading Mastery", icon: BookOpen },
  listening: { name: "Listening Mastery", icon: Award },
  speaking: { name: "Speaking Mastery", icon: Award },
  writing: { name: "Writing Mastery", icon: Award },
};

export default function AchievementsPage() {
  const [user, setUser] = useState(null);
  const [allAchievements, setAllAchievements] = useState([]);
  const [groupedAchievements, setGroupedAchievements] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      const [currentUser, achievements] = await Promise.all([
        User.me(),
        Achievement.list(),
      ]);
      
      setUser(currentUser);
      setAllAchievements(achievements);
      groupAchievements(achievements);
    } catch (error) {
      console.error("Error loading achievements data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupAchievements = (achievements) => {
    const groups = {
      milestone: [],
      streak: [],
      completion: [],
      reading: [],
      listening: [],
      speaking: [],
      writing: [],
    };

    achievements.forEach(ach => {
      // Ensure achievement.category exists before pushing
      // This also handles cases where an achievement might not fit predefined categories perfectly
      if (ach.title.includes("Reading")) {
        groups.reading.push(ach);
      } else if (ach.title.includes("Listening")) {
        groups.listening.push(ach);
      } else if (ach.title.includes("Speaking")) {
        groups.speaking.push(ach);
      } else if (ach.title.includes("Writing")) {
        groups.writing.push(ach);
      } else if (groups[ach.category]) { // Check if category exists in our defined groups
        groups[ach.category].push(ach);
      } else {
        // Fallback or log if a category is unexpected
        console.warn(`Achievement with unknown category '${ach.category}' or specific title pattern:`, ach);
      }
    });

    setGroupedAchievements(groups);
  };
  
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-80 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate earned achievements and total points
  const earnedAchievements = allAchievements.filter(ach => user?.achievements?.includes(ach.id));
  const totalPoints = earnedAchievements.reduce((sum, ach) => sum + (ach.points || 0), 0);

  // Re-define earnedCount and totalCount for clarity and consistency with new badges
  const earnedCount = earnedAchievements.length;
  const totalCount = allAchievements.length;

  const renderAchievementGrid = (achievements) => {
    const earned = achievements.filter(ach => user?.achievements?.includes(ach.id));
    const locked = achievements.filter(ach => !user?.achievements?.includes(ach.id));
    
    return (
      <div className="space-y-6">
        {earned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-green-800">Earned ({earned.length})</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {earned
                .sort((a, b) => a.requirement - b.requirement)
                .map(ach => (
                  <AchievementBadge
                    key={ach.id}
                    achievement={ach}
                    earned={true}
                  />
              ))}
            </div>
          </div>
        )}
        
        {locked.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-600">Locked ({locked.length})</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locked
                .sort((a, b) => a.requirement - b.requirement)
                .map(ach => (
                  <AchievementBadge
                    key={ach.id}
                    achievement={ach}
                    earned={false}
                  />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Track your progress and unlock achievements as you improve your language skills</p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="text-sm">Total Points: {totalPoints}</Badge>
          <Badge variant="outline" className="text-sm">{earnedAchievements.length}/{allAchievements.length} Unlocked</Badge>
        </div>
      </div>

      <Tabs defaultValue="all-earned" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all-earned" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Earned
          </TabsTrigger>
          {Object.entries(groupedAchievements).filter(([, achievements]) => achievements.length > 0).map(([key]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              {React.createElement(categoryDetails[key].icon, { className: "w-4 h-4" })}
              {categoryDetails[key].name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all-earned" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        Your Earned Achievements ({earnedCount})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {earnedCount > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allAchievements
                                .filter(ach => user?.achievements?.includes(ach.id))
                                .sort((a, b) => a.title.localeCompare(b.title))
                                .map(ach => (
                                    <AchievementBadge
                                        key={ach.id}
                                        achievement={ach}
                                        earned={true}
                                    />
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-8">You haven't earned any achievements yet. Keep practicing!</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {Object.entries(groupedAchievements).map(([key, achievements]) => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {React.createElement(categoryDetails[key].icon, { className: "w-6 h-6" })}
                  {categoryDetails[key].name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  renderAchievementGrid(achievements)
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No achievements in this category yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
