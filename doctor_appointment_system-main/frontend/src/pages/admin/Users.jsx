import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Eye,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (searchQuery) params.search = searchQuery;

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await adminAPI.getUser(userId);
      setSelectedUser(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const handleToggleActive = async (userId) => {
    setActionLoading(true);
    try {
      await adminAPI.toggleUserActive(userId);
      toast.success('User status updated');
      fetchUsers();
      setShowDetailModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-slate-500 mt-1">View and manage platform users</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <Loading size="lg" className="py-12" />
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Appointments</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-primary-600">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.appointmentsCount || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {format(parseISO(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(user._id)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No users found</h3>
            <p className="text-slate-500">Try adjusting your search</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.pages}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser.user}
          stats={selectedUser.stats}
          onClose={() => { setShowDetailModal(false); setSelectedUser(null); }}
          onToggleActive={handleToggleActive}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// User Detail Modal
const UserDetailModal = ({ user, stats, onClose, onToggleActive, actionLoading }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">User Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{user.name}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full mt-1 inline-block ${
                user.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <Calendar className="w-6 h-6 mx-auto text-primary-600 mb-1" />
              <p className="text-xl font-bold text-slate-800">{stats?.totalAppointments || 0}</p>
              <p className="text-xs text-slate-500">Appointments</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-1" />
              <p className="text-xl font-bold text-slate-800">{stats?.completedAppointments || 0}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <FileText className="w-6 h-6 mx-auto text-purple-600 mb-1" />
              <p className="text-xl font-bold text-slate-800">{stats?.prescriptions || 0}</p>
              <p className="text-xs text-slate-500">Prescriptions</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Phone</span>
              <span className="text-slate-800">{user.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Role</span>
              <span className="text-slate-800 capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Joined</span>
              <span className="text-slate-800">{format(parseISO(user.createdAt), 'MMMM dd, yyyy')}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={() => onToggleActive(user._id)}
            disabled={actionLoading}
            className={`w-full py-3 font-medium rounded-lg transition-colors disabled:opacity-50 ${
              user.isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {user.isActive ? 'Deactivate User' : 'Activate User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
