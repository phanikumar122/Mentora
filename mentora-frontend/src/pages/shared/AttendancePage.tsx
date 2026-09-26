import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { addAuditLog } from '../../services/auditService';
import {
  CalendarCheck,
  CheckCircle2,
  Save,
  Users,
  BookOpen,
  ShieldAlert,
  Calendar,
  Award,
  AlertTriangle,
  Clock,
  CheckCheck,
  Search,
} from 'lucide-react';
import { User, Course } from '../../types';
import { AttendanceHeatmap, HeatmapDay } from '../../components/common/AttendanceHeatmap';

interface AttendanceAnalytics {
  overallPercentage: number;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  complianceStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
  courseBreakdown: {
    courseName: string;
    total: number;
    present: number;
    percentage: number;
  }[];
}

interface PersonalAttendanceLog {
  id: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  course?: { id: number; name: string; code: string };
  subject?: { id: number; name: string; code: string };
}

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'ROLE_TEACHER' || user?.role === 'ROLE_ADMIN';

  // --- Teacher / Admin Roster State ---
  const [students, setStudents] = useState<{ id: string; name: string; email: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  // --- Student / Parent Personal Attendance State ---
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [historyLogs, setHistoryLogs] = useState<PersonalAttendanceLog[]>([]);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Fetch Teacher Roster Data (ONLY assigned advisees for Mentors) - Fully Parallelized
  const fetchTeacherRoster = useCallback(async () => {
    try {
      setRosterLoading(true);
      const [coursesRes, rosterRes] = await Promise.all([
        api.get('/courses').catch(() => ({ data: [] })),
        user?.role === 'ROLE_TEACHER'
          ? api.get('/users/teachers/my-students').catch(() => ({ data: [] }))
          : api.get('/users').catch(() => ({ data: [] })),
      ]);

      let studentUsers: { id: string; name: string; email: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[] = [];

      if (user?.role === 'ROLE_TEACHER') {
        // Fetch ONLY students assigned to this mentor
        studentUsers = (rosterRes.data || []).map((u: any) => ({
          id: String(u.studentUserId || u.id),
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Student',
          email: u.email,
          status: 'PRESENT' as const,
        }));
      } else {
        // Admin view: filter all student users
        studentUsers = (rosterRes.data || [])
          .filter((u: any) => u.role === 'ROLE_STUDENT')
          .map((u: any) => ({
            id: String(u.id),
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            status: 'PRESENT' as const,
          }));
      }

      setStudents(studentUsers);
      setCourses(coursesRes.data || []);
      if ((coursesRes.data || []).length > 0 && !selectedCourse) {
        setSelectedCourse(coursesRes.data[0]);
      }
    } catch (err) {
      console.error('Error loading attendance roster:', err);
    } finally {
      setRosterLoading(false);
    }
  }, [user?.role, selectedCourse]);

  // Fetch Student / Parent Analytics Data
  const fetchStudentAnalytics = useCallback(async () => {
    try {
      setPersonalLoading(true);
      const [analyticsRes, heatmapRes, logsRes] = await Promise.all([
        api.get('/attendance/analytics').catch(() => ({ data: null })),
        api.get('/attendance/heatmap?days=120').catch(() => ({ data: [] })),
        api.get('/attendance/my-attendance').catch(() => ({ data: [] })),
      ]);

      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      setHeatmapData(heatmapRes.data || []);
      setHistoryLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error loading personal attendance data:', err);
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTeacherOrAdmin) {
      fetchTeacherRoster();
    } else {
      fetchStudentAnalytics();
    }
  }, [isTeacherOrAdmin, fetchTeacherRoster, fetchStudentAnalytics]);

  // Fast Bulk Action: Mark All Present
  const handleMarkAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  const toggleStudentStatus = (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setSavedSuccess(false);
    setSaveError(null);

    try {
      const payload = students.map((s) => ({
        student: { id: s.id },
        course: selectedCourse ? { id: selectedCourse.id } : null,
        date: sessionDate,
        status: s.status,
      }));

      await api.post('/attendance/batch', payload);
      addAuditLog({
        action: 'Attendance Roster Recorded',
        detail: `Saved session attendance roster for ${students.length} students (${selectedCourse ? selectedCourse.name : 'Course'}) on ${sessionDate}`,
        type: 'SUCCESS',
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to save attendance. Please try again.');
      setTimeout(() => setSaveError(null), 6000);
    }
  };

  // Filtered History for Student/Parent
  const filteredHistory = historyLogs.filter((log) => {
    const matchesStatus = historyFilter === 'ALL' || log.status === historyFilter;
    const courseName = log.course?.name || log.subject?.name || '';
    const matchesSearch =
      courseName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      log.date.includes(searchHistory) ||
      (log.remarks || '').toLowerCase().includes(searchHistory.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ==========================================
  // VIEW 1: STUDENT / PARENT VIEW (Read-only + Heatmap)
  // ==========================================
  if (!isTeacherOrAdmin) {
    const rate = analytics?.overallPercentage ?? 100;
    const isWarning = rate < 75;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {user?.role === 'ROLE_PARENT' ? 'Student Ward Attendance Portal' : 'My Academic Attendance'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live session compliance, course breakdown, and interactive semester heatmap
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                rate >= 85
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : rate >= 75
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}
            >
              {rate >= 75 ? <Award className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{rate >= 75 ? 'Compliant with Academic Criteria' : 'Attendance Warning (<75%)'}</span>
            </span>
          </div>
        </div>

        {/* Warning Banner if below 75% */}
        {isWarning && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Minimum Attendance Threshold Alert</p>
              <p className="text-[11px] text-rose-400 mt-0.5">
                Your current attendance rate ({rate}%) is below the university requirement of 75.0%. Please consult your Faculty Advisor.
              </p>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="academic-card p-4 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overall Attendance</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {personalLoading ? '...' : `${rate.toFixed(1)}%`}
              </p>
            </div>
          </div>

          <div className="academic-card p-4 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Sessions</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {personalLoading ? '...' : analytics?.totalSessions || 0}
              </p>
            </div>
          </div>

          <div className="academic-card p-4 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Late Sessions</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {personalLoading ? '...' : analytics?.lateCount || 0}
              </p>
            </div>
          </div>

          <div className="academic-card p-4 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Absences</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {personalLoading ? '...' : analytics?.absentCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 HEATMAP INTEGRATION 🌟 */}
        <AttendanceHeatmap
          data={heatmapData}
          title={user?.role === 'ROLE_PARENT' ? "Ward's Attendance Activity Heatmap" : 'Semester Attendance Activity Heatmap'}
          subtitle="Interactive daily attendance density mapping over the past 120 days"
          loading={personalLoading}
        />

        {/* Course-Wise Breakdown */}
        {analytics?.courseBreakdown && analytics.courseBreakdown.length > 0 && (
          <div className="academic-card p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <span>Course-Wise Attendance Compliance</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.courseBreakdown.map((course, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">{course.courseName}</span>
                    <span className={`font-bold ${course.percentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {course.percentage}% ({course.present}/{course.total})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        course.percentage >= 85
                          ? 'bg-emerald-500'
                          : course.percentage >= 75
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, course.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance History Log Table */}
        <div className="academic-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <CalendarCheck className="w-4 h-4 text-brand-500" />
              <span>Historical Session Logs</span>
            </h3>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by course, date..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                {['ALL', 'PRESENT', 'LATE', 'ABSENT'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setHistoryFilter(status)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      historyFilter === status ? 'bg-white dark:bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No session logs match the filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Session Date</th>
                    <th className="p-3">Course / Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {filteredHistory.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">
                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {log.course?.name || log.subject?.name || 'General Academic Session'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            log.status === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : log.status === 'LATE'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">{log.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TEACHER / ADMIN VIEW (Roster Batch Marking)
  // ==========================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Faculty Course Attendance Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mark and record daily class attendance rosters for department courses
          </p>
        </div>
        {students.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-500 border border-emerald-500/20 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Course Roster</span>
            </button>
          </div>
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

      {rosterLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading course roster...</div>
      ) : (
        <div className="academic-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-brand-500" />
                <span>Class Roster: {selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Select Course'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Total Enrolled: {students.length} Students</p>
            </div>

            {/* Course & Date Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-500">Course:</span>
                <select
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const crs = courses.find((c) => String(c.id) === e.target.value);
                    if (crs) setSelectedCourse(crs);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  {courses.length === 0 ? (
                    <option value="">No Courses Configured</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {user?.role === 'ROLE_TEACHER' ? 'No Assigned Mentees Found' : 'No Registered Students Found'}
              </h4>
              <p className="text-xs text-slate-400">
                {user?.role === 'ROLE_TEACHER'
                  ? 'No student advisees have been assigned to your mentor profile yet. System Administrators can assign students in the Manage Users portal.'
                  : 'System Administrators can register Student accounts in the Manage Users portal.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                >
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

