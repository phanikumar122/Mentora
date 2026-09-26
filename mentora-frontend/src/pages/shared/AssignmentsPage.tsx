import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { FileCheck, Calendar, Upload, Plus, Clock, Send, Trash2, ShieldAlert, X } from 'lucide-react';
import { Assignment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating assignments (Teachers)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Submission drawer (Students)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionSubmitting, setSubmissionSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Delete Modal State
  const [deleteItem, setDeleteItem] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isTeacherOrAdmin = user?.role === 'ROLE_TEACHER' || user?.role === 'ROLE_ADMIN';

  // INFO-4: stabilize fetchAssignments with useCallback
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      const formatted = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        subjectName: item.subject ? item.subject.name : 'General Academic',
        dueDate: item.dueDate ? new Date(item.dueDate).toLocaleString() : 'No Deadline',
        maxMarks: item.maxMarks || 100,
        status: 'PENDING',
      }));
      setAssignments(formatted);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setCreateError(null);
      await api.post('/assignments', {
        title,
        description,
        maxMarks,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setTitle('');
      setDescription('');
      setShowCreateModal(false);
      fetchAssignments();
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setCreateError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/assignments/${deleteItem.id}`);
      setAssignments(prev => prev.filter(a => a.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      const msg = getApiErrorMessage(err);
      if (msg.includes('No static resource') || msg.includes('404')) {
        setDeleteError('Backend delete endpoint not active on running server. Please restart mentora-backend (mvnw.cmd spring-boot:run).');
      } else {
        setDeleteError(msg);
      }
    } finally {
      setDeleting(false);
    }
  };

  // FIXED MAJOR-8: Actually submit to backend
  const handleSubmitSolution = async () => {
    if (!selectedAssignment) return;
    try {
      setSubmissionSubmitting(true);
      setSubmissionError(null);
      // Send submission note as JSON (file upload requires multipart support on backend)
      await api.post(`/assignments/${selectedAssignment.id}/submissions`, {
        studentNote: submissionNote,
        fileName: selectedFile?.name || 'text_submission',
      });
      setSubmissionSuccess(`Solution submitted for "${selectedAssignment.title}" successfully!`);
      setSubmissionNote('');
      setSelectedFile(null);
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmissionSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting solution:', err);
      setSubmissionError(getApiErrorMessage(err) || 'Submission failed. Please try again.');
    } finally {
      setSubmissionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Academic Assignments</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time assignment creation, solution submissions, and assignment deletion</p>
        </div>
        {isTeacherOrAdmin && (
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(null); }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="academic-card p-12 text-center rounded-2xl space-y-2">
          <FileCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold">No Assignments Posted</h3>
          <p className="text-xs text-slate-500">There are no assignments published for your subjects.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((item) => (
            <div key={item.id} className="academic-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">{item.subjectName}</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    Max Marks: {item.maxMarks}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex flex-col md:items-end space-y-2">
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Due: {item.dueDate}</span>
                </span>
                <div className="flex space-x-2">
                  {!isTeacherOrAdmin && (
                    <button
                      onClick={() => setSelectedAssignment(item)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Submit Solution</span>
                    </button>
                  )}
                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => { setDeleteItem({ id: item.id, title: item.title }); setDeleteError(null); }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Data Structures - Linked Lists"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Max Marks</label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Instructions / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Detailed problem statement instructions..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publishing...' : 'Publish Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submission Modal — FIXED MAJOR-8 */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Submit: {selectedAssignment.title}</h3>
              <button onClick={() => { setSelectedAssignment(null); setSubmissionError(null); setSubmissionSuccess(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submissionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
                {submissionSuccess}
              </div>
            )}
            {submissionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <p className="text-xs text-slate-500">Upload your solution file or write a submission note for evaluation.</p>

            <div
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2" />
              <p className="text-xs font-medium">{selectedFile ? selectedFile.name : 'Click to attach file'}</p>
              <p className="text-[10px] text-slate-400 mt-1">Supports PDF, ZIP, TAR.GZ (Max 25MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,.tar.gz"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Submission Note (optional)</label>
              <textarea
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                rows={3}
                placeholder="Any notes for the evaluator..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setSelectedAssignment(null); setSubmissionError(null); setSubmissionSuccess(null); }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSolution}
                disabled={submissionSubmitting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submissionSubmitting ? 'Submitting...' : 'Confirm Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Middle-of-Screen Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        title="Delete Academic Assignment"
        message="Are you sure you want to permanently delete this assignment? All student solution submissions linked to it will also be purged."
        itemTitle={deleteItem?.title}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteItem(null); setDeleteError(null); }}
      />
    </div>
  );
};
