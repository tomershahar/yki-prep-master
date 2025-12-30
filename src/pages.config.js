import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import ExamContent from './pages/ExamContent';
import KnowledgeBase from './pages/KnowledgeBase';
import ExamPoolManager from './pages/ExamPoolManager';
import FullExam from './pages/FullExam';
import Achievements from './pages/Achievements';
import APITest from './pages/APITest';
import Feedback from './pages/Feedback';
import BetaDisclaimer from './pages/BetaDisclaimer';
import Analytics from './pages/Analytics';
import ModelEvaluation from './pages/ModelEvaluation';
import Changelog from './pages/Changelog';
import History from './pages/History';
import TestBetaReset from './pages/TestBetaReset';
import WordBank from './pages/WordBank';
import Flashcards from './pages/Flashcards';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Practice": Practice,
    "Settings": Settings,
    "Onboarding": Onboarding,
    "ExamContent": ExamContent,
    "KnowledgeBase": KnowledgeBase,
    "ExamPoolManager": ExamPoolManager,
    "FullExam": FullExam,
    "Achievements": Achievements,
    "APITest": APITest,
    "Feedback": Feedback,
    "BetaDisclaimer": BetaDisclaimer,
    "Analytics": Analytics,
    "ModelEvaluation": ModelEvaluation,
    "Changelog": Changelog,
    "History": History,
    "TestBetaReset": TestBetaReset,
    "WordBank": WordBank,
    "Flashcards": Flashcards,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};