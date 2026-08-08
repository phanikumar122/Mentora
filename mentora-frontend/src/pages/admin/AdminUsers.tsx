import React, { useState, useEffect, useCallback } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { Users, UserPlus, Shield, Mail, Phone, Search, CheckCircle, Trash2, Link2, UserCheck, HeartHandshake, ShieldAlert, X } from 'lucide-react';
import { User, Role } from '../../types';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('ROLE_STUDENT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Assign Student to Teacher Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Assign Parent to Student Modal
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentUserId, setParentUserId] = useState('');
  const [wardStudentId, setWardStudentId] = useState('');
  const [relationship, setRelationship] = useState('Parent/Guardian');
  const [parentSubmitting, setParentSubmitting] = useState(false);

  // Custom Delete Modal State
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null); // FIXED MINOR-8

  // Inline success/error banners — FIXED CRITICAL-5 (replaces all alert() calls)
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 6000); };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const studentUsers = users.filter(u => u.role === 'ROLE_STUDENT');
  const teacherUsers = users.filter(u => u.role === 'ROLE_TEACHER');
  const parentUsers = users.filter(u => u.role === 'ROLE_PARENT');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) return;

    try {
      setSubmitting(true);
      await api.post('/auth/register', {
        email, password, firstName, lastName, role, phoneNumber,
      });
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setShowAddModal(false);
      fetchUsers();
      // FIXED CRITICAL-5: replaced alert() with inline banner
      showSuccess('New user registered successfully!');
    } catch (err: any) {
      showError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignStudentToTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedTeacherId) return;

    try {
      setAssignSubmitting(true);
      const res = await api.post('/users/assign-student-teacher', {
        studentUserId: selectedStudentId,
        teacherUserId: selectedTeacherId,
      });
      // FIXED CRITICAL-5: replaced alert() with inline banner
      showSuccess(res.data?.message || 'Student assigned to Teacher successfully!');
      setShowAssignModal(false);
      setSelectedStudentId('');
      setSelectedTeacherId('');
    } catch (err: any) {
      console.error('Error assigning student:', err);
      showError(getApiErrorMessage(err));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleAssignParentToStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentUserId || !wardStudentId) return;

    try {
      setParentSubmitting(true);
      const res = await api.post('/users/assign-parent-student', {
        parentUserId,
        studentUserId: wardStudentId,
        relationship,
      });
      // FIXED CRITICAL-5: replaced alert() with inline banner
      showSuccess(res.data?.message || 'Parent linked to Student ward successfully!');
      setShowParentModal(false);
      setParentUserId('');
      setWardStudentId('');
    } catch (err: any) {
      console.error('Error assigning parent:', err);
      showError(getApiErrorMessage(err));
    } finally {
      setParentSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/users/${deleteItem.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      // FIXED MINOR-8: show error inside modal instead of alert()
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">User Management & Role Governance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full administrative control: create users, assign students to teachers, link parents, and manage accounts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowParentModal(true)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Link Parent to Student</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Assign Student to Teacher</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Inline success/error banners — FIXED CRITICAL-5 */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter users by name, email, or role..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                        {u.firstName[0]}
                      </div>
                      <span>{u.firstName} {u.lastName}</span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        u.role === 'ROLE_ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                        u.role === 'ROLE_TEACHER' ? 'bg-indigo-500/10 text-indigo-500' :
                        u.role === 'ROLE_PARENT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-500/10 text-brand-500'
                      }`}>
                        {u.role.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{u.phoneNumber || 'N/A'}</td>
                    <td className="p-4 text-right flex justify-end space-x-2">
                      {u.role === 'ROLE_STUDENT' && (
                        <button
                          onClick={() => { setSelectedStudentId(u.id); setShowAssignModal(true); }}
                          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-lg transition-colors font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                          title="Assign Faculty Mentor"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Link Teacher</span>
                        </button>
                      )}
                      {u.role === 'ROLE_PARENT' && (
                        <button
                          onClick={() => { setParentUserId(u.id); setShowParentModal(true); }}
                          className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-600 text-purple-500 hover:text-white rounded-lg transition-colors font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                          title="Link Student Ward"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>Link Ward</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteItem({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold">Add System User</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="ROLE_STUDENT">Student</option>
                    <option value="ROLE_TEACHER">Teacher</option>
                    <option value="ROLE_PARENT">Parent / Guardian</option>
                    <option value="ROLE_ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
                >
                  {submitting ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Student to Teacher */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold">Assign Student to Faculty Advisor</h3>
            <form onSubmit={handleAssignStudentToTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- Choose Student --</option>
                  {studentUsers.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Select Faculty Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teacherUsers.map(t => (
                    <option key={t.id} value={t.id}>Prof. {t.firstName} {t.lastName} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{assignSubmitting ? 'Linking...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Link Parent to Student Ward */}
      {showParentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold">Link Parent to Student Ward</h3>
            <form onSubmit={handleAssignParentToStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Parent Account</label>
                <select
                  value={parentUserId}
                  onChange={(e) => setParentUserId(e.target.value)}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- Choose Parent --</option>
                  {parentUsers.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Select Student Ward</label>
                <select
                  value={wardStudentId}
                  onChange={(e) => setWardStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">-- Choose Student Ward --</option>
                  {studentUsers.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Relationship</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  required
                  placeholder="Father / Mother / Guardian"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParentModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parentSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>{parentSubmitting ? 'Linking...' : 'Link Parent & Ward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Middle-of-Screen Delete Confirmation Modal — FIXED MINOR-8: error prop passed */}
      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account? All linked records and permissions will be purged."
        itemTitle={deleteItem?.name}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteItem(null); setDeleteError(null); }}
      />
    </div>
  );
};
