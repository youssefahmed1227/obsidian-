import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit,
  Shield,
  UserCheck,
  Building,
  Mail,
  KeyRound,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ArrowLeft,
  Briefcase,
  Layers,
  Sparkles,
  AlertTriangle,
  UserX,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SheetUser, CustomerRecord } from '../types';

interface UserManagementViewProps {
  users: SheetUser[];
  currentUser: SheetUser;
  customers: CustomerRecord[];
  onAddUser: (user: SheetUser) => { success: boolean; error?: string };
  onRemoveUser: (identifier: string) => { success: boolean; error?: string };
  onUpdateUser: (identifier: string, updates: Partial<SheetUser>) => { success: boolean; error?: string };
  onBackToDashboard: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  customers,
  onAddUser,
  onRemoveUser,
  onUpdateUser,
  onBackToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form states for new user
  const [newUserName, setNewUserName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Sales Agent'>('Sales Agent');
  const [newDepartment, setNewDepartment] = useState('UK Enterprise Accounts');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<SheetUser | null>(null);

  // Edit modal state
  const [userToEdit, setUserToEdit] = useState<SheetUser | null>(null);
  const [editRole, setEditRole] = useState<'Admin' | 'Sales Agent'>('Sales Agent');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Pre-calculate assigned accounts per user
  const accountsCountByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.assignedTo) {
        counts[c.assignedTo.toLowerCase()] = (counts[c.assignedTo.toLowerCase()] || 0) + 1;
      }
      if (c.assignedToEmail) {
        counts[c.assignedToEmail.toLowerCase()] = (counts[c.assignedToEmail.toLowerCase()] || 0) + 1;
      }
    });
    return counts;
  }, [customers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = u.userName.toLowerCase().includes(query);
        const matchEmail = u.email.toLowerCase().includes(query);
        const matchDept = u.department?.toLowerCase().includes(query) || false;
        if (!matchName && !matchEmail && !matchDept) return false;
      }
      return true;
    });
  }, [users, searchTerm]);

  const adminCount = users.filter((u) => u.role === 'Admin').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newUserName.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('Please enter a valid work email.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 3) {
      setFormError('Password must be at least 3 characters.');
      return;
    }

    const res = onAddUser({
      userName: newUserName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword.trim(),
      role: newRole,
      department: newDepartment.trim() || 'UK Operations',
    });

    if (res.success) {
      setFormSuccess(`User ${newUserName} successfully added!`);
      setNewUserName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Sales Agent');
      setNewDepartment('UK Enterprise Accounts');
      setTimeout(() => {
        setIsAddFormOpen(false);
        setFormSuccess(null);
      }, 1200);
    } else {
      setFormError(res.error || 'Failed to add user.');
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = onRemoveUser(userToDelete.userName);
    if (res.success) {
      setUserToDelete(null);
    } else {
      alert(res.error || 'Failed to remove user.');
    }
  };

  const handleOpenEdit = (user: SheetUser) => {
    setUserToEdit(user);
    setEditRole(user.role);
    setEditDepartment(user.department || 'UK Operations');
    setEditPassword(user.password || '');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    const res = onUpdateUser(userToEdit.userName, {
      role: editRole,
      department: editDepartment.trim(),
      password: editPassword.trim() || userToEdit.password,
    });

    if (res.success) {
      setUserToEdit(null);
    } else {
      setEditError(res.error || 'Failed to update user.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Return to CRM Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Team & User Management
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage user access credentials, assign RBAC permissions, and oversee team members.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-add-user-btn"
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
            >
              {isAddFormOpen ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Add New User</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-[#1f2937]/50 rounded-xl p-3 border border-slate-800">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Team Members</p>
            <p className="text-2xl font-bold text-white mt-0.5">{users.length}</p>
          </div>
          <div className="bg-[#1f2937]/50 rounded-xl p-3 border border-slate-800">
            <p className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">Assigned Accounts</p>
            <p className="text-2xl font-bold text-white mt-0.5">{customers.length}</p>
          </div>
          <div className="bg-[#1f2937]/50 rounded-xl p-3 border border-slate-800">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Active Directories</p>
            <p className="text-2xl font-bold text-white mt-0.5">{filteredUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Add User Collapsible Card */}
      {isAddFormOpen && (
        <div className="rounded-2xl border border-indigo-900/50 bg-[#111827] p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Create New CRM User Account</h2>
                <p className="text-xs text-slate-400">Add a new team member account to the CRM.</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddFormOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. james.wilson"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                  required
                />
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Work Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. james.wilson@crm.co.uk"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Initial Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password (e.g. 1234)"
                    className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-3 pr-9 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  User Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'Admin' | 'Sales Agent')}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-xs text-white focus:border-[#6366f1] focus:outline-none"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Department */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Department / Office Location
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. UK Enterprise Accounts, London Office"
                    className="flex-1 rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                  />
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-slate-500">Presets:</span>
                    {['London Sales', 'UK Mid-Market', 'Global Solutions'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewDepartment(p)}
                        className="rounded bg-slate-800 px-2 py-1 text-slate-300 hover:text-white text-[10px] border border-slate-700"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md"
              >
                Register User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#111827] p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username, email, department..."
            className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Total Team Members:</span>
          <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {filteredUsers.length}
          </span>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#1f2937]/70 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Assigned Accounts</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent =
                    u.userName.toLowerCase() === currentUser.userName.toLowerCase() ||
                    u.email.toLowerCase() === currentUser.email.toLowerCase();
                  const assignedCount =
                    accountsCountByUser[u.userName.toLowerCase()] ||
                    accountsCountByUser[u.email.toLowerCase()] ||
                    0;

                  return (
                    <tr
                      key={u.userName}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                              u.role === 'Admin'
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-sm'
                                : 'bg-gradient-to-br from-indigo-500 to-blue-600'
                            }`}
                          >
                            {u.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-white">
                              <span>{u.userName}</span>
                              {isCurrent && (
                                <span className="rounded bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0.2 border border-indigo-500/30 font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {u.userName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {u.email}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{u.department || 'UK Operations'}</span>
                        </div>
                      </td>

                      {/* Assigned Accounts */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-slate-300 font-medium">
                          {assignedCount} {assignedCount === 1 ? 'account' : 'accounts'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete Button (Disabled for current self or last admin) */}
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isCurrent || (u.role === 'Admin' && adminCount <= 1)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent || (u.role === 'Admin' && adminCount <= 1)
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                            }`}
                            title={
                              isCurrent
                                ? 'Cannot delete your own active Admin account'
                                : u.role === 'Admin' && adminCount <= 1
                                ? 'Cannot delete the only remaining Admin'
                                : 'Remove User Account'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove User Account</h3>
                <p className="text-xs text-slate-400">Revoke access from the CRM system</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove user{' '}
              <strong className="text-white font-mono">{userToDelete.userName}</strong> ({userToDelete.email})?
              This action will immediately revoke their ability to log into Obsidian CRM.
            </p>

            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-[11px] text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Any client accounts assigned to this user will remain intact in the database and can be reassigned by an Admin.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {userToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit User: {userToEdit.userName}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{userToEdit.email}</p>
                </div>
              </div>
              <button
                onClick={() => setUserToEdit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {editError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-rose-800/60 bg-rose-950/40 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block font-semibold text-slate-300">User Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'Admin' | 'Sales Agent')}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-[#6366f1] focus:outline-none"
                >
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block font-semibold text-slate-300">Department</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g. UK Corporate Accounts"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-[#6366f1] focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-300">Reset Password (Optional)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New password"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-[#6366f1] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
