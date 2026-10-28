import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { 
  FileText,
  Calendar,
  Pill,
  ChevronDown,
  ChevronUp,
  User,
  Stethoscope
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { format, parseISO } from 'date-fns';

const UserPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPrescriptions();
  }, [page]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getPrescriptions({ page, limit: 10 });
      setPrescriptions(response.data.data.prescriptions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>
        <p className="text-slate-500 mt-1">View your medical prescriptions from doctors</p>
      </div>

      {/* Prescriptions list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <Loading size="lg" className="py-12" />
        ) : prescriptions.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {prescriptions.map((prescription) => (
              <PrescriptionCard 
                key={prescription._id} 
                prescription={prescription}
                isExpanded={expandedId === prescription._id}
                onToggle={() => toggleExpand(prescription._id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No prescriptions yet</h3>
            <p className="text-slate-500">Your prescriptions will appear here after your appointments</p>
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
    </div>
  );
};

// Prescription Card Component
const PrescriptionCard = ({ prescription, isExpanded, onToggle }) => {
  const doctor = prescription.doctorId;
  const doctorUser = doctor?.userId;
  const appointment = prescription.appointmentId;

  return (
    <div className="p-4 md:p-5">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Dr. {doctorUser?.name}</h3>
            <p className="text-sm text-slate-500">
              {doctor?.specialty} • {appointment && format(parseISO(appointment.date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn">
          {/* Diagnosis */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-500 mb-1">Diagnosis</h4>
            <p className="text-slate-800">{prescription.diagnosis}</p>
          </div>

          {/* Symptoms */}
          {prescription.symptoms?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {prescription.symptoms.map((symptom, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medications
            </h4>
            <div className="space-y-2">
              {prescription.medications.map((med, index) => (
                <div 
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{med.name}</p>
                      <p className="text-sm text-slate-600">{med.dosage}</p>
                    </div>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      {med.frequency}
                    </span>
                  </div>
                  {med.duration && (
                    <p className="text-xs text-slate-500 mt-1">Duration: {med.duration}</p>
                  )}
                  {med.notes && (
                    <p className="text-xs text-slate-600 mt-1">{med.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Notes</h4>
              <p className="text-slate-700">{prescription.notes}</p>
            </div>
          )}

          {/* Follow up */}
          {prescription.followUpDate && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                Follow-up recommended on {format(parseISO(prescription.followUpDate), 'MMMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPrescriptions;
