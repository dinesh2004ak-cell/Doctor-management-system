import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { 
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { format, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading size="lg" className="py-20" />;
  }

  const { stats, appointmentsByStatus, recentAppointments, recentUsers } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">Monitor and manage your healthcare platform</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers || 0}
          color="blue"
        />
        <StatCard 
          icon={Stethoscope}
          label="Active Doctors"
          value={stats?.totalDoctors || 0}
          color="green"
        />
        <StatCard 
          icon={Calendar}
          label="Today's Appointments"
          value={stats?.todayAppointments || 0}
          color="purple"
        />
        <StatCard 
          icon={DollarSign}
          label="Month Revenue"
          value={`₹${(stats?.monthRevenue || 0).toLocaleString()}`}
          color="amber"
        />
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/doctors"
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Approvals</p>
              <p className="text-3xl font-bold text-amber-600">{stats?.pendingDoctors || 0}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-primary-600 mt-2 flex items-center gap-1">
            Review doctors <ArrowRight className="w-4 h-4" />
          </p>
        </Link>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">This Week</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats?.weekAppointments || 0}</p>
          <p className="text-sm text-slate-500">Appointments</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">Commission</p>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {stats?.commissionRate || 10}%
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800">₹{(stats?.monthCommission || 0).toLocaleString()}</p>
          <p className="text-sm text-slate-500">This month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Appointments</h2>
            <Link to="/admin/appointments" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentAppointments && recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.slice(0, 5).map((apt) => (
                  <div key={apt._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {apt.userId?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{apt.userId?.name}</p>
                      <p className="text-xs text-slate-500">
                        Dr. {apt.doctorId?.userId?.name} • {format(parseISO(apt.date), 'MMM dd')}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-4">No recent appointments</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {format(parseISO(user.createdAt), 'MMM dd')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-4">No recent users</p>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Appointment Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {appointmentsByStatus?.map((item) => (
            <div key={item._id} className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800">{item.count}</p>
              <p className="text-sm text-slate-500 capitalize">{item._id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600'
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusClasses = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusClasses[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
};

export default AdminDashboard;
