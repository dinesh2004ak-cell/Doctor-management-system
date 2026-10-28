import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '../../services/api';
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Award,
  FileText,
  IndianRupee,
  CheckCircle,
  X,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  GraduationCap
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format, addDays, startOfDay, isBefore, isSameDay } from 'date-fns';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [commission, setCommission] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchDoctor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchDoctor = async () => {
    try {
      const response = await doctorAPI.getById(id);
      setDoctor(response.data.data.doctor);
      setCommission(response.data.data.commission || 10);
    } catch (error) {
      console.error('Failed to fetch doctor:', error);
      toast.error('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const response = await appointmentAPI.getAvailableSlots(id, format(selectedDate, 'yyyy-MM-dd'));
      setAvailableSlots(response.data.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setBooking(true);
    try {
      await appointmentAPI.book({
        doctorId: id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        reason
      });
      toast.success('Appointment booked successfully!');
      setShowBookingModal(false);
      navigate('/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  // Generate next 7 days for date selection
  const getNextDays = () => {
    const days = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 7; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  if (loading) {
    return <Loading size="lg" className="py-20" />;
  }

  if (!doctor) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
        </div>
        <p className="text-slate-500 text-sm sm:text-base">Doctor not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  const doctorUser = doctor.userId;
  const totalFee = doctor.consultationFee + (doctor.consultationFee * commission / 100);

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-0">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm sm:text-base text-slate-600 hover:text-slate-800 transition-colors -ml-1 sm:ml-0 p-1 sm:p-0"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        Back to doctors
      </button>

      {/* Doctor profile card */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="flex justify-center md:justify-start">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-primary-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {doctorUser?.avatar ? (
                  <img
                    src={doctorUser.avatar}
                    alt={doctorUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl md:text-4xl font-bold text-primary-600">
                    {doctorUser?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                Dr. {doctorUser?.name || 'Unknown'}
              </h1>
              <p className="text-base sm:text-lg text-primary-600 font-medium">
                {doctor.specialty}
              </p>

              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                {doctor.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500" />
                    <span className="text-sm sm:text-base font-medium text-slate-700">
                      {doctor.rating.toFixed(1)}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500">
                      ({doctor.totalRatings} reviews)
                    </span>
                  </div>
                )}
                {doctor.experience > 0 && (
                  <div className="flex items-center gap-1 text-sm sm:text-base text-slate-600">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    {doctor.experience} years exp
                  </div>
                )}
              </div>

              {doctor.qualification && (
                <p className="mt-2 text-xs sm:text-sm text-slate-600 flex items-center justify-center md:justify-start gap-1">
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{doctor.qualification}</span>
                </p>
              )}

              {doctor.bio && (
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {doctor.bio}
                </p>
              )}

              {/* Contact info */}
              {(doctorUser?.phone || doctorUser?.email || doctor.location?.city) && (
                <div className="mt-3 sm:mt-4 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-500">
                  {doctor.location?.city && (
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {doctor.location.city}
                        {doctor.location.state && `, ${doctor.location.state}`}
                      </span>
                    </div>
                  )}
                  {doctorUser?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{doctorUser.phone}</span>
                    </div>
                  )}
                  {doctorUser?.email && (
                    <div className="flex items-center gap-1 min-w-0">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{doctorUser.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fee card */}
            <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 md:w-64 flex-shrink-0">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800 mb-3 flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                Consultation Fee
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Doctor Fee</span>
                  <span className="text-slate-700 font-medium">
                    ₹{doctor.consultationFee}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Service ({commission}%)</span>
                  <span className="text-slate-700 font-medium">
                    ₹{Math.round(doctor.consultationFee * commission / 100)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">Total</span>
                  <span className="font-bold text-base sm:text-lg text-primary-600">
                    ₹{Math.round(totalFee)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full mt-4 py-2.5 sm:py-3 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Star className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Rating"
          value={doctor.rating > 0 ? doctor.rating.toFixed(1) : 'N/A'}
          subValue={doctor.totalRatings ? `${doctor.totalRatings} reviews` : ''}
          color="amber"
        />
        <StatCard
          icon={<Award className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Experience"
          value={doctor.experience > 0 ? `${doctor.experience} yrs` : 'N/A'}
          color="blue"
        />
        <StatCard
          icon={<Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Specialty"
          value={doctor.specialty}
          color="emerald"
        />
        <StatCard
          icon={<IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Fee"
          value={`₹${Math.round(totalFee)}`}
          color="primary"
        />
      </div>

      {/* Certificates */}
      {doctor.certificate && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 md:p-6">
          <h2 className="font-semibold text-base sm:text-lg text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Certificates & Documents
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            <a
              href={doctor.certificate}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 sm:p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-slate-400 group-hover:text-primary-500 mb-2 transition-colors" />
              <p className="text-xs sm:text-sm text-center text-slate-600 group-hover:text-primary-700">
                Medical Certificate
              </p>
            </a>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          doctor={doctor}
          doctorUser={doctorUser}
          totalFee={totalFee}
          commission={commission}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          availableSlots={availableSlots}
          slotsLoading={slotsLoading}
          reason={reason}
          setReason={setReason}
          onClose={() => setShowBookingModal(false)}
          onBook={handleBookAppointment}
          booking={booking}
          getNextDays={getNextDays}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, subValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-base sm:text-lg font-bold text-slate-800 truncate">{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-0.5 truncate">{subValue}</p>}
    </div>
  );
};

// Booking Modal Component
const BookingModal = ({
  doctor,
  doctorUser,
  totalFee,
  commission,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  availableSlots,
  slotsLoading,
  reason,
  setReason,
  onClose,
  onBook,
  booking,
  getNextDays
}) => {
  const days = getNextDays();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {doctorUser?.avatar ? (
                <img
                  src={doctorUser.avatar}
                  alt={doctorUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base sm:text-lg font-bold text-primary-600">
                  {doctorUser?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 truncate">
                Book Appointment
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                Dr. {doctorUser?.name} • {doctor.specialty}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0">
          {/* Date selection */}
          <div className="mb-5 sm:mb-6">
            <h3 className="text-sm sm:text-base font-medium text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              Select Date
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {days.map((day) => {
                const isPast = isBefore(day, startOfDay(new Date()));
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    disabled={isPast}
                    className={`flex-shrink-0 p-2.5 sm:p-3 rounded-lg border-2 transition-all min-w-[60px] sm:min-w-[70px] ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : isPast
                        ? 'border-slate-200 opacity-40 cursor-not-allowed'
                        : 'border-slate-200 hover:border-primary-300 active:scale-95'
                    }`}
                  >
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase">
                      {format(day, 'EEE')}
                    </p>
                    <p
                      className={`text-lg sm:text-xl font-semibold ${
                        isSelected ? 'text-primary-700' : 'text-slate-800'
                      }`}
                    >
                      {format(day, 'd')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {format(day, 'MMM')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="mb-5 sm:mb-6">
              <h3 className="text-sm sm:text-base font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                Select Time
              </h3>
              {slotsLoading ? (
                <div className="py-6">
                  <Loading size="md" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 sm:p-2.5 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                        selectedSlot?.start === slot.start
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-slate-200 hover:border-primary-300 text-slate-700'
                      }`}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-slate-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">
                    No slots available for this date
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please try another date
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="mb-5 sm:mb-6">
            <h3 className="text-sm sm:text-base font-medium text-slate-800 mb-2">
              Reason for Visit{' '}
              <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms or reason for consultation..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none outline-none transition"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {reason.length}/500
            </p>
          </div>

          {/* Fee summary */}
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-medium text-slate-800 mb-3 flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              Fee Summary
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Consultation Fee</span>
                <span className="text-slate-700 font-medium">
                  ₹{doctor.consultationFee}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Service Charge ({commission}%)</span>
                <span className="text-slate-700 font-medium">
                  ₹{Math.round(doctor.consultationFee * commission / 100)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between gap-2">
                <span className="font-semibold text-slate-800">Total Amount</span>
                <span className="font-bold text-base sm:text-lg text-primary-600">
                  ₹{Math.round(totalFee)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-slate-200 flex gap-2 sm:gap-3 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onBook}
            disabled={!selectedDate || !selectedSlot || booking}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {booking ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Booking
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
