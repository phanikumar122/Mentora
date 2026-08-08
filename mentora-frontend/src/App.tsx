import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/auth/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDepartments } from './pages/admin/AdminDepartments';
import { ChatPage } from './pages/shared/ChatPage';
import { DiscussionForum } from './pages/shared/DiscussionForum';
import { AnnouncementsPage } from './pages/shared/AnnouncementsPage';
import { StudyMaterialsPage } from './pages/shared/StudyMaterialsPage';
import { AssignmentsPage } from './pages/shared/AssignmentsPage';
import { AttendancePage } from './pages/shared/AttendancePage';
import { GradesPage } from './pages/shared/GradesPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/departments" element={<ProtectedRoute><AdminDepartments /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
