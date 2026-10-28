import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import { 
  Calendar,
  Users,
  DollarSign,
  Star,
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { format, parseISO } from 'date-fns';

const DoctorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await doctorAPI.getDashboard();
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

  const { stats, recentAppointments } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome, Doctor!</h1>
        <p className="text-secondary-100">Here's your practice overview for today.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar}
          label="Today's Appointments"
          value={stats?.todayAppointments || 0}
          color="blue"
        />
        <StatCard 
          icon={Users}
          label="Total Patients"
          value={stats?.totalPatients || 0}
          color="green"
        />
        <StatCard 
          icon={DollarSign}
          label="This Month"
          value={`₹${(stats?.monthEarnings || 0).toLocaleString()}`}
          color="purple"
        />
        <StatCard 
          icon={Star}
          label="Rating"
          value={stats?.rating ? stats.rating.toFixed(1) : 'N/A'}
          suffix={stats?.totalRatings ? `(${stats.totalRatings})` : ''}
          color="amber"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/doctor/appointments"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">All Appointments</h3>
              <p className="text-sm text-slate-500">Manage your schedule</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/doctor/schedule"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">Set Availability</h3>
              <p className="text-sm text-slate-500">Update your schedule</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/doctor/prescriptions"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">Prescriptions</h3>
              <p className="text-sm text-slate-500">Add patient records</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Today's Schedule</h2>
          <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="p-4">
          {recentAppointments && recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <DoctorAppointmentCard key={appointment._id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No appointments scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, suffix, color }) => {
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
      <p className="text-2xl font-bold text-slate-800">
        {value}
        {suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};

// Appointment Card Component
const DoctorAppointmentCard = ({ appointment }) => {
  const patient = appointment.userId;

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
        {patient?.avatar ? (
          <img 
            src={patient.avatar} 
            alt={patient.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-primary-600">
            {patient?.name?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-800">{patient?.name}</p>
        <p className="text-sm text-slate-500">{appointment.reason || 'General consultation'}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-slate-800">{appointment.startTime}</p>
        <StatusBadge status={appointment.status} />
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusClasses = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusClasses[status] || statusClasses.pending}`}>
      {status}
    </span>
  );
};

export default DoctorDashboard;
