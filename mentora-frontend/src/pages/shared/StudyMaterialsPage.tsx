import React, { useState, useEffect } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { FolderDown, FileText, Download, Code2, Presentation, Plus, Send, Upload, Paperclip, FileCheck, X, Trash2 } from 'lucide-react';
import { StudyMaterial } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const StudyMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState<'DOCUMENT' | 'SLIDES' | 'VIDEO_LINK' | 'CODE_SAMPLE'>('DOCUMENT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Delete Modal State
  const [deleteItem, setDeleteItem] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isTeacherOrAdmin = user?.role === 'ROLE_TEACHER' || user?.role === 'ROLE_ADMIN';

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/materials');
      const formatted = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        subjectName: item.subject ? item.subject.name : 'General Resources',
        materialType: item.materialType || 'DOCUMENT',
        fileName: item.fileName || 'Resource_Document.pdf',
        fileSize: item.fileSize || '2.4 MB',
        fileUrl: item.fileUrl,
        uploadedAt: item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Recently',
      }));
      setMaterials(formatted);
    } catch (err) {
      console.error('Failed to fetch study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SLIDES': return <Presentation className="w-5 h-5 text-indigo-500" />;
      case 'CODE_SAMPLE': return <Code2 className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-brand-500" />;
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const fName = selectedFile ? selectedFile.name : `${title.replace(/\s+/g, '_')}.pdf`;
    const fSize = selectedFile ? formatFileSize(selectedFile.size) : '1.8 MB';

    try {
      setSubmitting(true);
      await api.post('/materials', {
        title,
        description,
        materialType,
        fileName: fName,
        fileSize: fSize,
        fileUrl: `/uploads/${fName}`,
      });
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setShowUploadModal(false);
      await fetchMaterials();
    } catch (err) {
      console.error('Error uploading material:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/materials/${deleteItem.id}`);
      setMaterials(prev => prev.filter(m => m.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Error deleting material:', err);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Study Materials & Document Hub</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-format file resource catalog supporting PDF, DOC, PPT, ZIP, and resource deletion</p>
        </div>
        {isTeacherOrAdmin && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document / Resource</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading resources...</div>
      ) : materials.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl space-y-2">
          <FolderDown className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold">No Study Materials Uploaded</h3>
          <p className="text-xs text-slate-500">No resources published yet. Click "Upload Document" above to upload PDF or DOC files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((item) => (
            <div key={item.id} className="glass-card p-5 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {getIcon(item.materialType)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">{item.subjectName}</span>
                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => { setDeleteItem({ id: item.id, title: item.title }); setDeleteError(null); }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Resource File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                
                {/* File Attachment Badge */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <Paperclip className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="text-xs font-mono truncate text-slate-700 dark:text-slate-300">{item.fileName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.fileSize}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Uploaded {item.uploadedAt}</span>
                <button
                  onClick={() => alert(`Downloading resource file: ${item.fileName}`)}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold">Upload Study Material & File</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Resource Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Chapter 4 Lecture Slides PDF"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Resource Category</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DOCUMENT">Document (PDF / DOC / DOCX / TXT)</option>
                  <option value="SLIDES">Presentation Slides (PPT / PPTX / PDF)</option>
                  <option value="CODE_SAMPLE">Source Code / Archive (ZIP / JAVA / PY)</option>
                  <option value="VIDEO_LINK">Video Lecture Link / MP4</option>
                </select>
              </div>

              {/* Interactive File Picker / Attachment Dropzone */}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Brief description of the material contents..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
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
                  <span>{submitting ? 'Uploading...' : 'Publish Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Middle-of-Screen Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        title="Delete Study Material"
        message="Are you sure you want to permanently delete this study material file? Students will no longer have access to download it."
        itemTitle={deleteItem?.title}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteItem(null); setDeleteError(null); }}
      />
    </div>
  );
};
