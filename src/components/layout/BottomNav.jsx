import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, BookOpen, FileText, HelpCircle, Settings, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { apiClient } from '@/apis/client';

export default function BottomNav() {
  const location = useLocation();
  const [currentPath, setCurrentPath] = React.useState('');
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const baseNavItems = [
    { path: '/AIGenerator', label: 'AI Gen', icon: Brain, requireAuth: false },
    { path: '/Templates', label: 'Prompts', icon: BookOpen, requireAuth: false },
    { path: '/PersonasLibrary', label: 'Personas', icon: Users, requireAuth: false },
    { path: '/ContentExamples', label: 'Examples', icon: FileText, requireAuth: false },
    { path: '/Help', label: 'Help', icon: HelpCircle, requireAuth: false },
  ];

  const isActive = (item) => {
    const normalizedCurrentPath = currentPath === '/' ? '/AIGenerator' : currentPath;
    return normalizedCurrentPath === item.path;
  };

  const visibleNavItems = baseNavItems.filter(item => {
    if (item.requireAuth && !currentUser) return false;
    return true;
  });

  if (visibleNavItems.length === 0) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-purple-100 lg:hidden z-40 safe-area-bottom shadow-lg max-h-[5vh]">
      <div className="flex items-center justify-around h-12 px-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative group"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNav"
                    className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div
                  className={`relative flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all ${
                    active 
                      ? 'text-white' 
                      : 'text-gray-600 group-hover:text-purple-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
                  <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
