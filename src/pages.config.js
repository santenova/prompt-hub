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
import AIContentGenerator from './pages/AIContentGenerator';
import AIGenerator from './pages/AIGenerator';
import APIDocumentation from './pages/APIDocumentation';
import About from './pages/About';
import ActivityLogs from './pages/ActivityLogs';
import AdminDashboard from './pages/AdminDashboard';
import AdvancedAI from './pages/AdvancedAI';
import AgentMarketplace from './pages/AgentMarketplace';
import Billing from './pages/Billing';
import Blog from './pages/Blog';
import CommunityFeed from './pages/CommunityFeed';
import ConsoleLogger from './pages/ConsoleLogger';
import Contact from './pages/Contact';
import ContentExamples from './pages/ContentExamples';
import ContentLibrary from './pages/ContentLibrary';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Help from './pages/Help';
import InvestorProposal from './pages/InvestorProposal';
import ManualLogin from './pages/ManualLogin';
import MyPrompts from './pages/MyPrompts';
import MySubscriptions from './pages/MySubscriptions';
import NotFound from './pages/NotFound';
import NotesGenerator from './pages/NotesGenerator';
import OllamaManager from './pages/OllamaManager';
import OllamaSettings from './pages/OllamaSettings';
import PaymentCancel from './pages/PaymentCancel';
import PaymentSuccess from './pages/PaymentSuccess';
import PersonasLibrary from './pages/PersonasLibrary';
import Pipelines from './pages/Pipelines';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Projects from './pages/Projects';
import PromptPerformance from './pages/PromptPerformance';
import Settings from './pages/Settings';
import SharedChat from './pages/SharedChat';
import SharedTemplate from './pages/SharedTemplate';
import SharedTemplates from './pages/SharedTemplates';
import Sitemap from './pages/Sitemap';
import TeamWorkspaces from './pages/TeamWorkspaces';
import TemplateAnalytics from './pages/TemplateAnalytics';
import TemplateMarketplace from './pages/TemplateMarketplace';
import Templates from './pages/Templates';
import TermsOfService from './pages/TermsOfService';
import TestPage from './pages/TestPage';
import Test from './pages/Test';
import Tools from './pages/Tools';
import VectorDatabase from './pages/VectorDatabase';
import VoiceToPrompt from './pages/VoiceToPrompt';



import Chat from './pages/Chat';


import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "AIContentGenerator": AIContentGenerator,
    "AIGenerator": AIGenerator,
    "APIDocumentation": APIDocumentation,
    "About": About,
    "ActivityLogs": ActivityLogs,
    "AdminDashboard": AdminDashboard,
    "AdvancedAI": AdvancedAI,
    "AgentMarketplace": AgentMarketplace,
    "Billing": Billing,
    "Blog": Blog,
    "CommunityFeed": CommunityFeed,
    "ConsoleLogger": ConsoleLogger,
    "Contact": Contact,
    "ContentExamples": ContentExamples,
    "ContentLibrary": ContentLibrary,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Help": Help,
    "InvestorProposal": InvestorProposal,
    "ManualLogin": ManualLogin,
    "MyPrompts": MyPrompts,
    "MySubscriptions": MySubscriptions,
    "NotFound": NotFound,
    "NotesGenerator": NotesGenerator,
    "OllamaManager": OllamaManager,
    "OllamaSettings": OllamaSettings,
    "PaymentCancel": PaymentCancel,
    "PaymentSuccess": PaymentSuccess,
    "PersonasLibrary": PersonasLibrary,
    "Pipelines": Pipelines,
    "PrivacyPolicy": PrivacyPolicy,
    "Projects": Projects,
    "PromptPerformance": PromptPerformance,
    "Settings": Settings,
    "SharedChat": SharedChat,
    "SharedTemplate": SharedTemplate,
    "SharedTemplates": SharedTemplates,
    "Sitemap": Sitemap,
    "TeamWorkspaces": TeamWorkspaces,
    "TemplateAnalytics": TemplateAnalytics,
    "TemplateMarketplace": TemplateMarketplace,
    "Templates": Templates,
    "TermsOfService": TermsOfService,
    "TestPage": TestPage,
    "Test": Test,
    "Tools": Tools,
    "VectorDatabase": VectorDatabase,
    "VoiceToPrompt": VoiceToPrompt,
}

export const pagesConfig = {
    mainPage: "PersonasLibrary",
    Pages: PAGES,
    Layout: __Layout,
};
