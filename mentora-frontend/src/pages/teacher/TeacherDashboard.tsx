import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../services/api';
import { Users, FileText, CheckSquare, Upload, Plus, Send, X, BookOpen, FileCheck, ShieldAlert } from 'lucide-react';
import { Subject, Assignment } from '../../types';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Assignment Form State
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState(100);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Material Form State
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matType, setMatType] = useState<'DOCUMENT' | 'SLIDES' | 'VIDEO_LINK' | 'CODE_SAMPLE'>('DOCUMENT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [matSubmitting, setMatSubmitting] = useState(false);
  const [matError, setMatError] = useState<string | null>(null);

  // INFO-4: stabilize with useCallback to fix useEffect deps
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [subsRes, assRes, usersRes] = await Promise.all([
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/assignments').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
      ]);

      setSubjects(subsRes.data || []);
      setAssignments(assRes.data || []);
      const studentsCount = (usersRes.data || []).filter((u: any) => u.role === 'ROLE_STUDENT').length;
      setTotalStudents(studentsCount);
    } catch (err) {
      console.error('Error loading teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    try {
      setAssignSubmitting(true);
      setAssignError(null);
      await api.post('/assignments', {
        title: assignTitle,
        description: assignDesc,
        maxMarks: assignMaxMarks,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setAssignTitle('');
      setAssignDesc('');
      setShowAssignmentModal(false);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setAssignError(getApiErrorMessage(err));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;

    const fName = selectedFile ? selectedFile.name : `${matTitle.replace(/\s+/g, '_')}.pdf`;
    const fSize = selectedFile ? formatFileSize(selectedFile.size) : '2.1 MB';

    try {
      setMatSubmitting(true);
      setMatError(null);
      await api.post('/materials', {
        title: matTitle,
        description: matDesc,
        materialType: matType,
        fileName: fName,
        fileSize: fSize,
        fileUrl: `/uploads/${fName}`,
      });
      setMatTitle('');
      setMatDesc('');
      setSelectedFile(null);
      setShowMaterialModal(false);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Error uploading material:', err);
      setMatError(getApiErrorMessage(err));
    } finally {
      setMatSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Faculty Banner with Active Buttons */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Faculty Portal
            </span>
            <h2 className="text-2xl font-bold mt-2">Welcome, {user?.firstName ? `Prof. ${user.lastName}` : 'Faculty Member'}</h2>
            <p className="text-slate-400 text-sm mt-1">
              Associate Professor — Academic Management Dashboard
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => { setShowAssignmentModal(true); setAssignError(null); }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-brand-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
            <button
              onClick={() => { setShowMaterialModal(true); setMatError(null); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Registered Students</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalStudents}</h3>
            </div>
            <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published Assignments</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{assignments.length}</h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Subjects</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">{subjects.length}</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Subjects List */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <span>My Teaching Subjects</span>
          </h3>
          <button
            onClick={() => navigate('/attendance')}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Mark Class Attendance
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p>No active subjects assigned yet.</p>
            <button onClick={() => navigate('/admin/departments')} className="px-3 py-1.5 bg-brand-600 text-white rounded-xl font-medium cursor-pointer">
              Go to Academic Management
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub) => (
              <div key={sub.id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-brand-500/10 text-brand-500 font-bold text-xs">{sub.code}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.name}</h4>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500">Active Subject</span>
                  <button
                    onClick={() => navigate('/attendance')}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Manage Class Roster
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Create Assignment */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Create New Assignment</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                  placeholder="e.g. Implementation of Red-Black Trees"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Max Marks</label>
                <input
                  type="number"
                  value={assignMaxMarks}
                  onChange={(e) => setAssignMaxMarks(Number(e.target.value))}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Instructions / Description</label>
                <textarea
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  required
                  rows={4}
                  placeholder="Detailed assignment instructions for students..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{assignSubmitting ? 'Publishing...' : 'Publish Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Upload Material with File Picker */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Upload Study Material & File</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {matError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{matError}</span>
              </div>
            )}

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Resource Title</label>
                <input
                  type="text"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  required
                  placeholder="e.g. Chapter 4 Lecture Slides PDF"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Resource Type</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DOCUMENT">Document (PDF / DOC / DOCX)</option>
                  <option value="SLIDES">Presentation Slides (PPT / PPTX / PDF)</option>
                  <option value="CODE_SAMPLE">Source Code / Archive (ZIP / JAVA / PY)</option>
                  <option value="VIDEO_LINK">Video Lecture Link / MP4</option>
                </select>
              </div>

              {/* Interactive File Attachment Picker */}
              <div>
                <label className="block text-xs font-semibold mb-1">File Attachment (PDF, DOC, PPT, ZIP)</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-800/40 relative hover:border-brand-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.tar.gz,.java,.py,.cpp,.mp4"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2 text-emerald-500 font-semibold text-xs">
                      <FileCheck className="w-5 h-5" />
                      <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-brand-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to choose or drag PDF / DOC file here</p>
                      <p className="text-[10px] text-slate-400">Supports PDF, DOCX, PPTX, ZIP, Code files (Max 50MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Resource Description</label>
                <textarea
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Brief description of the material..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={matSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{matSubmitting ? 'Uploading...' : 'Upload Resource File'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
