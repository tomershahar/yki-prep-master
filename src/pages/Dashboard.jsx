import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/entities/User";
import { PracticeSession } from "@/entities/PracticeSession";
import { Achievement } from "@/entities/Achievement";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Target, Flame, Trophy, Loader2, BookOpen, Headphones, Mic, PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

// Import components with error boundaries
import { useUserJourney } from "../components/dashboard/UserJourneyHook";
import KpiCard from "../components/dashboard/KpiCard";
import ErrorBoundary from "../components/dashboard/ErrorBoundary";
import { SafeRender, safeText, safeNumber } from "../components/dashboard/SafeRender";
import { UserVisit } from "@/entities/UserVisit";
import TestTypeSwitcher from "../components/dashboard/TestTypeSwitcher";
import { TestConfiguration } from "@/entities/TestConfiguration";
import ReadinessWidget from "../components/dashboard/ReadinessWidget";


const difficultyLevels = ["A1", "A2", "B1", "B2"];

// Helper component for the Hero Section
const HeroBanner = ({ user, testConfig }) => {
  const userName = safeText(user.full_name, 'User').split(' ')[0];
  const testName = testConfig?.display_name || 'YKI Test';
  const languageMap = {
    'finnish': 'Finnish',
    'swedish': 'Swedish',
    'danish': 'Danish'
  };
  const targetLanguage = languageMap[user.test_language] || 'Finnish';
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-xl text-blue-100">
          Continue your {targetLanguage} {testName} preparation journey
        </p>
      </div>
    </div>
  );
};

