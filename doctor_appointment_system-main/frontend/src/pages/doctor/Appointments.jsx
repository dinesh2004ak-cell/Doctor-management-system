import { useState, useEffect } from 'react';
import { doctorAPI, appointmentAPI } from '../../services/api';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'today') {
        response = await doctorAPI.getTodayAppointments();
        setAppointments(response.data.data);
      } else {
        const params = {};
        if (activeTab === 'pending') params.status = 'pending';
        else if (activeTab === 'completed') params.status = 'completed';
        else if (activeTab === 'cancelled') params.status = 'cancelled,no_show';
        
        response = await doctorAPI.getAppointments(params);
        setAppointments(response.data.data.appointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, appointmentId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'confirm':
          await appointmentAPI.confirm(appointmentId);
          toast.success('Appointment confirmed');
          break;
        case 'complete':
          await appointmentAPI.complete(appointmentId);
          toast.success('Appointment marked as completed');
          break;
        case 'noShow':
          await appointmentAPI.markNoShow(appointmentId);
          toast.success('Marked as no-show');
          break;
        case 'cancel':
          await appointmentAPI.cancel(appointmentId, 'Cancelled by doctor');
          toast.success('Appointment cancelled');
          break;
      }
      setShowModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
        <p className="text-slate-500 mt-1">Manage your patient appointments</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
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
                  onViewDetails={() => {
                    setSelectedAppointment(appointment);
                    setShowModal(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No appointments</h3>
              <p className="text-slate-500">
                {activeTab === 'today' 
                  ? "No appointments scheduled for today"
                  : `No ${activeTab} appointments`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {showModal && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => { setShowModal(false); setSelectedAppointment(null); }}
          onAction={handleAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({ appointment, onViewDetails }) => {
  const patient = appointment.userId;

  return (
    <div className="bg-slate-50 rounded-xl p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Patient info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {patient?.avatar ? (
              <img 
                src={patient.avatar} 
                alt={patient.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-primary-600">
                {patient?.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">{patient?.name}</h3>
            <p className="text-sm text-slate-500">{patient?.email}</p>
            <p className="text-sm text-slate-500">{patient?.phone}</p>
          </div>
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{format(parseISO(appointment.date), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-5 h-5" />
            <span className="text-sm">{appointment.startTime}</span>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        {/* Action */}
        <button
          onClick={onViewDetails}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          View Details
        </button>
      </div>

      {/* Reason */}
      {appointment.reason && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Reason:</span> {appointment.reason}
          </p>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    confirmed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    completed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle },
    no_show: { color: 'bg-red-100 text-red-700', icon: AlertCircle }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status === 'no_show' ? 'No Show' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Appointment Modal Component
const AppointmentModal = ({ appointment, onClose, onAction, loading }) => {
  const patient = appointment.userId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Appointment Details</h2>
            <p className="text-sm text-slate-500">{format(parseISO(appointment.date), 'MMMM dd, yyyy')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Patient info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Patient Information</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  {patient?.avatar ? (
                    <img 
                      src={patient.avatar} 
                      alt={patient.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-primary-600">
                      {patient?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{patient?.name}</p>
                  <p className="text-sm text-slate-500">{patient?.email}</p>
                  <p className="text-sm text-slate-500">{patient?.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Appointment Details</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-800">{format(parseISO(appointment.date), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="text-slate-800">{appointment.startTime} - {appointment.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={appointment.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Fee</span>
                <span className="text-slate-800">₹{appointment.fee}</span>
              </div>
              {appointment.reason && (
                <div>
                  <span className="text-slate-500">Reason</span>
                  <p className="text-slate-800 mt-1">{appointment.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => onAction('confirm', appointment._id)}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm
              </button>
              <button
                onClick={() => onAction('cancel', appointment._id)}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => onAction('complete', appointment._id)}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark Completed
              </button>
              <button
                onClick={() => onAction('noShow', appointment._id)}
                disabled={loading}
                className="flex-1 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                No Show
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
