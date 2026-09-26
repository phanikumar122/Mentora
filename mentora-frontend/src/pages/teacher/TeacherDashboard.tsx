import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../services/api';
import { addAuditLog } from '../../services/auditService';
import {
  Users,
  FileText,
  Upload,
  Plus,
  Send,
  X,
  BookOpen,
  FileCheck,
  ShieldAlert,
  GraduationCap,
  MessageSquare,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { Subject, Assignment } from '../../types';

interface AdviseeStudent {
  id: string;
  studentEntityId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  rollNumber?: string;
  semester?: number;
  cgpa?: number;
  departmentName?: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [myAdvisees, setMyAdvisees] = useState<AdviseeStudent[]>([]);
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [subsRes, assRes, advRes] = await Promise.all([
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/assignments').catch(() => ({ data: [] })),
        api.get('/users/teachers/my-students').catch(() => ({ data: [] })),
      ]);

      setSubjects(subsRes.data || []);
      setAssignments(assRes.data || []);
      const advisees = advRes.data || [];
      setMyAdvisees(advisees);
      setTotalStudents(advisees.length);
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
      addAuditLog({
        action: 'Coursework Published',
        detail: `Faculty created new assignment "${assignTitle}" (${assignMaxMarks} marks)`,
        type: 'INFO',
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

    try {
      setMatSubmitting(true);
      setMatError(null);

      if (selectedFile) {
        const formData = new FormData();
        formData.append('title', matTitle);
        formData.append('description', matDesc || '');
        formData.append('materialType', matType);
        formData.append('file', selectedFile);

        await api.post('/materials/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const fName = `${matTitle.replace(/\s+/g, '_')}.pdf`;
        await api.post('/materials', {
          title: matTitle,
          description: matDesc,
          materialType: matType,
          fileName: fName,
          fileSize: '1.0 MB',
          fileUrl: `/uploads/${fName}`,
        });
      }

      addAuditLog({
        action: 'Study Material Uploaded',
        detail: `Faculty published resource "${matTitle}" (${matType})`,
        type: 'INFO',
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
    <>
      {/* Faculty Hero Command Banner */}
      <div className="hero-banner">
        <div className="hero-banner-inner">
          <div className="space-y-1">
            <h2 className="hero-title">
              Welcome, {user?.firstName ? `Prof. ${user.firstName} ${user.lastName}` : 'Faculty Member'}
            </h2>
            <p className="hero-subtitle">
              Coursework administration, lecture material distribution, advisee mentorship, and classroom attendance governance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0 mt-4 lg:mt-0">
            <button
              onClick={() => { setShowAssignmentModal(true); setAssignError(null); }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
            <button
              onClick={() => { setShowMaterialModal(true); setMatError(null); }}
              className="btn-ghost"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card cursor-pointer" onClick={() => navigate('/attendance')}>
          <div className="metric-icon bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Assigned Scholars</p>
            <p className="metric-value">{myAdvisees.length}</p>
            <span className="metric-sub text-indigo-600">
              Assigned advisees & attendance
            </span>
          </div>
        </div>

        <div className="metric-card cursor-pointer" onClick={() => navigate('/assignments')}>
          <div className="metric-icon bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Published Course Tasks</p>
            <p className="metric-value">{assignments.length}</p>
            <span className="metric-sub text-amber-600 dark:text-amber-500">
              Coursework in progress
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="metric-label">Assigned Advisees</p>
            <p className="metric-value">{myAdvisees.length}</p>
            <span className="metric-sub text-emerald-600 dark:text-emerald-500">
              1:1 Mentored scholars
            </span>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Advisees & Mentored Students Section */}
        <div className="academic-card space-y-4">
          <div className="section-header">
            <div className="section-header-left">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              <h3 className="section-title">Faculty Advisees & Mentorship Roster</h3>
            </div>
            <span className="tag tag-indigo">
              {myAdvisees.length} Mentored
            </span>
          </div>

          {myAdvisees.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No students currently assigned as your mentees.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {myAdvisees.map((adv) => (
                <div key={adv.id} className="list-row group">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      {adv.firstName} {adv.lastName}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">{adv.email}</p>
                    <span className="tag tag-indigo mt-1 inline-flex">
                      {adv.departmentName || 'Computer Science'} • Sem {adv.semester || 4}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/chat')}
                    className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-500 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors cursor-pointer"
                    title="Message Advisee"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teaching Subjects List */}
        <div className="academic-card space-y-4">
          <div className="section-header">
            <div className="section-header-left">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="section-title">My Teaching Subjects</h3>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <div className="empty-state border-none bg-[var(--bg-surface-elevated)]">
              <p className="empty-state-text">No active subjects assigned yet.</p>
              <button onClick={() => navigate('/admin/departments')} className="btn-primary mt-2">
                Go to Academic Management
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((sub) => (
                <div key={sub.id} className="list-row flex-col items-stretch gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="tag tag-brand">{sub.code}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{sub.name}</h4>
                  <div className="divider my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Active Subject</span>
                    <button
                      onClick={() => navigate('/attendance')}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 mr-1.5 inline" /> Mark Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Create Assignment */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold font-display">Create New Assignment</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
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
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">Assignment Title</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                  placeholder="e.g. Implementation of Red-Black Trees"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#535779]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">Max Marks</label>
                <input
                  type="number"
                  value={assignMaxMarks}
                  onChange={(e) => setAssignMaxMarks(Number(e.target.value))}
                  required
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#535779]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">Instructions / Description</label>
                <textarea
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  required
                  rows={4}
                  placeholder="Detailed assignment instructions for students..."
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#535779]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="btn-primary"
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
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold font-display">Upload Study Material & File</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
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
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">Resource Title</label>
                <input
                  type="text"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  required
                  placeholder="e.g. Chapter 4 Lecture Slides PDF"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#535779]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">Resource Type</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#535779]"
                >
                  <option value="DOCUMENT">Document (PDF / DOC / DOCX)</option>
                  <option value="SLIDES">Presentation Slides (PPT / PPTX / PDF)</option>
                  <option value="CODE_SAMPLE">Source Code / Archive (ZIP / JAVA / PY)</option>
                  <option value="VIDEO_LINK">Video Lecture Link / MP4</option>
                </select>
              </div>

              {/* Interactive File Attachment Picker */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">File Attachment (PDF, DOC, PPT, ZIP)</label>
                <div className="border-2 border-dashed border-[var(--border-strong)] rounded-xl p-4 text-center bg-[var(--bg-surface-elevated)] relative hover:border-[#535779] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.tar.gz,.java,.py,.cpp,.mp4"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2 text-emerald-600 font-semibold text-xs">
                      <FileCheck className="w-5 h-5" />
                      <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-[#535779] mx-auto" />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Click to choose or drag file here</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Supports PDF, DOCX, PPTX, ZIP, Code files (Max 50MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">Resource Description</label>
                <textarea
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Brief description of the material..."
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#535779]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={matSubmitting}
                  className="btn-primary"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{matSubmitting ? 'Uploading...' : 'Upload Resource File'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
