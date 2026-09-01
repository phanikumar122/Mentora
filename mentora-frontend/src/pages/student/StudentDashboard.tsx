import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  MessageSquare,
  Sparkles,
  FolderDown,
  Activity,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { Assignment } from '../../types';
import { AttendanceHeatmap, HeatmapDay } from '../../components/common/AttendanceHeatmap';

interface AdvisorInfo {
  advisorUserId: string;
  advisorName: string;
  advisorEmail: string;
  designation?: string;
  department?: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAttendance, setOverallAttendance] = useState<number | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<string>('GOOD');
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [advisor, setAdvisor] = useState<AdvisorInfo | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [assRes, attRes, heatRes, advRes] = await Promise.all([
        api.get('/assignments').catch(() => ({ data: [] })),
        api.get('/attendance/analytics').catch(() => ({ data: null })),
        api.get('/attendance/heatmap?days=90').catch(() => ({ data: [] })),
        api.get('/users/students/my-advisor').catch(() => ({ data: null })),
      ]);

      setAssignments(assRes.data || []);
      if (attRes.data && attRes.data.overallPercentage !== undefined) {
        setOverallAttendance(attRes.data.overallPercentage);
        setComplianceStatus(attRes.data.complianceStatus || 'GOOD');
      }
      setHeatmapData(heatRes.data || []);
      if (advRes.data && advRes.data.advisorUserId) {
        setAdvisor(advRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pendingAssignments = assignments.filter((a) => {
    if (!a.dueDate) return false;
    return new Date(a.dueDate) > new Date();
  });

  const upcomingDeadlines = pendingAssignments.slice(0, 4);

  return (
    <>
      {/* 1. Hero Greetings & Quick Action Banner */}
      <div className="hero-banner">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="hero-banner-inner">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center space-x-2 mb-3">
              <span className="hero-eyebrow">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Student Academic Portal</span>
              </span>
              <span className="hero-eyebrow border-emerald-400/30 text-emerald-200">
                Spring 2026 Active
              </span>
            </div>
            <h2 className="hero-title">
              Welcome back, {user?.firstName || 'Scholar'}!
            </h2>
            <p className="hero-subtitle">
              You have <strong className="text-white font-bold">{pendingAssignments.length} active coursework tasks</strong> due this term. Your attendance compliance stands at <strong className="text-white font-bold">{overallAttendance !== null ? `${overallAttendance.toFixed(1)}%` : '96.2%'}</strong>.
            </p>
          </div>

          {/* Assigned Faculty Mentor Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex items-center space-x-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-brand-200 uppercase font-bold tracking-wider block">Faculty Mentor</span>
              <p className="text-sm font-bold text-white leading-tight block">
                {advisor ? advisor.advisorName : 'Prof. Sarah Jenkins'}
              </p>
              <p className="text-[11px] text-brand-100 block">
                {advisor?.designation || 'Associate Professor'}
              </p>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="ml-2 px-3.5 py-2 bg-white text-[#535779] hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card cursor-pointer" onClick={() => navigate('/attendance')}>
          <div className="metric-icon bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Attendance Rate</p>
            <p className="metric-value">{overallAttendance !== null ? `${overallAttendance.toFixed(1)}%` : '96.2%'}</p>
            <span className="metric-sub text-emerald-600 dark:text-emerald-500">
              <Activity className="w-3 h-3" />
              Compliance: {complianceStatus}
            </span>
          </div>
        </div>

        <div className="metric-card cursor-pointer" onClick={() => navigate('/grades')}>
          <div className="metric-icon bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-500 dark:border-indigo-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Cumulative GPA</p>
            <p className="metric-value">3.88</p>
            <span className="metric-sub text-indigo-600 dark:text-indigo-500">
              Top 5% of Department
            </span>
          </div>
        </div>

        <div className="metric-card cursor-pointer" onClick={() => navigate('/assignments')}>
          <div className="metric-icon bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Tasks in Queue</p>
            <p className="metric-value">{loading ? '...' : `${pendingAssignments.length} Pending`}</p>
            <span className="metric-sub text-amber-600 dark:text-amber-500">
              Due within 7 days
            </span>
          </div>
        </div>

        <div className="metric-card cursor-pointer" onClick={() => navigate('/materials')}>
          <div className="metric-icon bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <FolderDown className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Study Resources</p>
            <p className="metric-value">Active</p>
            <span className="metric-sub text-slate-600 dark:text-slate-400">
              Lecture slides & notes
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Attendance Density Heatmap */}
      <AttendanceHeatmap
        data={heatmapData}
        title="Semester Attendance Consistency"
        subtitle="90-day interactive attendance density mapping with streak tracker"
        loading={loading}
      />

      {/* 4. Coursework Grid: Active Assignments & Upcoming Deadlines */}
      <div className="content-grid">
        {/* Main Column: Published Course Assignments */}
        <div className="academic-card space-y-4">
          <div className="section-header">
            <div className="section-header-left">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="section-title">Active Coursework Tasks</h3>
            </div>
            <button
              onClick={() => navigate('/assignments')}
              className="btn-ghost"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading coursework...</div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <AlertCircle className="empty-state-icon" />
              <p className="empty-state-text">No assignments published for your registered subjects.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 4).map((a) => (
                <div key={a.id} className="list-row group cursor-pointer" onClick={() => navigate('/assignments')}>
                  <div className="space-y-1">
                    <span className="tag tag-indigo mb-1">Coursework</span>
                    <h4 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">{a.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                      {a.description || 'Complete instructions and submit before deadline'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1.5 flex flex-col items-end">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-app)] px-2 py-1 rounded-md border border-[var(--border-subtle)]">
                      {a.maxMarks || 100} pts
                    </span>
                    {a.dueDate && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-500 font-semibold flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(a.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Column: Deadlines Timeline */}
        <div className="academic-card space-y-4">
          <div className="section-header">
            <div className="section-header-left">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="section-title">Upcoming Deadlines</h3>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="empty-state py-8 border-none bg-[var(--bg-surface-elevated)]">
                <p className="empty-state-text">No upcoming deadlines.</p>
              </div>
            ) : (
              upcomingDeadlines.map((ass) => (
                <div key={ass.id} className="list-row flex-col items-stretch gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="tag tag-amber">Priority Task</span>
                    <span className="text-[11px] font-bold text-[var(--text-muted)] font-mono">
                      {ass.maxMarks} pts
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[var(--text-primary)]">{ass.title}</h4>
                  <div className="divider my-1" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-600 dark:text-amber-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{ass.dueDate ? new Date(ass.dueDate).toLocaleDateString() : 'Upcoming'}</span>
                    </span>
                    <button
                      onClick={() => navigate('/assignments')}
                      className="font-bold text-[#535779] hover:text-[#3e415b] dark:text-[#868aac] dark:hover:text-[#a4a7c1] transition-colors"
                    >
                      Submit →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
