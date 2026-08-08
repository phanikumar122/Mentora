import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CalendarCheck, CheckCircle2, Save, Users, BookOpen, ShieldAlert } from 'lucide-react';
import { User, Course } from '../../types';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'ROLE_TEACHER' || user?.role === 'ROLE_ADMIN';

  const [students, setStudents] = useState<{ id: string; name: string; email: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchRosterAndCourses = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] })),
      ]);

      const studentUsers = (usersRes.data || [])
        .filter((u: User) => u.role === 'ROLE_STUDENT')
        .map((u: User) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          status: 'PRESENT' as const,
        }));

      setStudents(studentUsers);
      setCourses(coursesRes.data || []);
      if ((coursesRes.data || []).length > 0 && !selectedCourse) {
        setSelectedCourse(coursesRes.data[0]);
      }
    } catch (err) {
      console.error('Error loading attendance roster:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRosterAndCourses();
  }, [fetchRosterAndCourses]);

  const toggleStudentStatus = (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSavedSuccess(false);
    setSaveError(null);

    try {
      const payload = students.map(s => ({
        student: { id: s.id },
        course: selectedCourse ? { id: selectedCourse.id } : null,
        date: new Date().toISOString().split('T')[0],
        status: s.status,
      }));

      await api.post('/attendance/batch', payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      // FIXED CRITICAL-6: show error message — do NOT show success on failure
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to save attendance. Please try again.');
      setTimeout(() => setSaveError(null), 6000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Course Attendance Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isTeacherOrAdmin ? 'Mark and record daily class attendance for specific department courses' : 'Track your course attendance logs and percentage breakdowns'}
          </p>
        </div>
        {isTeacherOrAdmin && students.length > 0 && (
          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Course Roster</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Attendance records for {selectedCourse ? selectedCourse.name : 'the course'} updated and saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading course roster...</div>
      ) : (
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-brand-500" />
                <span>Class Roster: {selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Select Course'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Session Date: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Course Selector Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Course:</span>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const crs = courses.find(c => String(c.id) === e.target.value);
                  if (crs) setSelectedCourse(crs);
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                {courses.length === 0 ? (
                  <option value="">No Courses Configured</option>
                ) : (
                  courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Registered Students Found</h4>
              <p className="text-xs text-slate-400">System Administrators can register Student accounts in the Manage Users portal.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((st) => (
                <div key={st.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{st.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">{st.email}</span>
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => toggleStudentStatus(st.id, 'PRESENT')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        st.status === 'PRESENT' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => toggleStudentStatus(st.id, 'LATE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        st.status === 'LATE' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => toggleStudentStatus(st.id, 'ABSENT')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        st.status === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
