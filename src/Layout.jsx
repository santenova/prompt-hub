import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Button } from '@/components/ui/button';
import { Home, Sparkles, Settings, Users, Store, Code, Menu, X, HelpCircle, BookOpen, LogOut, Shield, CreditCard, FileText, Brain, Zap, UserPlus, Search, ChevronDown, TrendingUp, Mic, MessageSquare, Map, FolderOpen } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { useAuthUser } from './components/hooks/useAuthUser';

// Initialize api client (will be wrapped with logging if enabled)

import NotificationBell from './components/notifications/NotificationBell';
import GlobalSearch from './components/search/GlobalSearch';
import BottomNav from './components/layout/BottomNav';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import ErrorBoundary from './components/ErrorBoundary';
import AppToaster, { Toaster as UIToster } from './components/ui/toaster';
import DynamicFooter from './components/layout/DynamicFooter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dynamic gradient themes for each page
const pageGradients = {
  AIGenerator: 'from-purple-50 via-white to-pink-50',
  Templates: 'from-purple-50 via-white to-indigo-50',
  PersonasLibrary: 'from-indigo-50 via-white to-cyan-50',
  AIContentGenerator: 'from-pink-50 via-white to-purple-50',
  Settings: 'from-slate-50 via-white to-gray-50',
  TemplateMarketplace: 'from-emerald-50 via-white to-teal-50',
  CommunityFeed: 'from-orange-50 via-white to-amber-50',
  Dashboard: 'from-blue-50 via-white to-indigo-50',
  Help: 'from-purple-50 via-white to-indigo-50',
  Documentation: 'from-purple-50 via-white to-indigo-50',
  ContentExamples: 'from-pink-50 via-white to-purple-50',
  Tools: 'from-green-50 via-white to-teal-50',
  SharedTemplates: 'from-blue-50 via-white to-indigo-50',
  Projects: 'from-purple-50 via-white to-indigo-50',
  default: 'from-purple-50 via-white to-indigo-50'
};

