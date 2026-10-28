import { useState, useEffect } from 'react';
import { userAPI, appointmentAPI } from '../../services/api';
import { 
  Calendar,
  Clock,
  Star,
  FileText,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format, parseISO, differenceInHours, isBefore, startOfDay } from 'date-fns';

const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab, page]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let status;
      if (activeTab === 'upcoming') {
        status = 'pending,confirmed';
      } else if (activeTab === 'completed') {
        status = 'completed';
      } else if (activeTab === 'cancelled') {
        status = 'cancelled,no_show';
      }

      const response = await userAPI.getAppointments({ status, page, limit: 10 });
      setAppointments(response.data.data.appointments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.cancel(appointmentId, 'Cancelled by user');
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: null },
    { id: 'completed', label: 'Completed', count: null },
    { id: 'cancelled', label: 'Cancelled', count: null }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
        <p className="text-slate-500 mt-1">View and manage your appointments</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <Loading size="lg" className="py-12" />
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment._id} 
                  appointment={appointment}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No {activeTab} appointments</h3>
              <p className="text-slate-500">
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming appointments"
                  : `No ${activeTab} appointments to show`
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
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
      </div>
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({ appointment, onCancel }) => {
  const doctor = appointment.doctorId;
  const doctorUser = doctor?.userId;
  const appointmentDate = parseISO(appointment.date);
  const now = new Date();
  const appointmentDateTime = new Date(appointmentDate);
  const [hours, minutes] = appointment.startTime.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);
  
  const hoursUntil = differenceInHours(appointmentDateTime, now);
  const canCancel = ['pending', 'confirmed'].includes(appointment.status) && hoursUntil >= 24;
  const isPast = isBefore(appointmentDateTime, now);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending Confirmation' };
      case 'confirmed':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmed' };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completed' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' };
      case 'no_show':
        return { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'No Show' };
      default:
        return { color: 'bg-slate-100 text-slate-700', icon: Calendar, label: status };
    }
  };

  const statusInfo = getStatusInfo(appointment.status);

  return (
    <div className="bg-slate-50 rounded-xl p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Doctor info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {doctorUser?.avatar ? (
              <img 
                src={doctorUser.avatar} 
                alt={doctorUser.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-primary-600">
                {doctorUser?.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Dr. {doctorUser?.name}</h3>
            <p className="text-sm text-slate-500">{doctor?.specialty}</p>
          </div>
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{format(appointmentDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-5 h-5" />
            <span className="text-sm">{appointment.startTime}</span>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Fee and actions */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500">Total Paid</p>
            <p className="text-lg font-bold text-slate-800">₹{appointment.totalFee}</p>
          </div>
          {appointment.reason && (
            <div className="text-sm text-slate-600">
              <span className="text-slate-500">Reason:</span> {appointment.reason}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {appointment.status === 'completed' && (
            <button className="px-4 py-2 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-lg hover:bg-secondary-200 transition-colors flex items-center gap-2">
              <Star className="w-4 h-4" />
              Rate
            </button>
          )}
          {canCancel && (
            <button 
              onClick={() => onCancel(appointment._id)}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
          {hoursUntil < 24 && hoursUntil > 0 && appointment.status === 'confirmed' && (
            <span className="text-xs text-amber-600">
              Cancellation not allowed within 24 hours
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAppointments;
