import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

const Login = lazy(() => import('./pages/auth/Login').then((module) => ({ default: module.Login })));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then((module) => ({ default: module.StudentDashboard })));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard').then((module) => ({ default: module.TeacherDashboard })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard').then((module) => ({ default: module.ParentDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((module) => ({ default: module.AdminUsers })));
const AdminDepartments = lazy(() => import('./pages/admin/AdminDepartments').then((module) => ({ default: module.AdminDepartments })));
const ChatPage = lazy(() => import('./pages/shared/ChatPage').then((module) => ({ default: module.ChatPage })));
const DiscussionForum = lazy(() => import('./pages/shared/DiscussionForum').then((module) => ({ default: module.DiscussionForum })));
const AnnouncementsPage = lazy(() => import('./pages/shared/AnnouncementsPage').then((module) => ({ default: module.AnnouncementsPage })));
const StudyMaterialsPage = lazy(() => import('./pages/shared/StudyMaterialsPage').then((module) => ({ default: module.StudyMaterialsPage })));
const AssignmentsPage = lazy(() => import('./pages/shared/AssignmentsPage').then((module) => ({ default: module.AssignmentsPage })));
const AttendancePage = lazy(() => import('./pages/shared/AttendancePage').then((module) => ({ default: module.AttendancePage })));
const GradesPage = lazy(() => import('./pages/shared/GradesPage').then((module) => ({ default: module.GradesPage })));

const RouteLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-semibold text-emerald-800">
    Loading Mentora workspace…
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ROLE_ADMIN') return <AdminDashboard />;
  if (user?.role === 'ROLE_TEACHER') return <TeacherDashboard />;
  if (user?.role === 'ROLE_PARENT') return <ParentDashboard />;
  return <StudentDashboard />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
              <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
              <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
              <Route path="/materials" element={<ProtectedRoute><StudyMaterialsPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/forum" element={<ProtectedRoute><DiscussionForum /></ProtectedRoute>} />
              <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['ROLE_ADMIN']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/departments" element={<ProtectedRoute roles={['ROLE_ADMIN']}><AdminDepartments /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute roles={['ROLE_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
