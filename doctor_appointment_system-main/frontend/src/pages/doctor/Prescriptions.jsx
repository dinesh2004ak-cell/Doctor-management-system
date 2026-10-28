import { useState, useEffect } from 'react';
import { doctorAPI, prescriptionAPI } from '../../services/api';
import { 
  FileText,
  Plus,
  X,
  Calendar,
  Pill,
  Save
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPrescriptions();
  }, [page]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await doctorAPI.getPrescriptions({ page, limit: 10 });
      setPrescriptions(response.data.data.prescriptions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedAppointments = async () => {
    try {
      const response = await doctorAPI.getAppointments({ status: 'completed' });
      setCompletedAppointments(response.data.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const handleOpenCreate = () => {
    fetchCompletedAppointments();
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-slate-500 mt-1">Manage patient prescriptions and medical records</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Prescription
        </button>
      </div>

      {/* Prescriptions list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <Loading size="lg" className="py-12" />
        ) : prescriptions.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200">
              {prescriptions.map((prescription) => (
                <PrescriptionRow key={prescription._id} prescription={prescription} />
              ))}
            </div>

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
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No prescriptions yet</h3>
            <p className="text-slate-500 mb-4">Create prescriptions for your patients</p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Prescription
            </button>
          </div>
        )}
      </div>

      {/* Create Prescription Modal */}
      {showCreateModal && (
        <CreatePrescriptionModal
          appointments={completedAppointments}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPrescriptions();
          }}
        />
      )}
    </div>
  );
};

// Prescription Row Component
const PrescriptionRow = ({ prescription }) => {
  const patient = prescription.userId;
  const appointment = prescription.appointmentId;

  return (
    <div className="p-4 md:p-5 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{patient?.name}</p>
            <p className="text-sm text-slate-500">
              {appointment && format(parseISO(appointment.date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{prescription.diagnosis}</p>
          <p className="text-sm text-slate-500">{prescription.medications?.length} medications</p>
        </div>
      </div>
    </div>
  );
};

// Create Prescription Modal
const CreatePrescriptionModal = ({ appointments, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    notes: ''
  });
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [saving, setSaving] = useState(false);

  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.appointmentId || !formData.diagnosis) {
      toast.error('Please fill in required fields');
      return;
    }

    const validMedications = medications.filter(m => m.name && m.dosage && m.frequency);
    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    setSaving(true);
    try {
      await prescriptionAPI.create({
        ...formData,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        medications: validMedications
      });
      toast.success('Prescription created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Create Prescription</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Appointment selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Appointment *
            </label>
            <select
              value={formData.appointmentId}
              onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select an appointment</option>
              {appointments.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {apt.userId?.name} - {format(parseISO(apt.date), 'MMM dd, yyyy')} ({apt.startTime})
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Diagnosis *
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter diagnosis"
              required
            />
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Symptoms (comma separated)
            </label>
            <input
              type="text"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Fever, Cough, Headache"
            />
          </div>

          {/* Medications */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medications *
              </label>
              <button
                type="button"
                onClick={handleAddMedication}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        placeholder="Medicine name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        placeholder="Dosage (e.g., 500mg)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g., Twice daily)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                        placeholder="Duration (e.g., 7 days)"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={3}
              placeholder="Any additional instructions or notes..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? 'Creating...' : 'Create Prescription'}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptions;
