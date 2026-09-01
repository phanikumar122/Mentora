import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  GraduationCap,
  School,
  Compass,
  Layers,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  category?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'ROLE_STUDENT';

  // Internal collapse state if not fully controlled from parent
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('mentora_sidebar_collapsed');
    return saved === 'true';
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('mentora_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const studentLinks: { category: string; items: NavItem[] }[] = [
    {
      category: 'Core Portal',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/assignments', label: 'Assignments', icon: FileCheck },
        { to: '/attendance', label: 'Attendance Hub', icon: CalendarCheck },
        { to: '/grades', label: 'Grades & CGPA', icon: Award },
        { to: '/materials', label: 'Study Hub', icon: FolderDown },
      ],
    },
    {
      category: 'Academic Community',
      items: [
        { to: '/chat', label: 'Messages & Mentor', icon: MessageSquare },
        { to: '/forum', label: 'Discussion Forum', icon: MessagesSquare },
        { to: '/announcements', label: 'Announcements', icon: Megaphone },
      ],
    },
  ];

  const teacherLinks: { category: string; items: NavItem[] }[] = [
    {
      category: 'Faculty Command',
      items: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/assignments', label: 'Course Assignments', icon: FileCheck },
        { to: '/attendance', label: 'Class Attendance', icon: CalendarCheck },
        { to: '/materials', label: 'Study Materials', icon: FolderDown },
      ],
    },
    {
      category: 'Mentorship & Forum',
      items: [
        { to: '/chat', label: 'Advisee Messages', icon: MessageSquare },
        { to: '/forum', label: 'Academic Q&A', icon: MessagesSquare },
        { to: '/announcements', label: 'Post Notices', icon: Megaphone },
      ],
    },
  ];

  const parentLinks: { category: string; items: NavItem[] }[] = [
    {
      category: 'Ward Monitoring',
      items: [
        { to: '/dashboard', label: 'Ward Portal', icon: LayoutDashboard },
        { to: '/assignments', label: 'Ward Assignments', icon: FileCheck },
        { to: '/attendance', label: 'Ward Attendance', icon: CalendarCheck },
        { to: '/grades', label: 'Academic Report', icon: Award },
      ],
    },
    {
      category: 'Communication',
      items: [
        { to: '/chat', label: 'Faculty Chat', icon: MessageSquare },
        { to: '/announcements', label: 'School Notices', icon: Megaphone },
      ],
    },
  ];

  const adminLinks: { category: string; items: NavItem[] }[] = [
    {
      category: 'University Governance',
      items: [
        { to: '/dashboard', label: 'Executive Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User Management', icon: Users },
        { to: '/admin/departments', label: 'Departments & Courses', icon: Building2 },
      ],
    },
    {
      category: 'Campus Broadcasts',
      items: [
        { to: '/announcements', label: 'Campus Notices', icon: Megaphone },
        { to: '/forum', label: 'Forum Moderation', icon: MessagesSquare },
      ],
    },
  ];

  const linkGroups =
    role === 'ROLE_ADMIN'
      ? adminLinks
      : role === 'ROLE_TEACHER'
      ? teacherLinks
      : role === 'ROLE_PARENT'
      ? parentLinks
      : studentLinks;

  const sidebarContent = (
    <aside
      className={`h-[calc(100vh-5rem)] my-2 ml-3 flex flex-col justify-between rounded-2xl transition-all duration-300 ease-in-out floating-sidebar-glass ${
        isCollapsed ? 'w-[74px] p-2.5' : 'w-[260px] p-4'
      }`}
    >
      {/* Top Groupings & Nav links */}
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* Collapse toggle row (Desktop only) */}
        <div className={`hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile close button */}
        <div className="flex md:hidden items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Navigation</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Render Link Groups */}
        {linkGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {group.category}
              </p>
            )}
            {group.items.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  title={isCollapsed ? link.label : undefined}
                  className={`group relative flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-3.5 py-2.5'
                  } rounded-xl font-semibold text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 dark:shadow-brand-500/15'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-500'}`} />

                  {!isCollapsed && (
                    <span className="truncate">{link.label}</span>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-800">
                      {link.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Institutional Status Footer */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-space-indigo-50/70 dark:bg-space-indigo-950/60 border border-space-indigo-100 dark:border-space-indigo-800/60 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-space-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <School className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Mentora Portal</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Verified Active</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Mentora System Active">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop floating sidebar */}
      <div className="hidden md:flex h-full sticky top-16 z-20">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-50 h-full w-[270px]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

