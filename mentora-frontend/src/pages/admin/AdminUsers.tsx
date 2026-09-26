import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { getApiErrorMessage } from '../../services/api';
import { addAuditLog } from '../../services/auditService';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Search,
  CheckCircle,
  Trash2,
  Link2,
  UserCheck,
  HeartHandshake,
  ShieldAlert,
  GraduationCap,
  Unlink,
  UserX,
  Filter,
  Briefcase,
  UserCheck2,
} from 'lucide-react';
import { User, Role } from '../../types';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal';

interface EnhancedUser extends User {
  advisorName?: string;
  advisorId?: string;
  wardName?: string;
  wardId?: string;
  relationship?: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('ALL');

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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Inline success/error banners
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 6000);
  };

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

  const studentUsers = useMemo(() => users.filter((u) => u.role === 'ROLE_STUDENT'), [users]);
  const teacherUsers = useMemo(() => users.filter((u) => u.role === 'ROLE_TEACHER'), [users]);
  const parentUsers = useMemo(() => users.filter((u) => u.role === 'ROLE_PARENT'), [users]);
  const adminUsers = useMemo(() => users.filter((u) => u.role === 'ROLE_ADMIN'), [users]);

  // Students who do NOT have an assigned faculty advisor yet
  const unassignedStudents = useMemo(() => {
    return studentUsers.filter((s) => !s.advisorId && !s.advisorName);
  }, [studentUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) return;

    try {
      setSubmitting(true);
      await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role,
        phoneNumber,
      });
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setShowAddModal(false);
      fetchUsers();
      addAuditLog({
        action: 'User Registered',
        detail: `Created new ${role.replace('ROLE_', '')} account: ${firstName} ${lastName} (${email})`,
        type: 'SUCCESS',
      });
      showSuccess('New user account registered successfully!');
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

      const assignedTeacher = teacherUsers.find((t) => t.id === selectedTeacherId);
      const teacherName = assignedTeacher ? `Prof. ${assignedTeacher.firstName} ${assignedTeacher.lastName}` : 'Faculty Mentor';

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedStudentId
            ? { ...u, advisorId: selectedTeacherId, advisorName: teacherName }
            : u
        )
      );

      const targetStudent = studentUsers.find((s) => s.id === selectedStudentId);
      const studentName = targetStudent ? `${targetStudent.firstName} ${targetStudent.lastName}` : 'Student';

      addAuditLog({
        action: 'Mentor Assigned',
        detail: `Linked student ${studentName} to faculty advisor ${teacherName}`,
        type: 'SUCCESS',
      });

      showSuccess(res.data?.message || 'Student assigned to Faculty Mentor successfully!');
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

  const handleUnassignStudent = async (studentId: string) => {
    try {
      const targetStudent = users.find((u) => u.id === studentId);
      await api.post('/users/unassign-student-teacher', { studentUserId: studentId });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === studentId ? { ...u, advisorId: undefined, advisorName: undefined } : u
        )
      );
      addAuditLog({
        action: 'Mentor Unlinked',
        detail: `Unlinked faculty advisor for student ${targetStudent ? targetStudent.firstName + ' ' + targetStudent.lastName : 'ID ' + studentId}`,
        type: 'INFO',
      });
      showSuccess('Mentor unlinked successfully.');
    } catch (err: any) {
      showError(getApiErrorMessage(err));
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

      const targetStudent = studentUsers.find((s) => s.id === wardStudentId);
      const studentName = targetStudent ? `${targetStudent.firstName} ${targetStudent.lastName}` : 'Student Ward';

      setUsers((prev) =>
        prev.map((u) =>
          u.id === parentUserId
            ? { ...u, wardId: wardStudentId, wardName: studentName, relationship }
            : u
        )
      );

      addAuditLog({
        action: 'Parent Linked to Ward',
        detail: `Linked parent account to student ward ${studentName}`,
        type: 'SUCCESS',
      });

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
      setUsers((prev) => prev.filter((u) => u.id !== deleteItem.id));

      addAuditLog({
        action: 'User Account Deleted',
        detail: `Permanently removed user profile "${deleteItem.name}"`,
        type: 'DANGER',
      });

      showSuccess(`User "${deleteItem.name}" deleted successfully.`);
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.advisorName && u.advisorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.wardName && u.wardName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole =
        activeRoleFilter === 'ALL' ||
        (activeRoleFilter === 'STUDENT' && u.role === 'ROLE_STUDENT') ||
        (activeRoleFilter === 'TEACHER' && u.role === 'ROLE_TEACHER') ||
        (activeRoleFilter === 'PARENT' && u.role === 'ROLE_PARENT') ||
        (activeRoleFilter === 'ADMIN' && u.role === 'ROLE_ADMIN');

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, activeRoleFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management & Role Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create user accounts, assign faculty advisors, link parent guardians, and manage system permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowParentModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:border-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Link Parent to Ward</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:border-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-emerald-600" />
            <span>Assign Student to Mentor</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Users</p>
            <p className="text-xl font-bold text-slate-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Students</p>
            <p className="text-xl font-bold text-slate-900">{studentUsers.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Teachers</p>
            <p className="text-xl font-bold text-slate-900">{teacherUsers.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Parents</p>
            <p className="text-xl font-bold text-slate-900">{parentUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Banner Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2.5 shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2.5 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 self-start">
          {[
            { id: 'ALL', label: 'All Users', count: users.length },
            { id: 'STUDENT', label: 'Students', count: studentUsers.length },
            { id: 'TEACHER', label: 'Teachers', count: teacherUsers.length },
            { id: 'PARENT', label: 'Parents', count: parentUsers.length },
            { id: 'ADMIN', label: 'Admins', count: adminUsers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRoleFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label} <span className="ml-1 text-[10px] opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, or role..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading user Directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
            <UserX className="w-8 h-8 text-slate-300" />
            <p className="font-semibold text-slate-700">No matching user accounts found.</p>
            <p className="text-slate-400">Try adjusting your filter parameters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200/80 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Academic Association</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200/60 shrink-0 shadow-sm">
                        {u.firstName ? u.firstName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {u.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ROLE_ADMIN' && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200/80 rounded-md px-2.5 py-1 text-[11px] font-semibold inline-flex items-center space-x-1">
                          <Shield className="w-3 h-3 text-purple-600" />
                          <span>ADMIN</span>
                        </span>
                      )}
                      {u.role === 'ROLE_TEACHER' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md px-2.5 py-1 text-[11px] font-semibold inline-flex items-center space-x-1">
                          <Briefcase className="w-3 h-3 text-emerald-600" />
                          <span>TEACHER</span>
                        </span>
                      )}
                      {u.role === 'ROLE_STUDENT' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md px-2.5 py-1 text-[11px] font-semibold inline-flex items-center space-x-1">
                          <GraduationCap className="w-3 h-3 text-blue-600" />
                          <span>STUDENT</span>
                        </span>
                      )}
                      {u.role === 'ROLE_PARENT' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md px-2.5 py-1 text-[11px] font-semibold inline-flex items-center space-x-1">
                          <HeartHandshake className="w-3 h-3 text-amber-600" />
                          <span>PARENT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ROLE_STUDENT' && (
                        u.advisorName ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg font-semibold text-[11px] flex items-center space-x-1">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{u.advisorName}</span>
                            </span>
                            <button
                              onClick={() => handleUnassignStudent(u.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Unlink Faculty Mentor"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg font-semibold text-[11px]">
                            No Mentor Assigned
                          </span>
                        )
                      )}
                      {u.role === 'ROLE_PARENT' && (
                        u.wardName ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg font-semibold text-[11px] flex items-center space-x-1">
                            <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                            <span>Ward: {u.wardName}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200/60 rounded-lg font-semibold text-[11px]">
                            No Ward Linked
                          </span>
                        )
                      )}
                      {u.role === 'ROLE_TEACHER' && (
                        <span className="text-[11px] text-slate-500 font-medium">Faculty Member</span>
                      )}
                      {u.role === 'ROLE_ADMIN' && (
                        <span className="text-[11px] text-purple-700 font-medium">System Governance</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.phoneNumber || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right flex justify-end space-x-2">
                      {u.role === 'ROLE_STUDENT' && (
                        <button
                          onClick={() => { setSelectedStudentId(u.id); setShowAssignModal(true); }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg transition-colors font-medium text-xs flex items-center space-x-1 cursor-pointer"
                          title="Assign Faculty Mentor"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{u.advisorName ? 'Reassign' : 'Link Mentor'}</span>
                        </button>
                      )}
                      {u.role === 'ROLE_PARENT' && (
                        <button
                          onClick={() => { setParentUserId(u.id); setShowParentModal(true); }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 rounded-lg transition-colors font-medium text-xs flex items-center space-x-1 cursor-pointer"
                          title="Link Student Ward"
                        >
                          <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                          <span>{u.wardName ? 'Relink Ward' : 'Link Ward'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteItem({ id: u.id, name: `${u.firstName} ${u.lastName}` })}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600">
              <UserPlus className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900">Add System User</h3>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. John"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john.doe@mentora.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Set account password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="ROLE_STUDENT">Student</option>
                    <option value="ROLE_TEACHER">Teacher</option>
                    <option value="ROLE_PARENT">Parent / Guardian</option>
                    <option value="ROLE_ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Student to Teacher */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Link2 className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900">Assign Student to Faculty Advisor</h3>
            </div>
            <form onSubmit={handleAssignStudentToTeacher} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student --</option>
                  {(selectedStudentId
                    ? studentUsers.filter((st) => !st.advisorId || st.id === selectedStudentId)
                    : unassignedStudents
                  ).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.email}) {st.advisorName ? `[Currently: ${st.advisorName}]` : '[Unassigned]'}
                    </option>
                  ))}
                </select>
                {unassignedStudents.length === 0 && !selectedStudentId && (
                  <p className="text-[11px] text-amber-600 mt-1">All registered students currently have assigned faculty mentors.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Faculty Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teacherUsers.map((t) => (
                    <option key={t.id} value={t.id}>
                      Prof. {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600">
              <HeartHandshake className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-900">Link Parent to Student Ward</h3>
            </div>
            <form onSubmit={handleAssignParentToStudent} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Parent Account</label>
                <select
                  value={parentUserId}
                  onChange={(e) => setParentUserId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Parent --</option>
                  {parentUsers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student Ward</label>
                <select
                  value={wardStudentId}
                  onChange={(e) => setWardStudentId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student Ward --</option>
                  {studentUsers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  required
                  placeholder="Father / Mother / Guardian"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowParentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parentSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>{parentSubmitting ? 'Linking...' : 'Link Parent & Ward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteItem !== null}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account? All linked records and permissions will be purged."
        itemTitle={deleteItem?.name}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteItem(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
};
