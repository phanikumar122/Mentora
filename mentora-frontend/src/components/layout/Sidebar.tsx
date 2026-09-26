import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck,
  CalendarCheck,
  MessageSquare,
  MessagesSquare,
  Megaphone,
  FolderDown,
  Users,
  Building2,
  Award,
  ChevronLeft,
  ChevronRight,
  Compass,
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
      className={`h-full bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-200 ${
        isCollapsed ? 'w-16 p-2.5' : 'w-64 p-4'
      }`}
    >
      <div className="space-y-5 overflow-y-auto pr-0.5">
        {/* Workspace Title & Collapse Toggle */}
        <div className={`hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Workspace</span>
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Header Close */}
        <div className="flex md:hidden items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Categories & Items */}
        {linkGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-3 px-3 py-2.5'
                  } rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />

                  {!isCollapsed && <span className="truncate">{link.label}</span>}

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {link.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0 z-20">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
          <div className="relative z-50 h-full w-64">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
