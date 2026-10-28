import { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';
import { Clock, Plus, Trash2, Save, Check } from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const DoctorSchedule = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await doctorAPI.getMyProfile();
      setProfile(response.data.data);
      if (response.data.data.availability) {
        setAvailability(response.data.data.availability);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSlot = (day) => {
    const newSlot = { start: '09:00', end: '09:30' };
    setAvailability({
      ...availability,
      [day]: [...availability[day], newSlot]
    });
  };

  const updateSlot = (day, index, field, value) => {
    const updatedSlots = [...availability[day]];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setAvailability({
      ...availability,
      [day]: updatedSlots
    });
  };

  const removeSlot = (day, index) => {
    const updatedSlots = availability[day].filter((_, i) => i !== index);
    setAvailability({
      ...availability,
      [day]: updatedSlots
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorAPI.setAvailability({ availability });
      toast.success('Availability saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Set Availability</h1>
          <p className="text-slate-500 mt-1">Manage your weekly schedule and appointment slots</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Schedule grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Weekly Schedule</h2>
          <p className="text-sm text-slate-500 mt-1">Set your available time slots for each day</p>
        </div>

        <div className="divide-y divide-slate-200">
          {days.map((day, index) => (
            <div key={day} className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  {dayLabels[index]}
                </h3>
                <button
                  onClick={() => addSlot(day)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Slot
                </button>
              </div>

              {availability[day].length > 0 ? (
                <div className="space-y-2">
                  {availability[day].map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(day, slotIndex, 'start', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-slate-500">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(day, slotIndex, 'end', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <button
                        onClick={() => removeSlot(day, slotIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">Not available on {dayLabels[index]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick presets */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Presets</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const weekdaySlots = [{ start: '09:00', end: '09:30' }, { start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '14:00', end: '14:30' }, { start: '15:00', end: '15:30' }, { start: '16:00', end: '16:30' }];
              const weekendSlots = [];
              setAvailability({
                monday: weekdaySlots,
                tuesday: weekdaySlots,
                wednesday: weekdaySlots,
                thursday: weekdaySlots,
                friday: weekdaySlots,
                saturday: weekendSlots,
                sunday: weekendSlots
              });
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            Standard Week (9AM-5PM)
          </button>
          <button
            onClick={() => {
              const slots = [{ start: '10:00', end: '10:30' }, { start: '11:00', end: '11:30' }, { start: '12:00', end: '12:30' }, { start: '15:00', end: '15:30' }, { start: '16:00', end: '16:30' }, { start: '17:00', end: '17:30' }];
              setAvailability({
                monday: slots,
                tuesday: slots,
                wednesday: slots,
                thursday: slots,
                friday: slots,
                saturday: [],
                sunday: []
              });
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            Mon-Fri Only (10AM-6PM)
          </button>
          <button
            onClick={() => {
              setAvailability({
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
              });
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;
