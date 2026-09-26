import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  LogOut,
  User as UserIcon,
  X,
  Shield,
  Menu,
  Search,
  GraduationCap,
  ChevronRight,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Generate clean breadcrumb title
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbTitle =
    pathSegments.length === 0
      ? 'Overview'
      : pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
    { id: 1, title: 'Welcome to Mentora Academic Portal', time: 'Active Now', read: false },
    { id: 2, title: 'Coursework & materials updated', time: '25m ago', read: false },
    { id: 3, title: 'Term attendance log synchronized', time: '2h ago', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getRoleBadge = (roleStr?: string) => {
    switch (roleStr) {
      case 'ROLE_ADMIN':
        return { label: 'Administrator', style: 'bg-red-50 text-red-700 border-red-200' };
      case 'ROLE_TEACHER':
        return { label: 'Faculty Professor', style: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ROLE_PARENT':
        return { label: 'Parent / Guardian', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Student Scholar', style: 'bg-blue-50 text-blue-800 border-blue-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <>
      <header className="h-16 fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Menu Toggle, Crest Brand & Breadcrumbs */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors md:hidden cursor-pointer"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#047857] flex items-center justify-center text-white font-bold text-base shadow-sm hover:bg-[#065f46] transition-colors">
              <GraduationCap className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Mentora
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  PORTAL
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold block -mt-0.5 uppercase tracking-wider">
                Academic Management System
              </span>
            </div>
          </div>

          {/* Breadcrumb Path */}
          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200 text-xs">
            <span className="text-slate-400 font-medium">Institution</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {breadcrumbTitle}
            </span>
          </div>
        </div>

        {/* Right Section: Search, Notifications & Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Search Trigger Bar */}
          <div
            onClick={() => navigate('/forum')}
            className="hidden md:flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-500 cursor-pointer transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search courses, resources...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded shadow-xs text-slate-500">
              Ctrl+K
            </kbd>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-xs text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-amber-700 font-semibold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        n.read
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : 'bg-amber-50/50 border-amber-200 text-slate-800'
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

          {/* User Profile Trigger Button */}
          <div className="flex items-center pl-3 border-l border-slate-200">
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="flex items-center space-x-2.5 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="View Account Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-bold leading-tight text-slate-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold leading-none">
                  {roleInfo.label}
                </p>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Slide-Over Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowProfileDrawer(false)}
          />
          <div className="relative z-50 w-full max-w-sm bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">Academic Account Profile</h3>
                </div>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Overview Card */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
                  {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] border ${roleInfo.style}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {/* Account Identity Details */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Institutional Identity
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-900 truncate max-w-[170px]">
                      {user?.email}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact Phone</span>
                    </span>
                    <span className="font-semibold text-slate-900">
                      {user?.phoneNumber || 'Not Registered'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Access Role</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {user?.role?.replace('ROLE_', '')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-200 space-y-2">
              <button
                onClick={() => {
                  setShowProfileDrawer(false);
                  logout();
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
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
