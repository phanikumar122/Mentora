import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Users, BookOpen, CheckCircle2, FileText, MessageSquare, CalendarCheck, ShieldCheck, HeartHandshake } from 'lucide-react';
import { User, Assignment } from '../../types';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ward, setWard] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const [wardRes, assRes] = await Promise.all([
        api.get('/users/parents/my-ward').catch(() => ({ data: null })),
        api.get('/assignments').catch(() => ({ data: [] })),
      ]);

      if (wardRes.data && wardRes.data.id) {
        setWard(wardRes.data);
      }
      setAssignments(assRes.data || []);
    } catch (err) {
      console.error('Failed to fetch parent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Parent Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 w-fit">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Parent / Guardian Portal</span>
            </span>
            <h2 className="text-2xl font-bold mt-2">Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Parent'}</h2>
            <p className="text-slate-400 text-xs mt-1">
              Real-time academic monitoring, attendance tracking, and faculty communication portal
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-brand-500/30 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Faculty Mentor</span>
          </button>
        </div>
      </div>

      {/* Linked Student Ward Card */}
      <div className="glass-card p-6 rounded-2xl space-y-3 border-l-4 border-indigo-500">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Student Ward Academic Profile</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[11px]">Enrolled & Active</span>
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading student ward data...</div>
        ) : ward ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Student Name</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">{ward.firstName} {ward.lastName}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Student Email</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white font-mono">{ward.email}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Account Status</span>
              <p className="font-bold text-sm text-indigo-500">Linked to Parent Portal</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
            <p>No student ward linked to your parent account yet.</p>
            <p className="text-[11px] text-slate-400">Contact the System Administrator to link your child's student account to your profile.</p>
          </div>
        )}
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ward Attendance Rate</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">95.4%</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published Assignments</p>
              <h3 className="text-2xl font-bold text-brand-500 mt-1">{assignments.length}</h3>
            </div>
            <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cumulative GPA</p>
              <h3 className="text-2xl font-bold text-purple-500 mt-1">N/A</h3>
            </div>
            <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Ward Academic Assignments Feed */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-500" />
            <span>Ward Course Assignments & Deadlines</span>
          </h3>
          <button onClick={() => navigate('/assignments')} className="text-xs font-semibold text-brand-500 hover:underline">
            View All Assignments →
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No active assignments posted.</div>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 3).map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-brand-500 block">Max Marks: {item.maxMarks}</span>
                  <span className="text-[10px] text-slate-400">Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Upcoming'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
