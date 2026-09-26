import React, { useState, useEffect, useCallback } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { addAuditLog } from '../../services/auditService';
import { Megaphone, Clock, Plus, Send, RefreshCw, AlertCircle, Trash2, X, ShieldAlert } from 'lucide-react';
import { Announcement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states for creating announcement
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null); // CRITICAL-5 fix

  // Custom Delete Modal State
  const [deleteItem, setDeleteItem] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null); // CRITICAL-7 fix

  // MINOR-7: Only admins and teachers can post announcements
  const canPost = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_TEACHER';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  // INFO-3: useCallback to stabilize function reference
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/announcements');
      const formatted = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        authorName: item.author ? `${item.author.firstName} ${item.author.lastName}` : 'System Broadcast',
        priority: item.priority || 'MEDIUM',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now',
      }));
      setAnnouncements(formatted);
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err);
      setErrorMsg('Unable to connect to backend server. Make sure mentora-backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setCreateError(null);
      await api.post('/announcements', {
        title,
        content,
        priority,
        author: user?.id ? { id: user.id } : null,
      });
      addAuditLog({
        action: 'Campus Broadcast Published',
        detail: `New ${priority.toLowerCase()} announcement published: "${title}"`,
        type: priority === 'URGENT' ? 'DANGER' : 'INFO',
      });
      setTitle('');
      setContent('');
      setShowCreateModal(false);
      await fetchAnnouncements();
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      // FIXED CRITICAL-5: no alert() — show inline error banner
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
      await api.delete(`/announcements/${deleteItem.id}`);
      addAuditLog({
        action: 'Announcement Removed',
        detail: `Deleted announcement broadcast: "${deleteItem.title}"`,
        type: 'INFO',
      });
      setAnnouncements(prev => prev.filter(a => a.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      // FIXED CRITICAL-5 & CRITICAL-7: no alert() — show error inside delete modal
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Official Announcements</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time department notices and academic system broadcasts</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchAnnouncements}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl"
            title="Refresh Notices"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* FIXED MINOR-7: Only show "Post Announcement" button to Admin/Teacher */}
          {canPost && (
            <button
              onClick={() => { setShowCreateModal(true); setCreateError(null); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading live announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="academic-card p-12 text-center rounded-2xl space-y-3">
          <Megaphone className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold">No Announcements Published Yet</h3>
          <p className="text-xs text-slate-500">
            {canPost ? 'Click "Post Announcement" above to broadcast a notice to all students and faculty.' : 'No announcements have been posted yet. Check back soon!'}
          </p>
          {canPost && (
            <button
              onClick={() => { setShowCreateModal(true); setCreateError(null); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast First Announcement</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className="academic-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  item.priority === 'HIGH' || item.priority === 'URGENT'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                }`}>
                  {item.priority} Priority
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.createdAt}</span>
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => { setDeleteItem({ id: item.id, title: item.title }); setDeleteError(null); }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.content}</p>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-400">
                Broadcasted by <strong className="text-slate-700 dark:text-slate-200">{item.authorName}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Announcement — FIXED CRITICAL-5: inline error banner */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Broadcast Announcement</h3>
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

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Notice Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Mid-Semester Academic Schedule Update"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Announcement Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Detailed notice information for students and staff..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
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
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publishing...' : 'Broadcast Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal — FIXED CRITICAL-7: error prop passed */}
      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        title="Delete Official Announcement"
        message="Are you sure you want to permanently delete this broadcasted notice?"
        itemTitle={deleteItem?.title}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteItem(null); setDeleteError(null); }}
      />
    </div>
  );
};
