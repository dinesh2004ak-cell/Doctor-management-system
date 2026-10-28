import { useState, useEffect } from "react";
import { adminAPI, appointmentAPI } from "../../services/api";
import {
  Search,
  Calendar,
  Clock,
  IndianRupee,
  User,
  Eye,
  X,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  FileText,
  UserCheck,
} from "lucide-react";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  no_show: "bg-orange-100 text-orange-700 border-orange-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter, page]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await adminAPI.getAppointments(params);
      setAppointments(response.data.data.appointments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter || dateFilter || searchQuery;

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDateChange = (value) => {
    setDateFilter(value);
    setPage(1);
  };

  const handleViewDetails = (apt) => {
    setSelectedAppointment(apt);
    setShowModal(true);
  };

  const handleAppointmentUpdate = (updated) => {
    setSelectedAppointment(updated);
    // Update the row in the list as well
    setAppointments((prev) =>
      prev.map((a) => (a._id === updated._id ? { ...a, ...updated } : a)),
    );
    setRefreshingId(updated._id);
    setTimeout(() => setRefreshingId(null), 800);
  };

  const getStatusColor = (status) =>
    STATUS_COLORS[status] || STATUS_COLORS.default;

  // Pagination helpers
  const getPageNumbers = () => {
    if (!pagination) return [];
    const total = pagination.pages;
    const current = pagination.page;
    const pages = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      for (
        let i = Math.max(2, current - 1);
        i <= Math.min(total - 1, current + 1);
        i++
      ) {
        pages.push(i);
      }
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
          Appointment Management
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Monitor and manage all appointments on the platform
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: "All", value: "", color: "slate" },
          { label: "Pending", value: "pending", color: "yellow" },
          { label: "Confirmed", value: "confirmed", color: "green" },
          { label: "Completed", value: "completed", color: "blue" },
          { label: "Cancelled", value: "cancelled", color: "red" },
        ].map((tab) => (
          <StatusTab
            key={tab.value}
            label={tab.label}
            active={statusFilter === tab.value}
            onClick={() => handleStatusChange(tab.value)}
            color={tab.color}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by patient or doctor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="sm:w-44 px-3 py-2.5 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateChange(e.target.value)}
            className="sm:w-44 px-3 py-2.5 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
          />
          <button
            type="submit"
            className="px-4 sm:px-6 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 sm:px-4 py-2.5 border border-slate-300 text-slate-600 text-sm sm:text-base font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 -mt-2">
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs sm:text-sm rounded-full border border-primary-200">
              Status: {statusFilter}
              <button
                onClick={() => handleStatusChange("")}
                className="ml-1 hover:bg-primary-100 rounded-full p-0.5"
                aria-label="Remove status filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {dateFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs sm:text-sm rounded-full border border-primary-200">
              Date: {format(parseISO(dateFilter), "MMM dd, yyyy")}
              <button
                onClick={() => handleDateChange("")}
                className="ml-1 hover:bg-primary-100 rounded-full p-0.5"
                aria-label="Remove date filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results count */}
      {!loading && appointments.length > 0 && pagination && (
        <div className="text-xs sm:text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {appointments.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-700">{pagination.total}</span>{" "}
          appointments
        </div>
      )}

      {/* Appointments list */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <Loading size="lg" className="py-12" />
        ) : appointments.length > 0 ? (
          <>
            {/* Mobile: Card view */}
            <div className="md:hidden divide-y divide-slate-200">
              {appointments.map((apt) => {
                const refreshing = refreshingId === apt._id;
                return (
                  <div
                    key={apt._id}
                    className={`p-3 sm:p-4 transition-colors ${
                      refreshing ? "bg-green-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Patient avatar */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {apt.userId?.avatar ? (
                          <img
                            src={apt.userId.avatar}
                            alt={apt.userId.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm sm:text-base font-medium text-primary-600">
                            {apt.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base text-slate-800 truncate">
                              {apt.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              Dr. {apt.doctorId?.userId?.name} •{" "}
                              {apt.doctorId?.specialty}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full capitalize flex items-center gap-1 flex-shrink-0 border ${getStatusColor(
                              apt.status,
                            )}`}
                          >
                            {apt.status === "no_show" ? "No Show" : apt.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(apt.date), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.startTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            <span className="font-medium text-slate-700">
                              {apt.totalFee}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => handleViewDetails(apt)}
                            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appointments.map((apt) => {
                    const refreshing = refreshingId === apt._id;
                    return (
                      <tr
                        key={apt._id}
                        className={`transition-colors ${
                          refreshing ? "bg-green-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                              {apt.userId?.avatar ? (
                                <img
                                  src={apt.userId.avatar}
                                  alt={apt.userId.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium text-primary-600">
                                  {apt.userId?.name?.charAt(0)?.toUpperCase() ||
                                    "?"}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-slate-800 truncate">
                              {apt.userId?.name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-slate-700 truncate">
                              Dr. {apt.doctorId?.userId?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-slate-500 truncate">
                              {apt.doctorId?.specialty}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col whitespace-nowrap">
                            <span className="text-sm text-slate-700">
                              {format(parseISO(apt.date), "MMM dd, yyyy")}
                            </span>
                            <span className="text-xs text-slate-500">
                              {apt.startTime} - {apt.endTime}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-800">
                              ₹{apt.totalFee}
                            </span>
                            <span className="text-xs text-slate-500">
                              Fee: ₹{apt.fee} + ₹{apt.commission}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full capitalize inline-flex items-center gap-1 border ${getStatusColor(
                              apt.status,
                            )}`}
                          >
                            {apt.status === "no_show" ? "No Show" : apt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewDetails(apt)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View details"
                            aria-label="View appointment details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-10 sm:py-12 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2">
              No appointments found
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Try adjusting your filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-3 sm:p-4 border-t border-slate-200 flex flex-wrap justify-center items-center gap-1 sm:gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 text-sm"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === p
                      ? "bg-primary-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {showModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowModal(false);
            setSelectedAppointment(null);
          }}
          onUpdate={handleAppointmentUpdate}
        />
      )}
    </div>
  );
};

// Status Tab Component
const StatusTab = ({ label, active, onClick, color }) => {
  const colorClasses = {
    slate: active
      ? "bg-slate-700 text-white"
      : "bg-slate-50 text-slate-700 hover:bg-slate-100",
    yellow: active
      ? "bg-yellow-500 text-white"
      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    green: active
      ? "bg-green-600 text-white"
      : "bg-green-50 text-green-700 hover:bg-green-100",
    blue: active
      ? "bg-blue-600 text-white"
      : "bg-blue-50 text-blue-700 hover:bg-blue-100",
    red: active
      ? "bg-red-600 text-white"
      : "bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium transition-all ${
        active
          ? `${colorClasses[color]} border-transparent shadow-sm`
          : `border-slate-200 ${colorClasses[color]}`
      }`}
    >
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.slice(0, 4)}</span>
    </button>
  );
};

// Info Row Component
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 py-2 sm:py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 flex-shrink-0">
      {icon}
      {label}
    </span>
    <span className="text-xs sm:text-sm text-slate-800 font-medium text-right min-w-0 truncate">
      {value}
    </span>
  </div>
);

// Appointment Detail Modal
const AppointmentDetailModal = ({ appointment, onClose, onUpdate }) => {
  const patient = appointment.userId;
  const doctor = appointment.doctorId;
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(appointment);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      let response;
      if (action === "confirm") {
        response = await appointmentAPI.confirm(currentAppointment._id);
      } else if (action === "cancel") {
        response = await appointmentAPI.cancel(
          currentAppointment._id,
          "Cancelled by admin",
        );
      } else if (action === "complete") {
        response = await appointmentAPI.complete(
          currentAppointment._id,
          "Completed by admin",
        );
      } else if (action === "no-show") {
        response = await appointmentAPI.markNoShow(currentAppointment._id);
      }

      if (response?.data?.data) {
        setCurrentAppointment(response.data.data);
        onUpdate?.(response.data.data);
      }
      toast.success(response?.data?.message || "Appointment updated");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update appointment",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const appointmentStatus = currentAppointment.status;
  const canConfirm = appointmentStatus === "pending";
  const canCancel = ["pending", "confirmed"].includes(appointmentStatus);
  const canComplete = ["pending", "confirmed"].includes(appointmentStatus);
  const canMarkNoShow = ["pending", "confirmed"].includes(appointmentStatus);

  const getStatusColor = (status) =>
    STATUS_COLORS[status] || STATUS_COLORS.default;

  const actionCount =
    (canConfirm ? 1 : 0) +
    (canCancel ? 1 : 0) +
    (canComplete ? 1 : 0) +
    (canMarkNoShow ? 1 : 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 truncate">
                Appointment Details
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                #{currentAppointment._id?.slice(-8) || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0">
          {/* Status badge */}
          <div className="mb-5 sm:mb-6 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              Current Status
            </span>
            <span
              className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full capitalize inline-flex items-center gap-1.5 border ${getStatusColor(
                appointmentStatus,
              )}`}
            >
              {appointmentStatus === "no_show" ? "No Show" : appointmentStatus}
            </span>
          </div>

          {/* Patient */}
          <div className="mb-5 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Patient
            </h3>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {patient?.avatar ? (
                    <img
                      src={patient.avatar}
                      alt={patient.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-primary-600">
                      {patient?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base text-slate-800 truncate">
                    {patient?.name || "Unknown"}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {patient?.email}
                  </p>
                  {patient?.phone && (
                    <p className="text-xs sm:text-sm text-slate-500 truncate flex items-center gap-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {patient?.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div className="mb-5 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Doctor
            </h3>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {doctor?.userId?.avatar ? (
                    <img
                      src={doctor.userId.avatar}
                      alt={doctor.userId.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-emerald-600">
                      {doctor?.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base text-slate-800 truncate">
                    Dr. {doctor?.userId?.name || "Unknown"}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-600 truncate">
                    {doctor?.specialty}
                  </p>
                  {doctor?.qualification && (
                    <p className="text-xs sm:text-sm text-slate-500 truncate">
                      {doctor.qualification}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-0 mb-5 sm:mb-6">
            <InfoRow
              icon={<Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              label="Date"
              value={format(parseISO(currentAppointment.date), "MMMM dd, yyyy")}
            />
            <InfoRow
              icon={<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              label="Time"
              value={`${currentAppointment.startTime} - ${currentAppointment.endTime}`}
            />
            <InfoRow
              icon={<IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              label="Doctor Fee"
              value={`₹${currentAppointment.fee}`}
            />
            <InfoRow
              icon={<IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              label="Commission"
              value={`₹${currentAppointment.commission}`}
            />
            <InfoRow
              icon={<IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              label="Total"
              value={`₹${currentAppointment.totalFee}`}
            />
          </div>

          {currentAppointment.reason && (
            <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-amber-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Reason for Visit
              </h4>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {currentAppointment.reason}
              </p>
            </div>
          )}

          {actionCount === 0 && (
            <div className="text-center py-4 px-3 bg-slate-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <p className="text-xs sm:text-sm text-slate-500">
                No actions available for this status
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        {actionCount > 0 && (
          <div className="p-3 sm:p-4 md:p-6 border-t border-slate-200 flex-shrink-0 bg-white">
            <div
              className={`grid gap-2 mb-2 ${
                actionCount === 1
                  ? "grid-cols-1"
                  : actionCount === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
              }`}
            >
              {canConfirm && (
                <button
                  onClick={() => handleAction("confirm")}
                  disabled={actionLoading}
                  className="py-2.5 sm:py-3 text-sm sm:text-base bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <Spinner />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Approve</span>
                  <span className="sm:hidden">Approve</span>
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => handleAction("complete")}
                  disabled={actionLoading}
                  className="py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <Spinner />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  Complete
                </button>
              )}
              {canMarkNoShow && (
                <button
                  onClick={() => handleAction("no-show")}
                  disabled={actionLoading}
                  className="py-2.5 sm:py-3 text-sm sm:text-base bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <Spinner />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  No Show
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={actionLoading}
                  className="py-2.5 sm:py-3 text-sm sm:text-base bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <Spinner />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancel
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Spinner Component
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

export default AdminAppointments;
