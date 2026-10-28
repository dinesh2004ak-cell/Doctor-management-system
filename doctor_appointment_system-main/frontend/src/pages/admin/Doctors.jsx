import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Star,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter, page]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await adminAPI.getDoctors(params);
      setDoctors(response.data.data.doctors);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      await adminAPI.approveDoctor(doctorId);
      toast.success('Doctor approved successfully');
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (doctorId, reason) => {
    setActionLoading(true);
    try {
      await adminAPI.rejectDoctor(doctorId, reason);
      toast.success('Doctor application rejected');
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject doctor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (doctorId) => {
    try {
      const response = await adminAPI.getDoctor(doctorId);
      setSelectedDoctor(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load doctor details');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Doctor Management
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Review and manage doctor applications
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Doctors list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <Loading size="lg" className="py-12" />
        ) : doctors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specialty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {doctors.map((doctor) => {
                  const doctorUser = doctor.userId;
                  return (
                    <tr key={doctor._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
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
                          <div>
                            <p className="font-medium text-slate-800">{doctorUser?.name}</p>
                            <p className="text-xs text-slate-500">{doctorUser?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{doctor.specialty}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{doctor.experience || 0} yrs</td>
                      <td className="px-4 py-3">
                        {doctor.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm text-slate-700">{doctor.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No ratings</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize flex items-center gap-1 w-fit ${getStatusColor(doctor.status)}`}>
                          {getStatusIcon(doctor.status)}
                          {doctor.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {format(parseISO(doctor.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(doctor._id)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {doctor.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(doctor._id)}
                                disabled={actionLoading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleReject(doctor._id, reason);
                                }}
                                disabled={actionLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No doctors found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
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

      {/* Doctor Detail Modal */}
      {showDetailModal && selectedDoctor && (
        <DoctorDetailModal
          doctor={selectedDoctor.doctor}
          stats={selectedDoctor.stats}
          onClose={() => { setShowDetailModal(false); setSelectedDoctor(null); }}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Doctor Detail Modal
const DoctorDetailModal = ({
  doctor,
  stats,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}) => {
  const doctorUser = doctor.userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            Doctor Details
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">

          {/* Profile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">

            <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              {doctorUser?.avatar ? (
                <img
                  src={doctorUser.avatar}
                  alt={doctorUser.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-600">
                  {doctorUser?.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold text-slate-800">
                Dr. {doctorUser?.name}
              </h3>

              <p className="text-primary-600">
                {doctor.specialty}
              </p>

              <p className="text-sm text-slate-500">
                {doctor.qualification}
              </p>
            </div>

          </div>

          {/* Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <InfoItem
              title="Email"
              value={doctorUser?.email}
            />

            <InfoItem
              title="Phone"
              value={doctorUser?.phone || "Not provided"}
            />

            <InfoItem
              title="Experience"
              value={`${doctor.experience || 0} years`}
            />

            <InfoItem
              title="Appointments"
              value={stats?.totalAppointments || 0}
            />

            <InfoItem
              title="Completed"
              value={stats?.completedAppointments || 0}
            />

            <InfoItem
              title="Rating"
              value={
                doctor.rating > 0
                  ? `${doctor.rating.toFixed(1)} (${doctor.totalRatings} reviews)`
                  : "No ratings"
              }
            />

          </div>

          {/* Certificate */}
          {doctor.certificate && (
            <div className="mt-6">

              <h4 className="text-sm font-medium text-slate-500 mb-2">
                Medical Registration Certificate
              </h4>

              <a
                href={doctor.certificate}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full sm:w-auto justify-center items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                View Certificate
              </a>

            </div>
          )}

          {/* Bio */}
          {doctor.bio && (
            <div className="mt-6">

              <h4 className="text-sm font-medium text-slate-500 mb-2">
                Bio
              </h4>

              <p className="text-slate-700 leading-7 break-words">
                {doctor.bio}
              </p>

            </div>
          )}

        </div>

        {/* Footer */}
        {doctor.status === "pending" && (
          <div className="border-t border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-3">

            <button
              onClick={() => {
                const reason = prompt("Rejection reason:");
                if (reason) onReject(doctor._id, reason);
              }}
              disabled={actionLoading}
              className="w-full sm:flex-1 rounded-lg bg-red-600 py-3 text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>

            <button
              onClick={() => onApprove(doctor._id)}
              disabled={actionLoading}
              className="w-full sm:flex-1 rounded-lg bg-green-600 py-3 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ title, value }) => (
  <div className="rounded-lg border border-slate-200 p-4">
    <p className="text-xs text-slate-500 mb-1">{title}</p>
    <p className="text-sm font-medium text-slate-800 break-words">
      {value}
    </p>
  </div>
);

export default AdminDoctors;
