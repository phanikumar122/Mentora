import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  CalendarCheck,
  MessageSquare,
  MessagesSquare,
  Megaphone,
  FolderDown,
  Users,
  Building2,
  Award,
  HeartHandshake
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'ROLE_STUDENT';

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assignments', label: 'Assignments', icon: FileCheck },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/grades', label: 'Grades & CGPA', icon: Award },
    { to: '/materials', label: 'Study Hub', icon: FolderDown },
    { to: '/chat', label: 'Messages', icon: MessageSquare },
    { to: '/forum', label: 'Discussion Forum', icon: MessagesSquare },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
  ];

  const teacherLinks = [
    { to: '/dashboard', label: 'Teacher Portal', icon: LayoutDashboard },
    { to: '/assignments', label: 'Grade Assignments', icon: FileCheck },
    { to: '/attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { to: '/materials', label: 'Upload Materials', icon: FolderDown },
    { to: '/chat', label: 'Student Messages', icon: MessageSquare },
    { to: '/forum', label: 'Q&A Forum', icon: MessagesSquare },
    { to: '/announcements', label: 'Send Announcement', icon: Megaphone },
  ];

  const parentLinks = [
    { to: '/dashboard', label: 'Parent Portal', icon: LayoutDashboard },
    { to: '/assignments', label: 'Ward Assignments', icon: FileCheck },
    { to: '/attendance', label: 'Ward Attendance', icon: CalendarCheck },
    { to: '/grades', label: 'Ward Grades', icon: Award },
    { to: '/chat', label: 'Faculty Chat', icon: MessageSquare },
    { to: '/announcements', label: 'School Notices', icon: Megaphone },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Governance', icon: Users },
    { to: '/admin/departments', label: 'Departments & Courses', icon: Building2 },
    { to: '/announcements', label: 'Global Announcements', icon: Megaphone },
    { to: '/forum', label: 'Forum Overview', icon: MessagesSquare },
  ];

  const links =
    role === 'ROLE_ADMIN' ? adminLinks :
    role === 'ROLE_TEACHER' ? teacherLinks :
    role === 'ROLE_PARENT' ? parentLinks : studentLinks;

  const sidebarContent = (
    <aside className="w-64 h-full border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Navigation
          </p>
          {/* Close button for mobile drawer */}
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 rounded-xl text-center">
        <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Mentora v1.0</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Academic Portal Active</p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — slide-in drawer with backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative z-50 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
