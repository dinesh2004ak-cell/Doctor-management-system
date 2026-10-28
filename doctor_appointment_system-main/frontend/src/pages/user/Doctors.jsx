import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorAPI } from '../../services/api';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar,
  IndianRupee,
  MapPin,
  X
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import { format } from 'date-fns';

const Doctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [commission, setCommission] = useState(10);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    minFee: searchParams.get('minFee') || '',
    maxFee: searchParams.get('maxFee') || ''
  });

  useEffect(() => {
    fetchDoctors();
  }, [searchParams]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('specialty')) params.specialty = searchParams.get('specialty');
      if (searchParams.get('minFee')) params.minFee = searchParams.get('minFee');
      if (searchParams.get('maxFee')) params.maxFee = searchParams.get('maxFee');
      if (searchParams.get('page')) params.page = searchParams.get('page');

      const response = await doctorAPI.getAll(params);
      setDoctors(response.data.data.doctors);
      setSpecialties(response.data.data.specialties || []);
      setCommission(response.data.data.commission || 10);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: filters.search });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const updateFilters = (updates) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setFilters({ search: '', specialty: '', minFee: '', maxFee: '' });
    setSearchParams({});
  };

  const hasActiveFilters = filters.specialty || filters.minFee || filters.maxFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Find Doctors</h1>
        <p className="text-slate-500 mt-1">Book appointments with the best doctors in your area</p>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </form>

        {/* Filter panel */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-200 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specialty
                </label>
                <select
                  value={filters.specialty}
                  onChange={(e) => handleFilterChange('specialty', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minFee}
                  onChange={(e) => handleFilterChange('minFee', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  value={filters.maxFee}
                  onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Doctors list */}
      {loading ? (
        <Loading size="lg" className="py-20" />
      ) : doctors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard 
                key={doctor._id} 
                doctor={doctor} 
                commission={commission}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    searchParams.set('page', page);
                    setSearchParams(searchParams);
                  }}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    pagination.page === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No doctors found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Doctor Card Component
const DoctorCard = ({ doctor, commission }) => {
  const doctorUser = doctor.userId;
  const totalFee = doctor.consultationFee + (doctor.consultationFee * commission / 100);

  return (
    <Link
      to={`/doctors/${doctor._id}`}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {doctorUser?.avatar ? (
              <img 
                src={doctorUser.avatar} 
                alt={doctorUser.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary-600">
                {doctorUser?.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
              Dr. {doctorUser?.name}
            </h3>
            <p className="text-sm text-primary-600 font-medium">{doctor.specialty}</p>
            {doctor.qualification && (
              <p className="text-xs text-slate-500 mt-1">{doctor.qualification}</p>
            )}
          </div>
        </div>

        {doctor.bio && (
          <p className="mt-3 text-sm text-slate-600 line-clamp-2">{doctor.bio}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {doctor.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium text-slate-700">{doctor.rating.toFixed(1)}</span>
                <span className="text-xs text-slate-500">({doctor.totalRatings})</span>
              </div>
            )}
            {doctor.experience > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {doctor.experience} yrs
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Consultation Fee</p>
            <p className="text-lg font-bold text-slate-800">₹{Math.round(totalFee)}</p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
};

export default Doctors;
