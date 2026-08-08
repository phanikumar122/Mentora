import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Calendar, Clock, Award, FileCheck, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Assignment } from '../../types';

interface CourseAttendance {
  courseId: number;
  courseName: string;
  courseCode: string;
  present: number;
  total: number;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAttendance, setOverallAttendance] = useState<number | null>(null);

  // FIXED MAJOR-4: Use useCallback to stabilize + fix useEffect deps (INFO-3)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [assRes] = await Promise.all([
        api.get('/assignments').catch(() => ({ data: [] })),
      ]);
      setAssignments(assRes.data || []);
    } catch (err) {
      console.error('Failed to fetch student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pendingAssignments = assignments.filter(a => {
    if (!a.dueDate) return false;
    return new Date(a.dueDate) > new Date();
  });

  const upcomingDeadlines = pendingAssignments.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Student Portal
          </span>
          <h2 className="text-2xl font-bold mt-2">Welcome back, {user?.firstName || 'Student'}!</h2>
          <p className="text-brand-100 text-sm mt-1 max-w-xl">
            You have <strong className="text-white font-semibold">{pendingAssignments.length} active assignment{pendingAssignments.length !== 1 ? 's' : ''}</strong> with upcoming deadlines. Stay on track!
          </p>
        </div>
      </div>

      {/* Metrics Row — FIXED MAJOR-4: live data where available */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overall Attendance</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overallAttendance !== null ? `${overallAttendance.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current CGPA</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">N/A</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Tasks</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {loading ? '...' : `${pendingAssignments.length} Due`}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Published Assignments</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {loading ? '...' : assignments.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Assignments */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold mb-4 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <span>Published Assignments</span>
          </h3>
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-8">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No assignments published yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 6).map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{a.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.description || 'No description provided'}</p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Max Marks</span>
                    <span className="text-sm font-bold text-brand-500">{a.maxMarks || '100'}</span>
                    {a.dueDate && (
                      <span className="text-[11px] text-amber-500 block mt-0.5 flex items-center space-x-0.5">
                        <Calendar className="w-3 h-3 inline" /> {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Upcoming Deadlines</span>
          </h3>
          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((ass) => (
                <div key={ass.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{ass.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ass.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-[11px] text-amber-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{ass.dueDate ? new Date(ass.dueDate).toLocaleDateString() : 'Upcoming'}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded text-[10px] font-bold">
                      {ass.maxMarks} pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
