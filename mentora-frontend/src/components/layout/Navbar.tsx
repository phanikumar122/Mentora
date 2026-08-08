import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, LogOut, User as UserIcon, X, Shield, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // FIXED MINOR-5: Close notification popover on click-outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const notifications = [
    { id: 1, title: 'Welcome to Mentora!', time: 'Just now', read: false },
    { id: 2, title: 'Academic Management System Active', time: '10m ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        {/* MINOR-9: Mobile hamburger button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer md:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* FIXED MINOR-4: Use useNavigate instead of window.location.href */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Mentora
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 relative">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Popover — FIXED MINOR-5: click-outside aware */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-xs">Notifications</h4>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-2.5 rounded-xl border text-xs ${n.read ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800' : 'bg-brand-500/5 border-brand-500/20'}`}>
                    <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Profile Modal Trigger */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-colors cursor-pointer"
          >
            {user ? `${user.firstName[0]}${user.lastName[0]}` : <UserIcon className="w-5 h-5" />}
          </button>
          <div className="hidden md:block text-left cursor-pointer" onClick={() => setShowProfileModal(true)}>
            <p className="text-sm font-semibold leading-none">{user ? `${user.firstName} ${user.lastName}` : 'Guest User'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.role?.replace('ROLE_', '')}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xl mx-auto border-2 border-brand-500/30">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-base">{user ? `${user.firstName} ${user.lastName}` : 'User Profile'}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-brand-500/10 text-brand-500 rounded-full font-bold text-xs uppercase tracking-wider">
                {user?.role?.replace('ROLE_', '')}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-center space-x-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => { setShowProfileModal(false); logout(); }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
