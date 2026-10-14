import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Layers,
  Eye,
  Check,
} from 'lucide-react';
import api from '../../services/api.ts';
import { User, PaginationMeta, Task } from '../../types/client.ts';
import { AccountStatusBadge } from '../../components/common/Badge.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editEmployee, setEditEmployee] = useState<User | null>(null);
  const [viewEmployee, setViewEmployee] = useState<{ employee: User; tasks: Task[] } | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{ employee: User; newStatus: boolean } | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchEmployees = async (page = pagination.page, limit = pagination.limit) => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: {
          page,
          limit,
          search: search.trim(),
          department,
          isActive: statusFilter,
        },
      });

      if (res.data.success) {
        setEmployees(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1, pagination.limit);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, department, statusFilter]);

  const handlePageChange = (newPage: number) => {
    fetchEmployees(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchEmployees(1, newLimit);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      department: 'Engineering',
      isActive: true,
    });
    setFormError(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (emp: User) => {
    setEditEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '',
      department: emp.department || 'Engineering',
      isActive: emp.isActive,
    });
    setFormError(null);
  };

  const openViewModal = async (emp: User) => {
    try {
      const res = await api.get(`/employees/${emp._id}`);
      if (res.data.success) {
        setViewEmployee(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to view employee details', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        setSuccessToast(`Employee "${formData.name}" added successfully.`);
        setCreateModalOpen(false);
        fetchEmployees(1, pagination.limit);
      } else {
        setFormError(res.data.message || 'Failed to create employee.');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error creating employee.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;

    setFormError(null);
    setFormLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        isActive: formData.isActive,
      };
      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password;
      }

      const res = await api.put(`/employees/${editEmployee._id}`, payload);
      if (res.data.success) {
        setSuccessToast(`Employee details updated successfully.`);
        setEditEmployee(null);
        fetchEmployees(pagination.page, pagination.limit);
      } else {
        setFormError(res.data.message || 'Failed to update employee.');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error updating employee.');
    } finally {
      setFormLoading(false);
    }
  };

  const executeStatusToggle = async () => {
    if (!toggleConfirm) return;
    const { employee, newStatus } = toggleConfirm;

    try {
      const res = await api.patch(`/employees/${employee._id}/status`, {
        isActive: newStatus,
      });
      if (res.data.success) {
        setSuccessToast(
          `Employee ${employee.name} has been ${newStatus ? 'activated' : 'deactivated'}.`
        );
        fetchEmployees(pagination.page, pagination.limit);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change employee status.');
    } finally {
      setToggleConfirm(null);
    }
  };

  const departments = ['ALL', 'Engineering', 'Frontend Engineering', 'Backend Architecture', 'Quality Assurance & DevOps', 'Product & Design', 'Operations'];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Team Directory
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {pagination.total} members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your team members, department assignments, and account permissions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Assigned Tasks</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading employee directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{emp.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{emp.department}</td>
                    <td className="py-3 px-4">
                      <AccountStatusBadge isActive={emp.isActive} />
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800 tabular-nums">
                      {emp.assignedTasksCount ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-600 tabular-nums">
                      {emp.completedTasksCount ?? 0}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openViewModal(emp)}
                          title="View Assigned Tasks"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Employee"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setToggleConfirm({
                              employee: emp,
                              newStatus: !emp.isActive,
                            })
                          }
                          title={emp.isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded transition-colors ${
                            emp.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {emp.isActive ? (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Add New Employee</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex.morgan@xploreintellects.com"
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Frontend Engineering">Frontend Engineering</option>
                  <option value="Backend Architecture">Backend Architecture</option>
                  <option value="Quality Assurance & DevOps">Quality Assurance & DevOps</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Edit Employee: {editEmployee.name}
              </h3>
              <button
                onClick={() => setEditEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password (optional)"
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Frontend Engineering">Frontend Engineering</option>
                  <option value="Backend Architecture">Backend Architecture</option>
                  <option value="Quality Assurance & DevOps">Quality Assurance & DevOps</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditEmployee(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS & ASSIGNED TASKS MODAL */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {viewEmployee.employee.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewEmployee.employee.email} &bull; {viewEmployee.employee.department}
                </p>
              </div>
              <button
                onClick={() => setViewEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assigned Pipeline Tasks ({viewEmployee.tasks.length})
                </h4>
              </div>

              {viewEmployee.tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No tasks assigned to this employee currently.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                  {viewEmployee.tasks.map((t) => (
                    <div key={t._id} className="p-3 text-xs flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] text-indigo-600 font-semibold mr-2">
                          {t.taskIdentifier}
                        </span>
                        <span className="font-semibold text-slate-900">{t.title}</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewEmployee(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS TOGGLE */}
      <ConfirmDialog
        isOpen={!!toggleConfirm}
        title={toggleConfirm?.newStatus ? 'Activate Employee Account' : 'Deactivate Employee Account'}
        message={
          toggleConfirm?.newStatus
            ? `Are you sure you want to activate ${toggleConfirm.employee.name}'s account? They will be able to log in and update assigned tasks.`
            : `Are you sure you want to deactivate ${toggleConfirm?.employee.name}'s account? They will be blocked from logging in, accessing APIs, and receiving new assignments.`
        }
        confirmLabel={toggleConfirm?.newStatus ? 'Activate Account' : 'Deactivate Account'}
        variant={toggleConfirm?.newStatus ? 'primary' : 'danger'}
        onConfirm={executeStatusToggle}
        onCancel={() => setToggleConfirm(null)}
      />
    </div>
  );
};
