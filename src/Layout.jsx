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
  MessageSquare,
  Wand2,
  ClipboardList,
  Library,
  Target
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
      title: "Exam Readiness",
      url: createPageUrl("ExamReadiness"),
      icon: Target,
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
    {
      title: "Discord Community",
      url: "https://discord.gg/rsgNBTsr",
      icon: MessageSquare,
      external: true,
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
    <>
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>
      <SidebarProvider>
      <style>
        {`
          :root {
            --nordic-deep: #1B2A4A;
            --nordic-mid: #2C4270;
            --nordic-accent: #4A7FBA;
            --nordic-light: #7EB8D4;
            --ice-white: #F0F5FA;
            --crisp-white: #FFFFFF;
            --slate-50: #F8FAFC;
            --slate-100: #F1F5F9;
            --text-dark: #0F172A;
            --text-medium: #334155;
            --text-light: #64748B;
          }

          .dark {
            --nordic-deep: #0F1A2E;
            --nordic-mid: #1E2D4A;
            --nordic-accent: #4A7FBA;
            --nordic-light: #7EB8D4;
            --ice-white: #1E2A3A;
            --crisp-white: #0F1A2E;
            --slate-50: #1A2535;
            --slate-100: #1E2D40;
            --text-dark: #E2E8F0;
            --text-medium: #94A3B8;
            --text-light: #64748B;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #EEF4FB 0%, #F8FAFC 60%, #E8F0F8 100%);
            color: var(--text-dark);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .sidebar-gradient {
            background: linear-gradient(180deg, #1B2A4A 0%, #162240 50%, #1A2E58 100%);
          }

          .dark .sidebar-gradient {
            background: linear-gradient(180deg, #0F1A2E 0%, #0C1525 50%, #111E35 100%);
          }

          .achievement-glow {
            box-shadow: 0 0 20px rgba(74, 127, 186, 0.35);
          }

          .progress-shimmer {
            background: linear-gradient(90deg, #4A7FBA 0%, #7EB8D4 100%);
          }
        `}
      </style>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r-0 shadow-xl">
          <SidebarHeader className="p-6 sidebar-gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg tracking-tight">Nordic Test Prep</h2>
                <p className="text-xs text-blue-200">
                  {user?.target_test || 'Language'} Exam Preparation
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="sidebar-gradient">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-blue-200 uppercase tracking-widest px-4 py-3 opacity-70">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`mx-2 rounded-xl transition-all duration-200 ${
                          !item.external && location.pathname === item.url
                            ? 'bg-blue-500/30 text-white shadow-md border border-blue-400/20'
                            : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {item.external ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3" aria-label={`Navigate to ${item.title}`}>
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </a>
                        ) : (
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3" aria-label={`Navigate to ${item.title}`}>
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-5 sidebar-gradient border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-400/30">
                <span className="text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {user?.full_name || 'Language Learner'}
                </p>
                <p className="text-xs text-blue-200 truncate">
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
            <main id="main-content" role="main">
              {children}
            </main>
          </div>
          <FeedbackButton />
        </main>
      </div>
    </SidebarProvider>
    </>
  );
}