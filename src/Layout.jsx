import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  Home,
  BookOpen,
  BarChart3,
  Trophy,
  Settings,
  Languages,
  Database,
  Zap,
  Timer,
  MessageSquare, // Added Feedback icon
  Wand2, // Added Model Evaluation icon
  ClipboardList, // Added Changelog icon
  Library // Added Word Bank icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import FeedbackButton from "@/components/shared/FeedbackButton"; // Import the new component

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    updateSEOTags(currentPageName);
  }, [currentPageName]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Apply dark mode if user has it enabled
      if (currentUser.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      // User not logged in or error occurred
    }
  };

  const updateSEOTags = (pageName) => {
    const testName = user?.target_test || 'Language Test';
    const appName = 'Nordic Test Prep';
    
    const pageTitles = {
      Dashboard: `Dashboard - ${appName}`,
      Practice: `Quick Practice - ${testName} Preparation`,
      FullExam: `Full Exam Simulation - ${appName}`,
      History: `Practice History - ${appName}`,
      Achievements: `Achievements - ${appName}`,
      WordBank: `Word Bank - ${appName}`,
      Settings: `Settings - ${appName}`,
      Landing: `${appName} - Finnish, Swedish & Danish Language Test Preparation`
    };

    const pageDescriptions = {
      Dashboard: `Track your ${testName} exam preparation progress with personalized insights and recommendations.`,
      Practice: `Practice ${testName} exam questions for reading, listening, speaking, and writing with AI feedback.`,
      FullExam: `Take a complete ${testName} practice exam under realistic conditions.`,
      History: `Review your past ${testName} practice sessions and track improvement over time.`,
      Achievements: `See your earned achievements and milestones in ${testName} exam preparation.`,
      WordBank: "Build your Finnish/Swedish/Danish vocabulary with personalized word lists.",
      Settings: `Customize your ${testName} exam preparation settings and preferences.`,
      Landing: "Ace your Nordic language proficiency test with AI-powered practice and instant feedback."
    };

    document.title = pageTitles[pageName] || `${appName} - Pass Your Language Test`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = pageDescriptions[pageName] || "Ace your Finnish, Swedish, or Danish language proficiency test with AI-powered practice. Get instant feedback on reading, writing, listening, and speaking skills with personalized study plans.";
  };

  const navigationItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: Home,
    },
    {
      title: "Quick Practice",
      url: createPageUrl("Practice"),
      icon: BookOpen,
    },
    {
      title: "Full Exam",
      url: createPageUrl("FullExam"),
      icon: Timer,
    },
    {
      title: "Word Bank",
      url: createPageUrl("WordBank"),
      icon: Library,
    },
    {
      title: "History",
      url: createPageUrl("History"),
      icon: BarChart3,
    },
    {
      title: "Achievements",
      url: createPageUrl("Achievements"),
      icon: Trophy,
    },
    {
      title: "Changelog",
      url: createPageUrl("Changelog"),
      icon: ClipboardList,
    },
    {
      title: "Settings",
      url: createPageUrl("Settings"),
      icon: Settings,
    },
  ];

  // Add admin pages for admin users only
  const adminNavigationItems = user?.role === 'admin' ? [
    ...navigationItems,
    {
      title: "Study Materials",
      url: createPageUrl("ExamContent"),
      icon: Languages,
    },
    {
      title: "Knowledge Base",
      url: createPageUrl("KnowledgeBase"),
      icon: Database,
    },
    {
      title: "Exam Pool Manager",
      url: createPageUrl("ExamPoolManager"),
      icon: Zap,
    },
    {
      title: "Analytics",
      url: createPageUrl("Analytics"),
      icon: BarChart3,
    },
    {
      title: "Model Evaluation",
      url: createPageUrl("ModelEvaluation"),
      icon: Wand2,
    },
    {
      title: "Feedback",
      url: createPageUrl("Feedback"),
      icon: MessageSquare,
    }
  ] : navigationItems;

  // Pages that don't need the sidebar layout
  if (currentPageName === 'Onboarding' || currentPageName === 'BetaDisclaimer') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --forest-green: #2D5A3D;
            --amber: #F4A261;
            --nordic-blue: #4A90A4;
            --light-sage: #E8F5E8;
            --warm-white: #FEFEFE;
            --soft-gray: #F8F9FA;
            --text-dark: #1A1A1A;
            --text-medium: #4A5568;
            --text-light: #718096;
          }

          .dark {
            --forest-green: #1A4A2E;
            --amber: #F4A261;
            --nordic-blue: #4A90A4;
            --light-sage: #2D4A3D;
            --warm-white: #1A1A1A;
            --soft-gray: #2D2D2D;
            --text-dark: #E5E5E5;
            --text-medium: #B8B8B8;
            --text-light: #9A9A9A;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, var(--soft-gray) 0%, var(--warm-white) 100%);
            color: var(--text-dark);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .sidebar-gradient {
            background: linear-gradient(180deg, var(--forest-green) 0%, #234A32 100%);
          }

          .dark .sidebar-gradient {
            background: linear-gradient(180deg, var(--forest-green) 0%, #1A3A27 100%);
          }

          .achievement-glow {
            box-shadow: 0 0 20px rgba(244, 162, 97, 0.3);
          }

          .progress-shimmer {
            background: linear-gradient(90deg, var(--nordic-blue) 0%, var(--amber) 100%);
          }
        `}
      </style>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r-0 shadow-xl">
          <SidebarHeader className="p-6 sidebar-gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Nordic Test Prep</h2>
                <p className="text-xs text-green-100">
                  {user?.target_test || 'Language'} Exam Preparation
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="sidebar-gradient">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-green-100 uppercase tracking-wider px-4 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`mx-2 rounded-xl transition-all duration-300 ${
                          location.pathname === item.url
                            ? 'bg-white/20 text-white shadow-lg'
                            : 'text-green-100 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3" aria-label={`Navigate to ${item.title}`}>
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-6 sidebar-gradient border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {user?.full_name || 'Language Learner'}
                </p>
                <p className="text-xs text-green-100 truncate">
                  {user?.role === 'admin' ? 'Administrator' : 'Keep up the great work!'}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors duration-200" aria-label="Toggle sidebar" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nordic Test Prep</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
          <FeedbackButton />
        </main>
      </div>
    </SidebarProvider>
  );
}