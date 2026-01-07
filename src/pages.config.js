import APITest from './pages/APITest';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import BetaDisclaimer from './pages/BetaDisclaimer';
import Changelog from './pages/Changelog';
import Dashboard from './pages/Dashboard';
import ExamContent from './pages/ExamContent';
import ExamPoolManager from './pages/ExamPoolManager';
import Feedback from './pages/Feedback';
import Flashcards from './pages/Flashcards';
import FullExam from './pages/FullExam';
import History from './pages/History';
import KnowledgeBase from './pages/KnowledgeBase';
import ModelEvaluation from './pages/ModelEvaluation';
import Onboarding from './pages/Onboarding';
import Practice from './pages/Practice';
import Settings from './pages/Settings';
import TestBetaReset from './pages/TestBetaReset';
import WordBank from './pages/WordBank';
import Landing from './pages/Landing';
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
    "Feedback": Feedback,
    "Flashcards": Flashcards,
    "FullExam": FullExam,
    "History": History,
    "KnowledgeBase": KnowledgeBase,
    "ModelEvaluation": ModelEvaluation,
    "Onboarding": Onboarding,
    "Practice": Practice,
    "Settings": Settings,
    "TestBetaReset": TestBetaReset,
    "WordBank": WordBank,
    "Landing": Landing,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};