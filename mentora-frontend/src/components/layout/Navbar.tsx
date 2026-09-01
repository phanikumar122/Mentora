import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User as UserIcon,
  X,
  Shield,
  Menu,
  Search,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Command,
  ChevronRight,
  School,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Generate breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbTitle =
    pathSegments.length === 0
      ? 'Overview'
      : pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Close notifications on click-outside
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

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to Mentora Academic Platform!', time: 'Active now', read: false },
    { id: 2, title: 'Attendance logs & analytics synchronized', time: '12m ago', read: false },
    { id: 3, title: 'Term assignments published for CS-101', time: '1h ago', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getRoleBadge = (roleStr?: string) => {
    switch (roleStr) {
      case 'ROLE_ADMIN':
        return { label: 'Administrator', style: 'bg-space-indigo-500/10 text-space-indigo-600 dark:text-space-indigo-400 border-space-indigo-500/20' };
      case 'ROLE_TEACHER':
        return { label: 'Faculty Professor', style: 'bg-blue-slate-500/10 text-blue-slate-600 dark:text-blue-slate-400 border-blue-slate-500/20' };
      case 'ROLE_PARENT':
        return { label: 'Parent / Guardian', style: 'bg-sand-dune-500/15 text-sand-dune-600 dark:text-sand-dune-400 border-sand-dune-500/30' };
      default:
        return { label: 'Student Scholar', style: 'bg-space-indigo-500/10 text-space-indigo-600 dark:text-space-indigo-400 border-space-indigo-500/20' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <>
      <header className="h-16 header-glass px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        {/* Left: Mobile Toggle, Brand & Breadcrumbs */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer md:hidden"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-space-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-space-indigo-900/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Mentora
              </span>
              <span className="text-[10px] text-space-indigo-600 dark:text-space-indigo-300 font-bold block -mt-1 tracking-wider uppercase">
                Academic Hub
              </span>
            </div>
          </div>

          {/* Breadcrumb separator & path */}
          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400">Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
              {breadcrumbTitle}
            </span>
          </div>
        </div>

        {/* Right Action Icons & User Drawer Trigger */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Search Shortcut Bar */}
          <div
            onClick={() => navigate('/forum')}
            className="hidden md:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 px-3 py-1.5 rounded-xl text-xs text-slate-400 cursor-pointer transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search or jump to...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xs text-slate-500">
              Ctrl+K
            </kbd>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Dark / Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-xs">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs transition-colors ${
                        n.read
                          ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800 text-slate-500'
                          : 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/20 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <p className="font-semibold text-xs leading-snug">{n.title}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Drawer Trigger */}
          <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer group"
              title="Open User Profile"
            >
              <div className="w-8 h-8 rounded-full bg-space-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:ring-2 ring-space-indigo-500/40 transition-all">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </p>
                <p className="text-[10px] text-space-indigo-600 dark:text-space-indigo-300 font-semibold leading-none">
                  {roleInfo.label}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over User Profile Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setShowProfileDrawer(false)}
          />

          {/* Drawer Content Panel */}
          <div className="relative z-50 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-space-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic Account Profile</h3>
                </div>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-5 rounded-2xl bg-space-indigo-50/70 dark:bg-space-indigo-950/60 border border-space-indigo-100 dark:border-space-indigo-800/60 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-space-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg shadow-space-indigo-900/25">
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
                </div>
                <div className="pt-1">
                  <span className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] border ${roleInfo.style}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {/* Account Metadata Details */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Institutional Identity
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-brand-500" />
                      <span>Email Address</span>
                    </span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white truncate max-w-[170px]">
                      {user?.email}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Phone Number</span>
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {user?.phoneNumber || 'Not Registered'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-space-indigo-500" />
                      <span>Access Role</span>
                    </span>
                    <span className="font-bold text-space-indigo-600 dark:text-space-indigo-400">
                      {user?.role?.replace('ROLE_', '')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setShowProfileDrawer(false);
                  logout();
                }}
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Mentora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

