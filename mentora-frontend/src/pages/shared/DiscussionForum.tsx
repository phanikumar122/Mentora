import React, { useState, useEffect, useCallback } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { ThumbsUp, MessageSquare, Plus, Send, Trash2, ShieldAlert, X } from 'lucide-react';
import { DiscussionPost } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const DiscussionForum: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Ask question modal
  const [showAskModal, setShowAskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'ACADEMIC' | 'GENERAL' | 'EXAM_PREP' | 'PROJECTS'>('ACADEMIC');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Custom Delete Modal State
  const [deleteItem, setDeleteItem] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null); // FIXED CRITICAL-7

  const isAdmin = user?.role === 'ROLE_ADMIN';

  // INFO-3: useCallback to fix useEffect deps
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/discussions/posts');
      const formatted = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        authorName: item.author ? `${item.author.firstName} ${item.author.lastName}` : 'Anonymous Student',
        category: item.category || 'ACADEMIC',
        upvotesCount: item.upvotesCount || 0,
        repliesCount: item.replies ? item.replies.length : 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now',
      }));
      setPosts(formatted);
    } catch (err) {
      console.error('Failed to fetch discussion posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleUpvote = async (id: number) => {
    try {
      await api.put(`/discussions/posts/${id}/upvote`);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, upvotesCount: p.upvotesCount + 1 } : p));
    } catch (err) {
      console.error('Error upvoting post:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/discussions/posts/${deleteItem.id}`);
      setPosts(prev => prev.filter(p => p.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      // FIXED CRITICAL-5 & CRITICAL-7: no alert() — show error inside modal
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setCreateError(null);
      await api.post('/discussions/posts', {
        title,
        content,
        category,
        author: { id: user?.id },
      });
      setTitle('');
      setContent('');
      setShowAskModal(false);
      fetchPosts();
    } catch (err: any) {
      console.error('Error creating discussion post:', err);
      // FIXED CRITICAL-5: no alert() — show inline error
      setCreateError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Academic Discussion Forum</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ask questions, upvote solutions, and collaborate dynamically</p>
        </div>
        <button
          onClick={() => { setShowAskModal(true); setCreateError(null); }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Ask Question</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading discussion threads...</div>
      ) : posts.length === 0 ? (
        <div className="academic-card p-12 text-center rounded-2xl space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold">No Discussion Threads</h3>
          <p className="text-xs text-slate-500">Be the first to ask an academic question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="academic-card p-5 rounded-2xl flex space-x-4">
              <button
                onClick={() => handleUpvote(post.id)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-brand-500/10 hover:text-brand-500 border border-slate-200 dark:border-slate-700 h-fit transition-colors"
              >
                <ThumbsUp className="w-4 h-4 text-slate-500 hover:text-brand-500" />
                <span className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300">{post.upvotesCount}</span>
              </button>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-500 uppercase">{post.category}</span>
                    <span className="text-xs text-slate-400">• Posted by {post.authorName} • {post.createdAt}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setDeleteItem({ id: post.id, title: post.title }); setDeleteError(null); }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Discussion Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{post.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{post.content}</p>
                <div className="pt-2 flex items-center space-x-4 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.repliesCount} Replies</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Question Modal — FIXED CRITICAL-5: inline error banner */}
      {showAskModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Ask an Academic Question</h3>
              <button onClick={() => setShowAskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Question Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. How to balance Red-Black Trees in Java?"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="EXAM_PREP">Exam Prep</option>
                  <option value="PROJECTS">Projects</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Question Details</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  placeholder="Provide context or code snippets..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
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
                  <span>{submitting ? 'Posting...' : 'Post Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal — FIXED CRITICAL-7: error prop passed */}
      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        title="Delete Discussion Thread"
        message="Are you sure you want to permanently delete this discussion thread?"
        itemTitle={deleteItem?.title}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteItem(null); setDeleteError(null); }}
      />
    </div>
  );
};
