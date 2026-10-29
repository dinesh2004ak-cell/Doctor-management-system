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
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);

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

  const handleReschedule = async (appointmentId, newDate, newStartTime, newEndTime) => {
    try {
      await appointmentAPI.reschedule(appointmentId, {
        newDate,
        newStartTime,
        newEndTime
      });
      toast.success('Appointment rescheduled successfully! Awaiting doctor confirmation.');
      setReschedulingAppointment(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
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
                  onReschedule={(apt) => setReschedulingAppointment(apt)}
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

      {/* Reschedule Modal */}
      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          onConfirm={handleReschedule}
        />
      )}
    </div>
  );
};

// Reschedule Modal Component
const RescheduleModal = ({ appointment, onClose, onConfirm }) => {
  const doctor = appointment.doctorId;
  const doctorUser = doctor?.userId;
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDateChange = async (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    if (!dateStr) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const docId = doctor?._id || doctor;
      const res = await appointmentAPI.getAvailableSlots(docId, dateStr);
      setAvailableSlots(res.data.data.slots || []);
    } catch (err) {
      toast.error('Failed to load slots for this date');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }
    setSubmitting(true);
    await onConfirm(appointment._id, selectedDate, selectedSlot.start, selectedSlot.end);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500">Dr. {doctorUser?.name || 'Doctor'} • {doctor?.specialty}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pick a New Date</label>
          <input
            type="date"
            min={format(new Date(), 'yyyy-MM-dd')}
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Available Slot</label>
          {loadingSlots ? (
            <div className="py-6 text-center text-sm text-slate-500">Loading available slots...</div>
          ) : selectedDate && availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slot.start} - {slot.end}
                  </button>
                );
              })}
            </div>
          ) : selectedDate ? (
            <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">
              No available slots on this date.
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">Please choose a date first</div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedSlot || submitting}
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({ appointment, onCancel, onReschedule }) => {
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

          {/* Reschedule Button */}
          {canCancel && (
            <button 
              onClick={() => onReschedule(appointment)}
              className="px-4 py-2 bg-primary-100 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-200 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Reschedule
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
              Changes not allowed within 24 hours
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAppointments;
