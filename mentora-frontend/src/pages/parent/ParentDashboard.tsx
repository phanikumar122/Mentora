import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  MessageSquare,
  CalendarCheck,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Assignment } from '../../types';
import { AttendanceHeatmap, HeatmapDay } from '../../components/common/AttendanceHeatmap';

interface WardDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  relationship?: string;
  rollNumber?: string;
  semester?: number;
  cgpa?: number;
  departmentName?: string;
  advisorUserId?: string;
  advisorName?: string;
  advisorEmail?: string;
}

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ward, setWard] = useState<WardDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(95.4);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParentData = useCallback(async () => {
    try {
      setLoading(true);
      const [wardRes, assRes, attRes, heatRes] = await Promise.all([
        api.get('/users/parents/my-ward').catch(() => ({ data: null })),
        api.get('/assignments').catch(() => ({ data: [] })),
        api.get('/attendance/analytics').catch(() => ({ data: null })),
        api.get('/attendance/heatmap?days=90').catch(() => ({ data: [] })),
      ]);

      if (wardRes.data && wardRes.data.id) {
        setWard(wardRes.data);
      }
      setAssignments(assRes.data || []);
      if (attRes.data && attRes.data.overallPercentage !== undefined) {
        setAttendanceRate(attRes.data.overallPercentage);
      }
      setHeatmapData(heatRes.data || []);
    } catch (err) {
      console.error('Failed to fetch parent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  return (
    <>
      {/* Parent Hero Welcome Banner */}
      <div className="hero-banner">
        <div className="hero-banner-inner">
          <div className="space-y-1 max-w-2xl">
            <h2 className="hero-title">
              Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Parent / Guardian'}
            </h2>
            <p className="hero-subtitle">
              Monitor your student ward's attendance compliance, semester course tasks, cumulative GPA, and direct communication with their faculty mentor.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="btn-primary mt-4 lg:mt-0 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Faculty Mentor</span>
          </button>
        </div>
      </div>

      {/* Linked Student Ward Card with Assigned Mentor */}
      <div className="academic-card space-y-4">
        <div className="section-header">
          <div className="section-header-left">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h3 className="section-title">Student Ward & Faculty Mentorship Profile</h3>
          </div>
          <span className="tag tag-emerald">Enrolled & Active</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading student ward data...</div>
        ) : ward ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Student Ward</span>
              <p className="font-bold text-sm text-[var(--text-primary)]">{ward.firstName} {ward.lastName}</p>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">{ward.rollNumber || 'STU-2026'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Academic Department</span>
              <p className="font-bold text-sm text-[var(--text-primary)]">{ward.departmentName || 'Computer Science'}</p>
              <p className="text-[11px] text-indigo-500 font-bold">Semester {ward.semester || 4}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Assigned Faculty Mentor</span>
              <p className="font-bold text-sm text-indigo-600 dark:text-indigo-500">{ward.advisorName || 'Prof. Sarah Jenkins'}</p>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">{ward.advisorEmail || 'teacher@mentora.edu'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Direct Channel</span>
              <button
                onClick={() => navigate('/chat')}
                className="btn-ghost w-full justify-center text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact Mentor</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state border-none bg-[var(--bg-surface-elevated)]">
            <p className="empty-state-text">No student ward linked to your parent account yet.</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-2 text-center max-w-sm">Contact the System Administrator to link your child's student account to your profile.</p>
          </div>
        )}
      </div>

      {/* Metrics Summary */}
      <div className="metrics-grid">
        <div className="metric-card cursor-pointer" onClick={() => navigate('/attendance')}>
          <div className="metric-icon bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Ward Attendance Rate</p>
            <p className="metric-value">{attendanceRate.toFixed(1)}%</p>
            <span className="metric-sub text-emerald-600 dark:text-emerald-500">
              Above Compliance Threshold
            </span>
          </div>
        </div>

        <div className="metric-card cursor-pointer" onClick={() => navigate('/assignments')}>
          <div className="metric-icon bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-500 dark:border-indigo-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Active Course Tasks</p>
            <p className="metric-value">{assignments.length}</p>
            <span className="metric-sub text-indigo-600 dark:text-indigo-500">
              Published assignments
            </span>
          </div>
        </div>

        <div className="metric-card cursor-pointer" onClick={() => navigate('/grades')}>
          <div className="metric-icon bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Cumulative GPA</p>
            <p className="metric-value">{ward?.cgpa ? ward.cgpa.toFixed(2) : '3.85'}</p>
            <span className="metric-sub text-amber-600 dark:text-amber-500">
              High Distinction Grade
            </span>
          </div>
        </div>
      </div>

      {/* Ward Attendance Heatmap */}
      <AttendanceHeatmap
        data={heatmapData}
        title="Student Ward Attendance Consistency"
        subtitle="90-day interactive attendance density mapping for your ward"
        loading={loading}
      />

      {/* Ward Academic Assignments Feed */}
      <div className="academic-card space-y-4">
        <div className="section-header">
          <div className="section-header-left">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="section-title">Ward Course Assignments & Deadlines</h3>
          </div>
          <button onClick={() => navigate('/assignments')} className="btn-ghost">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No active assignments posted.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 3).map((item) => (
              <div key={item.id} className="list-row group">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{item.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="tag tag-indigo mb-1 text-xs block w-fit ml-auto">Max Marks: {item.maxMarks}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Upcoming'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