// Helper component for Quick Actions
const PracticeButton = ({ section, onClick }) => {
  const Icon = section.icon;
  return (
    <Card 
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${section.color}`} 
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-center space-x-4">
        <div className="p-3 rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">{section.title}</h3>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [sectionProgress, setSectionProgress] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [testConfig, setTestConfig] = useState(null);
  const navigate = useNavigate();

  // Check if welcome banner should be shown
  useEffect(() => {
    const hasSeenBanner = localStorage.getItem('has_seen_speech_listening_fix_banner');
    if (!hasSeenBanner) {
      setShowWelcomeBanner(true);
    }
  }, []);

  const dismissWelcomeBanner = () => {
    localStorage.setItem('has_seen_speech_listening_fix_banner', 'true');
    setShowWelcomeBanner(false);
  };

  const journeyData = useUserJourney(user);

  const kpis = useMemo(() => ({
    totalHours: Object.values(sectionProgress).reduce((sum, section) => sum + (section.totalHours || 0), 0),
    streak: currentStreak || 0,
    currentGoal: (user?.daily_goal_minutes) || 30,
    minutesToday: minutesToday || 0,
    totalAchievements: (user?.achievements?.length) || 0
  }), [sectionProgress, currentStreak, user?.daily_goal_minutes, minutesToday, user?.achievements?.length]);

  const calculateSectionProgress = useCallback((sessions, currentUser) => {
    const sections = ['reading', 'listening', 'speaking', 'writing'];
    const progress = {};
    
    sections.forEach(section => {
      const sectionSessions = sessions.filter(s => s.exam_section === section);
      const totalHours = sectionSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;
      const passedSessions = sectionSessions.filter(s => s.score >= 75);
      
      const recentSessions = sectionSessions.filter(s => {
        const sessionDate = new Date(s.created_date);
        const now = new Date();
        
        const currentDay = now.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        const mondayOfThisWeek = new Date(now);
        mondayOfThisWeek.setDate(now.getDate() - daysFromMonday);
        mondayOfThisWeek.setHours(0, 0, 0, 0);
        
        return sessionDate >= mondayOfThisWeek;
      });
      
      const userLevel = currentUser[`${section}_level`] || 'A1';
      const countKey = `${section}_${userLevel}`;
      const completionCounts = currentUser.practice_completion_counts || {};
      const completedPractices = completionCounts[countKey] || 0;
      
      progress[section] = {
        totalHours: totalHours,
        passedSessions: passedSessions.length,
        recentActivity: recentSessions.length,
        currentLevel: userLevel,
        completedPractices: completedPractices,
        progressToNext: (completedPractices % 10) * 10
      };
    });
    
    setSectionProgress(progress);
  }, [setSectionProgress]); // setSectionProgress is a stable setter

  const calculateStreak = useCallback((sessions) => {
    if (!sessions || sessions.length === 0) {
      setCurrentStreak(0);
      return;
    }
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const sessionDates = sessions
      .map(s => {
        const date = new Date(s.created_date);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      })
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort((a, b) => b - a);
    
    let streak = 0;
    let expectedDate = todayStart.getTime();
    
    if (sessionDates.length > 0 && sessionDates[0] !== expectedDate) {
      expectedDate -= 24 * 60 * 60 * 1000;
    }
    
    for (const sessionDate of sessionDates) {
      if (sessionDate === expectedDate) {
        streak++;
        expectedDate -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }
    
    setCurrentStreak(streak);
  }, [setCurrentStreak]); // setCurrentStreak is a stable setter

  const calculateMinutesToday = useCallback((sessions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.created_date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    const totalMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    setMinutesToday(totalMinutes);
  }, [setMinutesToday]); // setMinutesToday is a stable setter

  const trackUserVisit = useCallback(async (currentUser) => {
    const lastTrackTime = localStorage.getItem('last_visit_track');
    const now = Date.now();
    
    if (lastTrackTime && (now - parseInt(lastTrackTime, 10)) < 14400000) { // 4 hours in milliseconds
      console.log('Visit tracking skipped - recent visit already tracked');
      return;
    }
    
    try {
      console.log('Tracking user visit on the frontend...');
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayVisits = await UserVisit.filter({
          created_by: currentUser.email,
          timestamp: { "$gte": todayStart.toISOString() }
      }, '-timestamp', 1);

      if (todayVisits.length > 0) {
          console.log('Visit already recorded for today, skipping.');
          localStorage.setItem('last_visit_track', now.toString());
          return;
      }
      
      const priorVisits = await UserVisit.filter({
          created_by: currentUser.email,
          timestamp: { "$lt": todayStart.toISOString() }
      }, '-timestamp', 1);
      
      const isReturning = priorVisits.length > 0;
      
      await UserVisit.create({
          user_id: currentUser.id,
          timestamp: new Date().toISOString(),
          returning: isReturning
      });
      
      console.log(`Visit tracked successfully. Returning: ${isReturning}`);
      localStorage.setItem('last_visit_track', now.toString());

    } catch (error) {
      console.error('Failed to track visit on frontend:', error);
    }
  }, []); // No external dependencies that change across renders, localStorage is stable.

  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    try {
      const currentUser = await User.me();
      
      if (!currentUser) {
        throw new Error('No user found');
      }
      
      // Only check redirects on initial load
      if (isInitialLoad) {
        if (!currentUser.has_agreed_to_beta_terms) {
          navigate(createPageUrl("BetaDisclaimer"));
          return;
        }
        
        if (!currentUser.has_completed_onboarding) {
          navigate(createPageUrl("Onboarding"));
          return;
        }
      }

      setUser(currentUser);
      
      // Load test configuration
      const configs = await TestConfiguration.filter({
        country_code: currentUser.target_country || 'FI',
        test_name: currentUser.target_test || 'YKI',
        is_active: true
      });
      if (configs && configs.length > 0) {
        setTestConfig(configs[0]);
      }
      
      const sessions = await PracticeSession.filter(
        { created_by: currentUser.email },
        '-created_date',
        365
      );
      setRecentSessions(sessions || []);
      
      // Only fetch achievements on initial load
      if (isInitialLoad) {
        const allAchievements = await Achievement.list();
        setAchievements(allAchievements || []);
      }
      
      calculateSectionProgress(sessions || [], currentUser);
      calculateStreak(sessions || []);
      calculateMinutesToday(sessions || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      if (isInitialLoad) {
        setError('Failed to load dashboard data: ' + err.message);
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [
    navigate, 
    setUser, 
    setRecentSessions, 
    setAchievements, 
    setError, 
    setIsLoading,
    calculateSectionProgress, 
    calculateStreak, 
    calculateMinutesToday
  ]);

  const loadDashboardData = useCallback(() => fetchDashboardData(true), [fetchDashboardData]);
  const refreshDashboard = useCallback(() => fetchDashboardData(false), [fetchDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]); // loadDashboardData is now stable due to useCallback

  useEffect(() => {
    const trackVisitDelayed = setTimeout(() => {
      if (user) {
        trackUserVisit(user);
      }
    }, 2000);

    return () => clearTimeout(trackVisitDelayed);
  }, [user, trackUserVisit]); // trackUserVisit is now stable due to useCallback

  useEffect(() => {
    const handleStorageChange = () => {
      if (localStorage.getItem('dashboard_refresh_needed')) {
        localStorage.removeItem('dashboard_refresh_needed');
        refreshDashboard();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshDashboard]); // refreshDashboard is now stable due to useCallback

  // ALL USEMEMO HOOKS MUST BE BEFORE EARLY RETURNS
  // Get recent achievements (only earned ones) - Memoized
  const recentEarnedAchievements = useMemo(() => {
    const userAchievements = user?.achievements || [];
    return achievements
      .filter(ach => userAchievements.includes(ach.id))
      .slice(0, 2);
  }, [achievements, user?.achievements]);

  // Get next milestone achievements (not yet earned) - Memoized
  const nextMilestones = useMemo(() => {
    const userAchievements = user?.achievements || [];
    return achievements
      .filter(ach => !userAchievements.includes(ach.id))
      .sort((a, b) => a.requirement - b.requirement)
      .slice(0, 1);
  }, [achievements, user?.achievements]);

  // Calculate daily progress for last 7 days - FIXED FOR MONDAY START - Memoized
  const weeklyData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Use local timezone consistently
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

      const dayMinutes = recentSessions
        .filter(s => {
          if (!s.created_date) return false;
          const sessionDate = new Date(s.created_date);
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        })
        .reduce((sum, s) => sum + safeNumber(s.duration_minutes, 0), 0);
      
      days.push({
        // FIXED: Use Finnish locale with Monday as first day of week
        date: date.toLocaleDateString('fi-FI', { weekday: 'short' }),
        minutes: dayMinutes,
      });
    }
    
    return days;
  }, [recentSessions]);

  // Set a minimum max of 60 minutes for a better visual scale, otherwise use the max from the data
  const maxMinutes = useMemo(() => Math.max(...weeklyData.map(d => d.minutes), 60), [weeklyData]);



  const formatTime = (hours) => {
    if (!hours || isNaN(hours)) return "0m";
    const numericHours = parseFloat(hours);
    if (isNaN(numericHours)) return "0m";
    const wholeHours = Math.floor(numericHours);
    const minutes = Math.round((numericHours - wholeHours) * 60);
    if (wholeHours === 0 && minutes === 0) return "0m";
    if (wholeHours === 0) return `${minutes}m`;
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  };

  const getMotivationalMessage = useCallback(() => {
    if (!journeyData) return null;
    const { isFirstTimeUser, hasSession, totalSessions, preferredSection } = journeyData;
    const testName = testConfig?.test_name || 'YKI';
    
    if (isFirstTimeUser) {
      return {
        title: `Welcome to your ${testName} journey! 🎯`,
        message: "Start with a quick practice session to get familiar with the exam format.",
        action: "Start Your First Practice",
        actionUrl: createPageUrl("Practice")
      };
    }
    
    if (currentStreak >= 7) {
      return {
        title: `Amazing ${currentStreak}-day streak! 🔥`,
        message: "You're building excellent study habits. Keep up the momentum!",
        action: "Continue Your Streak",
        actionUrl: createPageUrl("Practice")
      };
    }
    
    if (totalSessions >= 10) {
      return {
        title: "You're making great progress! 📚",
        message: `You've completed ${totalSessions} practice sessions. Ready for a full ${testName} exam simulation?`,
        action: "Try Full Exam",
        actionUrl: createPageUrl("FullExam")
      };
    }

    // Smart recommendation based on weakest section
    if (preferredSection) {
      const otherSections = ['reading', 'listening', 'speaking', 'writing'].filter(s => s !== preferredSection);
      const weakestSection = otherSections.length > 0 ? otherSections[0] : 'reading'; 
      return {
        title: `Continue building your skills! 💪`,
        message: `You've been practicing ${preferredSection}. Consider trying ${weakestSection.charAt(0).toUpperCase() + weakestSection.slice(1)} to balance your skills.`,
        action: `Practice ${weakestSection.charAt(0).toUpperCase() + weakestSection.slice(1)}`,
        actionUrl: createPageUrl(`Practice?start=${weakestSection}`)
      };
    }
    
    return {
      title: "Ready to practice today? 💪",
      message: `Consistent practice is the key to ${testName} success. Let's continue learning!`,
      action: "Continue Practice",
      actionUrl: createPageUrl("Practice")
    };
  }, [journeyData, testConfig?.test_name, currentStreak]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600 mt-2">{String(error)}</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No user state
  if (!user) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No User Found</h2>
          <p className="text-gray-600 mt-2">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Get practice sections with enhanced info
  const practiceSections = [
    { 
      id: 'reading', 
      title: 'Reading', 
      icon: BookOpen, 
      color: 'from-amber-400 to-orange-500',
      description: 'Text comprehension & analysis',
      questions: '4-6 questions',
      duration: '10-15 min'
    },
    { 
      id: 'listening', 
      title: 'Listening', 
      icon: Headphones, 
      color: 'from-blue-400 to-cyan-500',
      description: 'Audio comprehension',
      questions: '4-6 questions',
      duration: '10-15 min'
    },
    { 
      id: 'speaking', 
      title: 'Speaking', 
      icon: Mic, 
      color: 'from-green-400 to-emerald-500',
      description: 'Oral communication',
      questions: '2-3 tasks',
      duration: '15-20 min'
    },
    { 
      id: 'writing', 
      title: 'Writing', 
      icon: PenTool, 
      color: 'from-purple-400 to-pink-500',
      description: 'Written expression',
      questions: '1-2 tasks',
      duration: '20-25 min'
    }
  ];

  return (
    <ErrorBoundary>
      <SafeRender>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Welcome Banner - Speech & Listening Fix */}
            {showWelcomeBanner && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500 rounded-full">
                      <Headphones className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900 mb-2">
                        🎉 Great News! Speech & Listening Features Are Now Fixed
                      </h3>
                      <p className="text-green-800 mb-3">
                        We've resolved the issues with audio playback and speech recognition. You can now practice listening comprehension and speaking exercises without interruptions. Enjoy your improved learning experience!
                      </p>
                      <Button 
                        onClick={dismissWelcomeBanner}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Got it, thanks!
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notice */}
            {user.role === 'admin' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4" role="alert">
                <p className="font-bold">Admin View</p>
                <p>You are viewing the dashboard as an administrator. You have access to additional management tools in the sidebar.</p>
              </div>
            )}

            {/* Hero Section */}
            <HeroBanner user={user} testConfig={testConfig} />
            
            {/* Test Type Switcher */}
            <TestTypeSwitcher currentUser={user} onTestChange={(config) => setTestConfig(config)} />
            
            {/* Readiness Widget */}
            <ErrorBoundary>
              <ReadinessWidget user={user} />
            </ErrorBoundary>
            
            {/* Quick Actions Section */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PracticeButton 
                    section={{ id: 'reading', title: 'Reading Practice', icon: BookOpen, color: 'from-amber-400 to-orange-500' }}
                    onClick={() => window.location.href = createPageUrl('Practice') + '?start=reading'}
                />
                <PracticeButton 
                    section={{ id: 'listening', title: 'Listening Practice', icon: Headphones, color: 'from-blue-400 to-cyan-500' }}
                    onClick={() => window.location.href = createPageUrl('Practice') + '?start=listening'}
                />
                <PracticeButton 
                    section={{ id: 'speaking', title: 'Speaking Practice', icon: Mic, color: 'from-green-400 to-emerald-500' }}
                    onClick={() => window.location.href = createPageUrl('Practice') + '?start=speaking'}
                />
                <PracticeButton 
                    section={{ id: 'writing', title: 'Writing Practice', icon: PenTool, color: 'from-purple-400 to-pink-500' }}
                    onClick={() => window.location.href = createPageUrl('Practice') + '?start=writing'}
                />
            </div>

            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <ErrorBoundary>
                <KpiCard
                  title="Total Hours"
                  value={formatTime(kpis.totalHours)}
                  subtitle="Time invested in learning"
                  icon={Clock}
                  color="blue"
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <KpiCard
                  title="Current Streak"
                  value={`${kpis.streak} days`}
                  subtitle="Consecutive practice days"
                  icon={Flame}
                  color="amber"
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <KpiCard
                  title="Today's Progress"
                  value={`${kpis.minutesToday}/${kpis.currentGoal}m`}
                  subtitle="Minutes practiced today"
                  icon={Target}
                  color="green"
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <KpiCard
                  title="Achievements"
                  value={kpis.totalAchievements}
                  subtitle="Milestones unlocked"
                  icon={Trophy}
                  color="purple"
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {Math.round((kpis.minutesToday / kpis.currentGoal) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600 mb-3">Daily Goal</div>
                      <Progress 
                        value={Math.min((kpis.minutesToday / kpis.currentGoal) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </div>



            {/* Practice Sections and Progress */}
            <div className="grid md:grid-cols-2 gap-6">
              <ErrorBoundary>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Progress by Section</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {practiceSections.map((section) => {
                      const progress = sectionProgress[section.id] || {};
                      const Icon = section.icon;
                      
                      return (
                        <div key={section.id} className="group">
                          <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{section.title}</h4>
                                <Badge variant="outline">{progress.currentLevel || 'A1'}</Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Practice Progress</span>
                                  <span>{progress.completedPractices || 0}/10</span>
                                </div>
                                <Progress value={progress.progressToNext || 0} className="h-2" />
                              </div>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Time: {formatTime(progress.totalHours)}</span>
                                <span>Passed: {progress.passedSessions || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Practice CTA */}
                          <div className="mt-2 px-4">
                            <Link to={createPageUrl(`Practice?start=${section.id}`)}>
                              <Button 
                                size="sm" 
                                className={`w-full bg-gradient-to-r ${section.color} hover:opacity-90 text-white`}
                              >
                                Practice {section.title}
                              </Button>
                            </Link>
                          </div>
                          
                          {/* Hover details */}
                          <div className="hidden group-hover:block mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{section.description}</span>
                              <div className="flex gap-3 text-xs text-gray-500">
                                <span>{section.questions}</span>
                                <span>{section.duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </ErrorBoundary>

              {/* Achievements and Weekly Chart */}
              <div className="space-y-6">
                {/* Weekly Activity Chart */}
                <ErrorBoundary>
                  <Card>
                    <CardHeader>
                      <CardTitle>This Week's Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 h-24">
                        {weeklyData.map((day, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center group relative">
                            <div className="absolute -top-6 hidden group-hover:block px-2 py-1 bg-gray-700 text-white text-xs rounded">
                              {day.minutes} min
                            </div>
                            <div 
                              className="w-full bg-blue-500 rounded-t-sm transition-all duration-500 hover:bg-blue-600"
                              style={{ 
                                height: `${(day.minutes / maxMinutes) * 100}%`,
                                minHeight: day.minutes > 0 ? '2px' : '0px'
                              }}
                            />
                            <span className="text-xs text-gray-500 mt-1">{day.date}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Minutes practiced per day
                      </div>
                    </CardContent>
                  </Card>
                </ErrorBoundary>

                {/* Condensed Achievements */}
                <ErrorBoundary>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Recent Earned Achievements */}
                        {recentEarnedAchievements.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-600 mb-2">Recently Earned</h4>
                            <div className="space-y-2">
                              {recentEarnedAchievements.map((achievement) => (
                                <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                                  <Trophy className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium">{safeText(achievement.title)}</p>
                                    <p className="text-xs text-gray-600">{achievement.points} points</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Next Milestone */}
                        {nextMilestones.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Next Milestone</h4>
                            {nextMilestones.map((achievement) => (
                              <div key={achievement.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                <Trophy className="w-4 h-4 text-gray-400" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{safeText(achievement.title)}</p>
                                  <p className="text-xs text-gray-600">{achievement.requirement} requirement</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Link to={createPageUrl("Achievements")}>
                          <Button variant="outline" className="w-full mt-4">
                            View All Achievements
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </SafeRender>
    </ErrorBoundary>
  );
}