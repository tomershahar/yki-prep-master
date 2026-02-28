/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import APITest from './pages/APITest';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import BetaDisclaimer from './pages/BetaDisclaimer';
import Changelog from './pages/Changelog';
import Dashboard from './pages/Dashboard';
import ExamContent from './pages/ExamContent';
import ExamPoolManager from './pages/ExamPoolManager';
import ExamReadiness from './pages/ExamReadiness';
import Feedback from './pages/Feedback';
import Flashcards from './pages/Flashcards';
import FreeTest from './pages/FreeTest';
import FullExam from './pages/FullExam';
import History from './pages/History';
import KnowledgeBase from './pages/KnowledgeBase';
import Landing from './pages/Landing';
import ModelEvaluation from './pages/ModelEvaluation';
import Onboarding from './pages/Onboarding';
import Practice from './pages/Practice';
import Settings from './pages/Settings';
import TestBetaReset from './pages/TestBetaReset';
import WordBank from './pages/WordBank';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APITest": APITest,
    "Achievements": Achievements,
    "Analytics": Analytics,
    "BetaDisclaimer": BetaDisclaimer,
    "Changelog": Changelog,
    "Dashboard": Dashboard,
    "ExamContent": ExamContent,
    "ExamPoolManager": ExamPoolManager,
    "ExamReadiness": ExamReadiness,
    "Feedback": Feedback,
    "Flashcards": Flashcards,
    "FreeTest": FreeTest,
    "FullExam": FullExam,
    "History": History,
    "KnowledgeBase": KnowledgeBase,
    "Landing": Landing,
    "ModelEvaluation": ModelEvaluation,
    "Onboarding": Onboarding,
    "Practice": Practice,
    "Settings": Settings,
    "TestBetaReset": TestBetaReset,
    "WordBank": WordBank,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};