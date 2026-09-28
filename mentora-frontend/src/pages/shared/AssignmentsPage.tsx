import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { FileCheck, Calendar, Upload, Plus, Clock, Send, Trash2, ShieldAlert, X, Users, Download, Award, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';
import { Assignment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

interface StudentSubmission {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  fileUrl: string;
  submittedAt: string;
  marksObtained: number | null;
  feedback: string | null;
  status: string;
}

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

  // Teacher View Submissions Modal State
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  // Teacher Grading State
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [marksInput, setMarksInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingMessage, setGradingMessage] = useState<{ id: number; text: string; error?: boolean } | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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

  // Submit solution to backend with file upload support
  const handleSubmitSolution = async () => {
    if (!selectedAssignment) return;
    try {
      setSubmissionSubmitting(true);
      setSubmissionError(null);

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (submissionNote) {
          formData.append('studentNote', submissionNote);
        }
        formData.append('fileName', selectedFile.name);

        await api.post(`/assignments/${selectedAssignment.id}/submissions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/assignments/${selectedAssignment.id}/submissions`, {
          studentNote: submissionNote,
          fileName: 'text_submission',
        });
      }

      setSubmissionSuccess(`Solution submitted for "${selectedAssignment.title}" successfully!`);
      setSubmissionNote('');
      setSelectedFile(null);
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmissionSuccess(null);
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting solution:', err);
      setSubmissionError(getApiErrorMessage(err) || 'Submission failed. Please try again.');
    } finally {
      setSubmissionSubmitting(false);
    }
  };

  // Open Teacher Submissions Viewer
  const handleOpenSubmissions = async (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setSubmissionsError(null);
    setGradingId(null);
    setGradingMessage(null);
    try {
      setLoadingSubmissions(true);
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      setSubmissionsList(res.data || []);
    } catch (err: any) {
      console.error('Failed to load submissions:', err);
      setSubmissionsError(getApiErrorMessage(err) || 'Could not load student submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Submit Grade / Feedback for a submission
  const handleGradeSubmission = async (submissionId: number) => {
    if (marksInput === '') return;
    try {
      setGradingLoading(true);
      setGradingMessage(null);
      await api.put(`/assignments/submissions/${submissionId}/grade`, {
        marksObtained: parseFloat(marksInput),
        feedback: feedbackInput,
      });

      setSubmissionsList(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, marksObtained: parseFloat(marksInput), feedback: feedbackInput, status: 'GRADED' }
            : sub
        )
      );

      setGradingMessage({ id: submissionId, text: 'Marks saved successfully!' });
      setTimeout(() => {
        setGradingId(null);
        setGradingMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to save grade:', err);
      setGradingMessage({ id: submissionId, text: getApiErrorMessage(err) || 'Failed to save grade.', error: true });
    } finally {
      setGradingLoading(false);
    }
  };

  // Download solution file securely via API blob
  const handleDownloadSolution = async (sub: StudentSubmission) => {
    if (!sub.fileUrl || sub.fileUrl === 'text_submission') return;

    try {
      setDownloadingId(sub.id);

      // 1. Direct download if data URL or blob URL
      if (sub.fileUrl.startsWith('data:') || sub.fileUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = sub.fileUrl;
        a.download = sub.fileUrl.split('/').pop() || `${sub.studentName.replace(/\s+/g, '_')}_solution.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // 2. Resolve endpoint on the backend
      let endpoint = sub.fileUrl;
      if (endpoint.startsWith('/api/v1')) {
        endpoint = endpoint.replace('/api/v1', '');
      } else if (endpoint.startsWith('/uploads/')) {
        endpoint = `/materials/files/${endpoint.replace('/uploads/', '')}`;
      } else if (!endpoint.startsWith('/')) {
        endpoint = `/materials/files/${endpoint}`;
      }

      const fileName = sub.fileUrl.split('/').pop() || `${sub.studentName.replace(/\s+/g, '_')}_solution.pdf`;

      const res = await api.get(endpoint, { responseType: 'blob' });
      const contentType = String(res.headers['content-type'] || 'application/pdf');
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Backend file fetch error, downloading submission summary receipt:', err);
      // Fallback: Generate submission summary text document
      const fallbackName = `${sub.studentName.replace(/\s+/g, '_')}_solution_receipt.txt`;
      const textContent = `==================================================\nMENTORA ACADEMIC SYSTEM - ASSIGNMENT SUBMISSION\n==================================================\nAssignment: ${viewingAssignment?.title || 'Assignment'}\nStudent: ${sub.studentName} (${sub.rollNumber || 'N/A'})\nEmail: ${sub.studentEmail}\nSubmitted At: ${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}\nStatus: ${sub.status}\nMarks: ${sub.marksObtained != null ? `${sub.marksObtained}/${viewingAssignment?.maxMarks}` : 'Pending Evaluation'}\n\nStudent Note / Submission Text:\n${sub.feedback || '(No note attached)'}\n==================================================\n[Mentora Academic Portal]`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fallbackName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Academic Assignments</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time assignment creation, student solution submissions, and teacher evaluations</p>
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
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex flex-col md:items-end space-y-2">
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Due: {item.dueDate}</span>
                </span>
                <div className="flex items-center space-x-2">
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
                    <>
                      <button
                        onClick={() => handleOpenSubmissions(item)}
                        className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-brand-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-brand-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="View Submitted Solutions"
                      >
                        <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>Submissions</span>
                      </button>
                      <button
                        onClick={() => { setDeleteItem({ id: item.id, title: item.title }); setDeleteError(null); }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
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

      {/* Student Submission Modal */}
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

      {/* Teacher Submissions Viewer Modal */}
      {viewingAssignment && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Submissions: {viewingAssignment.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                    {submissionsList.length} Submitted
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Max Marks: <span className="font-semibold text-slate-700 dark:text-slate-300">{viewingAssignment.maxMarks}</span> | Due: {viewingAssignment.dueDate}
                </p>
              </div>
              <button onClick={() => setViewingAssignment(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {submissionsError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{submissionsError}</span>
                </div>
              )}

              {loadingSubmissions ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading student submissions...</div>
              ) : submissionsList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Submissions Yet</h4>
                  <p className="text-xs text-slate-400">Students have not submitted any solutions for this assignment yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissionsList.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{sub.studentName}</span>
                            {sub.rollNumber && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {sub.rollNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{sub.studentEmail}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Submitted'}</span>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'GRADED'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {sub.status === 'GRADED' ? `Graded: ${sub.marksObtained}/${viewingAssignment.maxMarks}` : 'Pending Evaluation'}
                          </span>
                        </div>
                      </div>

                      {/* Student submission notes */}
                      {sub.feedback && (
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>Student Note</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{sub.feedback}</p>
                        </div>
                      )}

                      {/* File attachment & Grading actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {sub.fileUrl && sub.fileUrl !== 'text_submission' ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadSolution(sub)}
                            disabled={downloadingId === sub.id}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {downloadingId === sub.id ? 'Downloading...' : `Download Solution (${sub.fileUrl.split('/').pop()})`}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Text-only submission</span>
                        )}

                        <button
                          onClick={() => {
                            if (gradingId === sub.id) {
                              setGradingId(null);
                            } else {
                              setGradingId(sub.id);
                              setMarksInput(sub.marksObtained != null ? String(sub.marksObtained) : '');
                              setFeedbackInput(sub.feedback || '');
                              setGradingMessage(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-slate-700 dark:text-brand-300 text-xs font-semibold flex items-center space-x-1 border border-brand-200 dark:border-slate-600 transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{gradingId === sub.id ? 'Close Grading' : sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Solution'}</span>
                        </button>
                      </div>

                      {/* Inline Evaluation Panel */}
                      {gradingId === sub.id && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 space-y-3 mt-2">
                          <h5 className="text-xs font-bold text-brand-800 dark:text-brand-300 flex items-center space-x-1.5">
                            <Award className="w-3.5 h-3.5" />
                            <span>Grade & Evaluation Feedback</span>
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Marks Obtained (Max {viewingAssignment.maxMarks})
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={viewingAssignment.maxMarks}
                                value={marksInput}
                                onChange={(e) => setMarksInput(e.target.value)}
                                placeholder={`0 - ${viewingAssignment.maxMarks}`}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Evaluator Feedback
                              </label>
                              <input
                                type="text"
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                placeholder="e.g. Excellent methodology, clean logic!"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                          </div>

                          {gradingMessage && gradingMessage.id === sub.id && (
                            <div className={`p-2 rounded-lg text-xs font-semibold ${gradingMessage.error ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                              {gradingMessage.text}
                            </div>
                          )}

                          <div className="flex justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setGradingId(null)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGradeSubmission(sub.id)}
                              disabled={gradingLoading || marksInput === ''}
                              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{gradingLoading ? 'Saving...' : 'Save Evaluation'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingAssignment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