export default function Layout({ children, currentPageName }) {
  const { currentUser, isLoading: isLoadingAuth } = useAuthUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isVoicePage = currentPageName === 'VoiceToPrompt' || location.pathname.toLowerCase().includes('voicetoprompt');
  const isFullscreenPage = currentPageName === 'AIContentGenerator' || isVoicePage;

  // Initialize advanced logging if enabled
  useEffect(() => {
    const isLoggingEnabled = localStorage.getItem('advancedLoggingEnabled') === 'true';
    if (isLoggingEnabled && !window._loggingInitialized) {
      window._loggingInitialized = true;
      import('./components/utils/apiClientWithLogging').then(module => {
       
        console.log('%c✨ Advanced Logging Active', 'background: #10b981; color: white; padding: 8px; border-radius: 4px; font-weight: bold');
      }).catch(err => console.error('Failed to load logging module:', err));
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && currentUser && !currentUser.onboarding_completed && !currentUser.onboarding_skipped) {
      setShowOnboarding(true);
    }
  }, [isLoadingAuth, currentUser]);

  // Main navigation - core app features
  const navItems = [
    { path: 'Templates', label: 'Prompts', icon: BookOpen },
    { path: 'PersonasLibrary', label: 'Personas', icon: Users },
  ];

  // User menu items - only for authenticated users
  const userMenuItems = currentUser ? [
  
    { path: 'Projects', label: 'Projects', icon: FolderOpen },
    { path: 'SharedTemplates', label: 'Shared with Me', icon: UserPlus },
    ...(currentUser.role === 'admin' ? [
      { path: 'AdminDashboard', label: 'Admin', icon: Shield }
    ] : []),
    { type: 'separator' },
    { path: 'Settings', label: 'Settings', icon: Settings },
    { path: 'Billing', label: 'Billing', icon: CreditCard },
  ] : [];

  const handleOnboardingComplete = (redirectPath) => {
    setShowOnboarding(false);
    if (redirectPath) {
      navigate(createPageUrl(redirectPath));
    }
  };

  const handleRestartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleLogout = () => {
    apiClient.auth.logout();
  };

  const NavLink = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = currentPageName === item.path;
    
    return (
      <Link 
        to={createPageUrl(item.path)}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant={isActive ? 'default' : 'ghost'}
            className={`${
              isActive
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md border-0' 
                : 'hover:bg-white/30 hover:text-purple-700 transition-all duration-200'
            } ${mobile ? 'w-full justify-start' : ''}`}
            size="sm"
          >
            <Icon className={`w-4 h-4 mr-2`} />
            {item.label}
          </Button>
        </motion.div>
      </Link>
    );
  };

  const getUserInitials = () => {
    if (!currentUser) return 'U';
    if (currentUser.full_name) {
      return currentUser.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser.email?.charAt(0).toUpperCase() || 'U';
  };

  // Get gradient for current page
  const currentGradient = currentPageName === 'ModalDashboard' ? 'from-white to-white' : pageGradients[currentPageName] || pageGradients.default;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <Sparkles className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gradient-to-br ${currentGradient} pb-16 lg:pb-0 transition-all duration-700 ease-in-out`}>
        {/* Top Navigation with dynamic gradient */}
        <nav className={`bg-gradient-to-r ${currentGradient} backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50 shadow-sm transition-all duration-700`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-18">
              {/* Logo with animation */}
              <Link to={createPageUrl('Tools')} className="flex items-center gap-2 flex-shrink-0 group">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </motion.div>
                <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Prompt Hub
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Global Search */}
                <GlobalSearch />

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                {/* Main navigation links - visible to all */}
                {navItems.slice(0, 3).map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}


                {/* More Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      More
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {navItems.slice(4).map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.path;
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link to={createPageUrl(item.path)} className="cursor-pointer">
                            <Icon className="w-4 h-4 mr-2" />
                            <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('contentexamples')} className="cursor-pointer">
                        <Home className="w-4 h-4 mr-2" />
                        <span className={currentPageName === 'Examples' ? 'font-semibold' : ''}>Examples</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('About')} className="cursor-pointer">
                        <Home className="w-4 h-4 mr-2" />
                        <span className={currentPageName === 'Help' ? 'font-semibold' : ''}>Help</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Documentation')} className="cursor-pointer">
                        <Home className="w-4 h-4 mr-2" />
                        <span className={currentPageName === 'Documentation' ? 'font-semibold' : ''}>Documentation</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('About')} className="cursor-pointer">
                        <Home className="w-4 h-4 mr-2" />
                        <span className={currentPageName === 'About' ? 'font-semibold' : ''}>About</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Sitemap')} className="cursor-pointer">
                        <Map className="w-4 h-4 mr-2" />
                        <span className={currentPageName === 'Sitemap' ? 'font-semibold' : ''}>Site Map</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {currentUser && (
                  <>
                    <div className="h-8 w-px bg-gray-200 mx-2"></div>
                    
                    <NotificationBell userEmail={currentUser.email} />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative group">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Avatar className="h-9 w-9 border-2 border-purple-200 group-hover:border-purple-400 transition-colors">
                              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-semibold">
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">{currentUser.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500">{currentUser.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userMenuItems.map((item, idx) => {
                          if (item.type === 'separator') {
                            return <DropdownMenuSeparator key={`sep-${idx}`} />;
                          }
                          const Icon = item.icon;
                          const isActive = currentPageName === item.path;
                          return (
                            <DropdownMenuItem key={item.path} asChild>
                              <Link to={createPageUrl(item.path)} className="cursor-pointer">
                                <Icon className="w-4 h-4 mr-2" />
                                <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRestartOnboarding}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Restart Tutorial
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
                
                {!currentUser && (
                  <>
                    <div className="h-8 w-px bg-gray-200 mx-2"></div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => apiClient.auth.redirectToLogin()} 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/30"
                      >
                        Sign In
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Mobile Right Side */}
              <div className="flex items-center gap-2 lg:hidden">
                {/* Mobile Search Button */}
                <GlobalSearch 
                  trigger={
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Search className="w-5 h-5" />
                    </Button>
                  }
                />
                {currentUser && (
                  <>
                    <NotificationBell userEmail={currentUser.email} />
                    <Avatar className="h-8 w-8 border-2 border-purple-200">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </>
                )}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-gradient-to-br from-white to-purple-50">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Menu
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-2 mt-6">
                      {navItems.map((item) => (
                        <NavLink key={item.path} item={item} mobile />
                      ))}
                      
                      {currentUser && userMenuItems.length > 0 && (
                        <>
                          <div className="h-px bg-gray-200 my-2"></div>
                          {userMenuItems.map((item, idx) => {
                            if (item.type === 'separator') {
                              return <div key={`sep-mobile-${idx}`} className="h-px bg-gray-200 my-2"></div>;
                            }
                            return <NavLink key={item.path} item={item} mobile />;
                          })}
                        </>
                      )}
                      
                      {currentUser && (
                        <>
                          <div className="h-px bg-gray-200 my-2"></div>
                          <Button
                            variant="ghost"
                            onClick={handleRestartOnboarding}
                            className="w-full justify-start"
                            size="sm"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Restart Tutorial
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            size="sm"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </Button>
                        </>
                      )}
                      {!currentUser && (
                        <>
                          <div className="h-px bg-gray-200 my-2"></div>
                          <Button 
                            onClick={() => {
                              setMobileMenuOpen(false);
                              apiClient.auth.redirectToLogin();
                            }} 
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full justify-start shadow-lg shadow-purple-500/30"
                            size="sm"
                          >
                            Sign In
                          </Button>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={currentPageName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={isFullscreenPage ? "h-screen overflow-hidden" : "min-h-[calc(100vh-8rem)]"}
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* Footer - Hidden on Fullscreen Pages */}
        {!isFullscreenPage && (
          <DynamicFooter currentPageName={currentPageName} />
        )}

        {/* Global Toaster */}
        <AppToaster />

        {/* Onboarding Wizard */}
        {currentUser && (
          <OnboardingWizard
            open={showOnboarding}
            onComplete={handleOnboardingComplete}
            currentUser={currentUser}
          />
        )}

        <style jsx="true" global="true">{`
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          @supports (padding: max(0px)) {
            .safe-area-bottom {
              padding-bottom: max(env(safe-area-inset-bottom), 0px);
            }
          }
          
          .bg-grid-white\/\[0\.2\] {
            background-image: linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
            background-size: 20px 20px;
          }
          
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
            background: linear-gradient(
              to right,
              transparent 0%,
              rgba(255, 255, 255, 0.3) 50%,
              transparent 100%
            );
            background-size: 1000px 100%;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
