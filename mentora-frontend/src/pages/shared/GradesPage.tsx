import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, BookOpen, Calculator } from 'lucide-react';
import { Course } from '../../types';

export const GradesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch academic courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Grades & Course Credits</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review enrolled course credits, letter grades, and academic performance</p>
      </div>

      {/* CGPA Summary Banner — FIXED MAJOR-5: no hardcoded values */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-brand-500/20">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">Academic Performance Report</span>
          <h3 className="text-2xl font-bold mt-2">Cumulative GPA: N/A</h3>
          <p className="text-brand-100 text-xs mt-1">
            Total Enrolled Courses: {courses.length} Course{courses.length !== 1 ? 's' : ''} &mdash; Grades will appear once faculty submit marks
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-xl">
          ?
        </div>
      </div>

      {/* Course Breakdown */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-sm flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <span>Registered Courses & Credit Allocation</span>
        </h3>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading course credits...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p>No registered courses in your academic record yet.</p>
            <p className="text-[11px] text-slate-400">System Administrators can add courses under Manage Departments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-500/10 text-brand-500">{c.code}</span>
                    <h4 className="font-semibold text-sm">{c.name}</h4>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-semibold">{c.credits} Credits</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-bold text-xs rounded-lg">
                    Enrolled
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
