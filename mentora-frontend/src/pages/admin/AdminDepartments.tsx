import React, { useState, useEffect, useCallback } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { Building2, Plus, BookOpen, Send, X, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Department, Course } from '../../types';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const AdminDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState(4);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [courseSubmitting, setCourseSubmitting] = useState(false);

  // Custom Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'DEPT' | 'COURSE'; id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inline banners — FIXED CRITICAL-5
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };
  const showError = (msg: string) => { setErrorBanner(msg); setTimeout(() => setErrorBanner(null), 6000); };

  const fetchAcademicData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptRes, courseRes] = await Promise.all([
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] })),
      ]);
      setDepartments(deptRes.data || []);
      setCourses(courseRes.data || []);
      if ((deptRes.data || []).length > 0 && !selectedDeptId) {
        setSelectedDeptId(deptRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch academic records:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim()) return;

    try {
      setDeptSubmitting(true);
      await api.post('/departments', { code: deptCode, name: deptName, description: deptDesc });
      setDeptCode('');
      setDeptName('');
      setDeptDesc('');
      setShowDeptModal(false);
      fetchAcademicData();
      // FIXED CRITICAL-5: no alert() — inline banner
      showSuccess('Department created successfully!');
    } catch (err: any) {
      console.error('Error creating department:', err);
      showError(getApiErrorMessage(err));
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    try {
      setCourseSubmitting(true);
      await api.post('/courses', {
        code: courseCode,
        name: courseName,
        credits: courseCredits,
        department: selectedDeptId ? { id: selectedDeptId } : null,
      });
      setCourseCode('');
      setCourseName('');
      setShowCourseModal(false);
      fetchAcademicData();
      // FIXED CRITICAL-5: no alert() — inline banner
      showSuccess('New Course added and mapped to Department successfully!');
    } catch (err: any) {
      console.error('Error creating course:', err);
      showError(getApiErrorMessage(err));
    } finally {
      setCourseSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      if (deleteTarget.type === 'DEPT') {
        await api.delete(`/departments/${deleteTarget.id}`);
        setDepartments(prev => prev.filter(d => d.id !== deleteTarget.id));
      } else {
        await api.delete(`/courses/${deleteTarget.id}`);
        setCourses(prev => prev.filter(c => c.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Departments & Academic Allocation</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage university departments, add department-mapped courses, and credit allocations</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCourseModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
          <button
            onClick={() => setShowDeptModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-brand-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Inline success/error banners — FIXED CRITICAL-5 */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments List */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-brand-500" />
              <span>Active Departments ({departments.length})</span>
            </h3>
            <button
              onClick={() => setShowDeptModal(true)}
              className="text-xs font-semibold text-brand-500 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Dept</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No departments added yet.</div>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-500/10 text-brand-500">{dept.code}</span>
                    <button
                      onClick={() => setDeleteTarget({ type: 'DEPT', id: dept.id, name: dept.name })}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm mt-1">{dept.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{dept.description || 'No description provided.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Courses List */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Offered Courses ({courses.length})</span>
            </h3>
            <button
              onClick={() => setShowCourseModal(true)}
              className="text-xs font-semibold text-emerald-500 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <p>No courses configured.</p>
              <button
                onClick={() => setShowCourseModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium"
              >
                + Create First Course
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course: any) => (
                <div key={course.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-500">{course.code}</span>
                      <h4 className="font-bold text-sm">{course.name}</h4>
                    </div>
                    {course.department && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Dept: <strong className="text-slate-600 dark:text-slate-300">{course.department.name} ({course.department.code})</strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-500 font-semibold">{course.credits} Credits</span>
                    <button
                      onClick={() => setDeleteTarget({ type: 'COURSE', id: course.id, name: course.name })}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Add Department */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold">Add Department</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  required
                  placeholder="e.g. CSE"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  required
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  rows={3}
                  placeholder="Department details..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSubmitting}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                >
                  {deptSubmitting ? 'Creating...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Course */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold">Add Course mapped to Department</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  required
                  placeholder="e.g. CS201"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Credits</label>
                <input
                  type="number"
                  value={courseCredits}
                  onChange={(e) => setCourseCredits(Number(e.target.value))}
                  required
                  min={1}
                  max={6}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {courseSubmitting ? 'Adding...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Middle-of-Screen Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.type === 'DEPT' ? 'Delete University Department' : 'Delete Offered Course'}
        message={
          deleteTarget?.type === 'DEPT'
            ? 'Are you sure you want to permanently delete this department? All linked course allocations will be unlinked.'
            : 'Are you sure you want to permanently delete this offered course?'
        }
        itemTitle={deleteTarget?.name}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
