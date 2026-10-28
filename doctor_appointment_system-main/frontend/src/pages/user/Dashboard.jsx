import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, doctorAPI } from '../../services/api';
import { 
  Calendar, 
  FileText, 
  Bell, 
  ArrowRight,
  Clock,
  Stethoscope,
  Star
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { format, parseISO } from 'date-fns';

const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await userAPI.getDashboard();
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-primary-100">Here's an overview of your health journey with MediBook.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar}
          label="Upcoming"
          value={stats?.upcomingAppointments || 0}
          color="blue"
        />
        <StatCard 
          icon={FileText}
          label="Completed"
          value={stats?.completedAppointments || 0}
          color="green"
        />
        <StatCard 
          icon={FileText}
          label="Prescriptions"
          value={stats?.prescriptions || 0}
          color="purple"
        />
        <StatCard 
          icon={Bell}
          label="Notifications"
          value={stats?.unreadNotifications || 0}
          color="amber"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/doctors"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">Find a Doctor</h3>
              <p className="text-sm text-slate-500">Search specialists near you</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/appointments"
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">My Appointments</h3>
              <p className="text-sm text-slate-500">View and manage bookings</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Upcoming Appointments</h2>
          <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="p-4">
          {recentAppointments && recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <AppointmentCard key={appointment._id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No upcoming appointments</p>
              <Link 
                to="/doctors" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
              >
                Book an appointment
              </Link>
            </div>
          )}
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

// Appointment Card Component
const AppointmentCard = ({ appointment }) => {
  const doctor = appointment.doctorId;
  const doctorUser = doctor?.userId;

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
        {doctorUser?.avatar ? (
          <img 
            src={doctorUser.avatar} 
            alt={doctorUser.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-primary-600">
            {doctorUser?.name?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-800">Dr. {doctorUser?.name}</p>
        <p className="text-sm text-slate-500">{doctor?.specialty}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-slate-800">
          {format(parseISO(appointment.date), 'MMM dd')}
        </p>
        <p className="text-sm text-slate-500">{appointment.startTime}</p>
      </div>
      <StatusBadge status={appointment.status} />
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
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusClasses[status] || statusClasses.pending}`}>
      {status}
    </span>
  );
};

export default UserDashboard;
