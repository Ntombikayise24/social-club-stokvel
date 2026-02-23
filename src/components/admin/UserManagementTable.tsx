import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Download,
  Filter,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Shield,
  Star,
  MoreVertical,
  UserPlus,
  Send
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  lastActive?: string;
  totalContributions: number;
  stokvelCount: number;
  role: 'member' | 'admin' | 'treasurer';
}

interface UserManagementTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onApprove: (userId: number) => void;
  onBulkAction: (action: string, userIds: number[]) => void;
  onSendMessage?: (userIds: number[]) => void;
}

export default function UserManagementTable({
  users,
  onEdit,
  onDelete,
  onApprove,
  onBulkAction,
}: UserManagementTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filter users based on status and role
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      return true;
    });
  }, [users, statusFilter, roleFilter]);

  // Define columns
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
              {row.original.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-gray-900">{row.original.name}</div>
              <div className="text-sm text-gray-500 flex items-center space-x-2">
                <Mail className="w-3 h-3" />
                <span>{row.original.email}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-3 h-3" />
            <span>{row.original.phone}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`px-3 py-1 inline-flex items-center text-xs font-medium rounded-full ${
                status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : status === 'inactive'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
              {status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
              {status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <span
              className={`px-3 py-1 inline-flex items-center text-xs font-medium rounded-full ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : role === 'treasurer'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
              {role === 'treasurer' && <Star className="w-3 h-3 mr-1" />}
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          );
        },
      },
      {
        accessorKey: 'stokvelCount',
        header: 'Stokvels',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 font-medium px-3 py-1 bg-primary-50 rounded-full">
            {row.original.stokvelCount}
          </span>
        ),
      },
      {
        accessorKey: 'totalContributions',
        header: 'Contributions',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 font-semibold">
            R {row.original.totalContributions.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'joinedDate',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.joinedDate}</span>
        ),
      },
      {
        accessorKey: 'lastActive',
        header: 'Last Active',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.lastActive || 'Never'}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(row.original)}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit user"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {row.original.status === 'pending' && (
              <button
                onClick={() => onApprove(row.original.id)}
                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve user"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(row.original.id)}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onApprove]
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedUserCount = Object.keys(rowSelection).length;

  const handleBulkAction = (action: string) => {
    const selectedIds = Object.keys(rowSelection)
      .map(key => filteredUsers[parseInt(key)]?.id)
      .filter(id => id !== undefined);
    
    onBulkAction(action, selectedIds);
    setRowSelection({});
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              placeholder="Search users by name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="treasurer">Treasurer</option>
              <option value="admin">Admin</option>
            </select>

            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Advanced filters">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>

            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Export">
              <Download className="w-5 h-5 text-gray-600" />
            </button>

            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>

            <button className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUserCount > 0 && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <span className="text-sm text-primary-700 font-medium">
              <strong>{selectedUserCount}</strong> user(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleBulkAction('message')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setRowSelection({})}
                className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center space-x-1 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="w-4 h-4 ml-1" />,
                            desc: <ChevronDown className="w-4 h-4 ml-1" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    row.getIsSelected() ? 'bg-primary-50' : ''
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
              <span className="font-medium">{table.getPageCount()}</span>
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
          <p className="text-xs text-gray-400 mt-1">All registered users</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Currently active</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {users.filter(u => u.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Contributions</p>
          <p className="text-2xl font-bold text-primary-600">
            R {users.reduce((sum, u) => sum + u.totalContributions, 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Across all stokvels</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg per User</p>
          <p className="text-2xl font-bold text-purple-600">
            R {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.totalContributions, 0) / users.length).toLocaleString() : 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Average contribution</p>
        </div>
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}