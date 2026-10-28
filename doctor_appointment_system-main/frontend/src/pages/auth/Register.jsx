import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Stethoscope, 
  AlertCircle, 
  UploadCloud,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const specialtiesList = [
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'General Physician',
  'Gynecologist',
  'Neurologist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopedist',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Urologist'
];

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const hourFormatted = hour.toString().padStart(2, '0');
  return `${hourFormatted}:${minStr} ${ampm}`;
};

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  
  // Basic user details state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Doctor professional info state
  const [doctorData, setDoctorData] = useState({
    specialty: '',
    qualification: '',
    experience: '',
    bio: '',
    consultationFee: ''
  });

  // Searchable specialty dropdown state
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

  // Doctor files state
  const [certificateFile, setCertificateFile] = useState(null);
  const [additionalCertificateFiles, setAdditionalCertificateFiles] = useState([]);

  // Doctor availability state (default slot values as 24h format for HTML time inputs)
  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [activeDayTab, setActiveDayTab] = useState('monday');

  // Doctor exceptions state
  const [exceptions, setExceptions] = useState([]);

  // Multi-step state (1: Account info, 2: Professional Details & Certs, 3: Weekly Schedule, 4: Leave Exceptions)
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleDoctorChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAdditionalCertsChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAdditionalCertificateFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeAdditionalCert = (index) => {
    setAdditionalCertificateFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Availability operations
  const addSlot = (day) => {
    setAvailability({
      ...availability,
      [day]: [...availability[day], { start: '09:00', end: '17:00' }]
    });
  };

  const updateSlot = (day, index, field, value) => {
    const daySlots = [...availability[day]];
    daySlots[index][field] = value;
    setAvailability({
      ...availability,
      [day]: daySlots
    });
  };

  const removeSlot = (day, index) => {
    const daySlots = availability[day].filter((_, i) => i !== index);
    setAvailability({
      ...availability,
      [day]: daySlots
    });
  };

  // Exceptions operations
  const addException = () => {
    setExceptions([
      ...exceptions,
      { date: '', available: false, slots: [] }
    ]);
  };

  const updateException = (index, field, value) => {
    const newExceptions = [...exceptions];
    newExceptions[index][field] = value;
    if (field === 'available' && !value) {
      newExceptions[index].slots = [];
    }
    setExceptions(newExceptions);
  };

  const removeException = (index) => {
    setExceptions(exceptions.filter((_, i) => i !== index));
  };

  const addExceptionSlot = (index) => {
    const newExceptions = [...exceptions];
    newExceptions[index].slots.push({ start: '09:00', end: '17:00' });
    setExceptions(newExceptions);
  };

  const updateExceptionSlot = (exIndex, slotIndex, field, value) => {
    const newExceptions = [...exceptions];
    newExceptions[exIndex].slots[slotIndex][field] = value;
    setExceptions(newExceptions);
  };

  const removeExceptionSlot = (exIndex, slotIndex) => {
    const newExceptions = [...exceptions];
    newExceptions[exIndex].slots = newExceptions[exIndex].slots.filter((_, i) => i !== slotIndex);
    setExceptions(newExceptions);
  };

  // Step Navigations & Valids
  const handleNextStep = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleStep2Next = () => {
    if (!doctorData.specialty || doctorData.specialty.trim() === '') {
      setError('Specialty is required');
      return;
    }
    if (!doctorData.qualification || doctorData.qualification.trim() === '') {
      setError('Qualification is required');
      return;
    }
    if (doctorData.experience === '' || isNaN(Number(doctorData.experience)) || Number(doctorData.experience) < 0) {
      setError('Please enter a valid experience (Years)');
      return;
    }
    if (doctorData.consultationFee === '' || isNaN(Number(doctorData.consultationFee)) || Number(doctorData.consultationFee) < 0) {
      setError('Please enter a valid consultation fee');
      return;
    }
    if (!doctorData.bio || doctorData.bio.trim() === '') {
      setError('Bio is required');
      return;
    }
    if (!certificateFile) {
      setError('Primary Medical Registration Certificate is required');
      return;
    }

    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleStep3Next = () => {
    for (const day in availability) {
      for (const slot of availability[day]) {
        if (!slot.start || !slot.end) {
          setError(`Please fill in start and end times for all slots on ${day}`);
          return;
        }
        if (slot.start >= slot.end) {
          setError(`Start time must be before end time for all slots on ${day}`);
          return;
        }
      }
    }

    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.role === 'doctor') {
      if (currentStep === 1) {
        handleNextStep();
        return;
      }
      if (currentStep === 2) {
        handleStep2Next();
        return;
      }
      if (currentStep === 3) {
        handleStep3Next();
        return;
      }
      
      // Step 4 validation
      for (let i = 0; i < exceptions.length; i++) {
        const ex = exceptions[i];
        if (!ex.date) {
          setError(`Please select a date for Exception #${i + 1}`);
          return;
        }
        if (ex.available) {
          if (ex.slots.length === 0) {
            setError(`Please add at least one custom slot or set date ${ex.date} to 'No' (On Leave)`);
            return;
          }
          for (const slot of ex.slots) {
            if (!slot.start || !slot.end) {
              setError(`Please fill in start and end times for all custom slots on date ${ex.date}`);
              return;
            }
            if (slot.start >= slot.end) {
              setError(`Start time must be before end time for all custom slots on date ${ex.date}`);
              return;
            }
          }
        }
      }
    } else {
      // Patient validation
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email');
        return;
      }
    }

    // Submit registration
    try {
      const { confirmPassword, ...registerData } = formData;
      const formPayload = new FormData();
      Object.entries(registerData).forEach(([key, value]) => formPayload.append(key, value));

      if (formData.role === 'doctor') {
        formPayload.append('specialty', doctorData.specialty);
        formPayload.append('qualification', doctorData.qualification);
        formPayload.append('experience', doctorData.experience);
        formPayload.append('bio', doctorData.bio);
        formPayload.append('consultationFee', doctorData.consultationFee);
        
        if (certificateFile) {
          formPayload.append('certificate', certificateFile);
        }

        additionalCertificateFiles.forEach((file) => {
          formPayload.append('certificates', file);
        });

        const formattedAvailability = {};
        Object.keys(availability).forEach(day => {
          formattedAvailability[day] = availability[day].map(slot => ({
            start: formatTime12h(slot.start),
            end: formatTime12h(slot.end)
          }));
        });
        formPayload.append('availability', JSON.stringify(formattedAvailability));

        const formattedExceptions = exceptions.map(ex => ({
          date: ex.date,
          available: ex.available,
          slots: ex.available ? ex.slots.map(slot => ({
            start: formatTime12h(slot.start),
            end: formatTime12h(slot.end)
          })) : []
        }));
        formPayload.append('exceptions', JSON.stringify(formattedExceptions));
      }

      const result = await register(formPayload);
      toast.success(result?.message || 'Registration successful!');
      
      if (result?.requiresApproval || result?.doctorStatus === 'pending') {
        navigate('/login', { replace: true });
      } else if (result.data?.user?.role === 'doctor') {
        navigate('/doctor', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
    }
  };

  const filteredSpecialties = specialtiesList.filter(s => 
    s.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  const containerWidth = (formData.role === 'doctor' && currentStep > 1) ? 'max-w-2xl' : 'max-w-md';

  const steps = [
    { number: 1, label: 'Account' },
    { number: 2, label: 'Credentials' },
    { number: 3, label: 'Schedule' },
    { number: 4, label: 'Exceptions' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex items-center justify-center p-4">
      <div className={`w-full ${containerWidth} transition-all duration-300`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-md">
            <Stethoscope className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MediBook</h1>
          <p className="text-slate-500 mt-1">Create your professional account</p>
        </div>

        {/* Register form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">
              {formData.role === 'doctor' ? 'Doctor Registration' : 'Sign up'}
            </h2>
            {formData.role === 'doctor' && (
              <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                Step {currentStep} of 4
              </span>
            )}
          </div>

          {/* Progress Indicator */}
          {formData.role === 'doctor' && (
            <div className="mb-8 flex items-center justify-between">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
                      ${currentStep === step.number 
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-md' 
                        : currentStep > step.number
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }
                    `}>
                      {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.number}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium hidden sm:block ${currentStep === step.number ? 'text-primary-600' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 animate-slideIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: Account Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    I am a *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`
                      flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${formData.role === 'user' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }
                    `}>
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={formData.role === 'user'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">Patient</span>
                    </label>
                    <label className={`
                      flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${formData.role === 'doctor' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }
                    `}>
                      <input
                        type="radio"
                        name="role"
                        value="doctor"
                        checked={formData.role === 'doctor'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">Doctor</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Doctor Professional details & certificates */}
            {formData.role === 'doctor' && currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Searchable Specialty Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Specialty *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={specialtySearch}
                      onChange={(e) => {
                        setSpecialtySearch(e.target.value);
                        setShowSpecialtyDropdown(true);
                        setDoctorData(prev => ({ ...prev, specialty: e.target.value }));
                        setError('');
                      }}
                      onFocus={() => setShowSpecialtyDropdown(true)}
                      onBlur={() => {
                        // Delay dropdown close to allow click event detection
                        setTimeout(() => setShowSpecialtyDropdown(false), 200);
                      }}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Search and select specialty..."
                    />
                    {specialtySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setSpecialtySearch('');
                          setDoctorData(prev => ({ ...prev, specialty: '' }));
                          setShowSpecialtyDropdown(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {showSpecialtyDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSpecialties.length > 0 ? (
                        filteredSpecialties.map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => {
                              setDoctorData(prev => ({ ...prev, specialty: spec }));
                              setSpecialtySearch(spec);
                              setShowSpecialtyDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-primary-50 text-slate-700 text-sm hover:text-primary-700 transition-colors"
                          >
                            {spec}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-slate-500 text-sm">
                          No specialties found. Type to add custom.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={doctorData.qualification}
                    onChange={handleDoctorChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="e.g. MBBS, MD Cardiology"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Experience (Years) *
                    </label>
                    <input
                      type="number"
                      name="experience"
                      min="0"
                      value={doctorData.experience}
                      onChange={handleDoctorChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Consultation Fee (₹) *
                    </label>
                    <input
                      type="number"
                      name="consultationFee"
                      min="0"
                      value={doctorData.consultationFee}
                      onChange={handleDoctorChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bio / About Doctor *
                  </label>
                  <textarea
                    name="bio"
                    value={doctorData.bio}
                    onChange={handleDoctorChange}
                    rows="3"
                    maxLength="1000"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                    placeholder="Tell patients about your medical journey, expertise, and philosophy..."
                  />
                  <div className="text-right text-xs text-slate-400">
                    {doctorData.bio.length}/1000 characters
                  </div>
                </div>

                {/* Primary certificate */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Medical Certificate * <span className="text-xs text-slate-500">(Required)</span>
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600">
                    <UploadCloud className="h-5 w-5 text-slate-400" />
                    <span className="truncate max-w-[90%]">{certificateFile ? certificateFile.name : 'Upload certificate (PDF, JPG, JPEG, PNG)'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      className="sr-only"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                {/* Additional certificates */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Additional Certificates <span className="text-xs text-slate-500">(Multiple, Optional)</span>
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600">
                    <UploadCloud className="h-5 w-5 text-slate-400" />
                    <span>Select additional certificates</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      multiple
                      className="sr-only"
                      onChange={handleAdditionalCertsChange}
                    />
                  </label>

                  {/* Selected additional files */}
                  {additionalCertificateFiles.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {additionalCertificateFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs animate-fadeIn">
                          <span className="truncate max-w-[80%] font-medium text-slate-600 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAdditionalCert(idx)}
                            className="text-red-500 hover:text-red-700 font-semibold flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Doctor Availability */}
            {formData.role === 'doctor' && currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Weekly Schedule</h3>
                  <p className="text-slate-500 text-sm">Configure your regular working hours for each day of the week.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Sidebar list of days */}
                  <div className="flex md:flex-col gap-1.5 overflow-x-auto md:w-40 pb-2 md:pb-0 scrollbar-none">
                    {daysOfWeek.map(day => {
                      const slotsCount = availability[day.key]?.length;
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setActiveDayTab(day.key);
                            setError('');
                          }}
                          className={`
                            flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap md:w-full
                            ${activeDayTab === day.key
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-100'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }
                          `}
                        >
                          <span>{day.label}</span>
                          {slotsCount > 0 && (
                            <span className={`
                              ml-2 text-xs px-2 py-0.5 rounded-full font-bold
                              ${activeDayTab === day.key ? 'bg-white text-primary-700' : 'bg-primary-100 text-primary-800'}
                            `}>
                              {slotsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Slot editor panel */}
                  <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-700 capitalize flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary-600" />
                        {activeDayTab} Hours
                      </h4>
                      <button
                        type="button"
                        onClick={() => addSlot(activeDayTab)}
                        className="flex items-center gap-1 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Slot
                      </button>
                    </div>

                    {availability[activeDayTab]?.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-pulse" />
                        <p className="text-sm font-medium">No working hours on {activeDayTab}.</p>
                        <p className="text-xs text-slate-400 mt-1">Click "Add Slot" to configure availability.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {availability[activeDayTab].map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm animate-fadeIn">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateSlot(activeDayTab, index, 'start', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateSlot(activeDayTab, index, 'end', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSlot(activeDayTab, index)}
                              className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Leave Exceptions */}
            {formData.role === 'doctor' && currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Leave & Exceptions</h3>
                    <p className="text-slate-500 text-sm">Add custom availability or leave for specific dates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addException}
                    className="flex items-center gap-1 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Exception
                  </button>
                </div>

                {exceptions.length === 0 ? (
                  <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-700">No availability exceptions configured</p>
                    <p className="text-xs text-slate-400 mt-1.5">You will follow standard weekly schedule on all calendar dates.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {exceptions.map((ex, exIndex) => (
                      <div key={exIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-sm animate-fadeIn relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                              <input
                                type="date"
                                value={ex.date}
                                onChange={(e) => updateException(exIndex, 'date', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Available on this date?</label>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => updateException(exIndex, 'available', true)}
                                  className={`
                                    py-2 rounded-lg text-xs font-semibold border transition-all
                                    ${ex.available 
                                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-100' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }
                                  `}
                                >
                                  Yes (Custom hours)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateException(exIndex, 'available', false)}
                                  className={`
                                    py-2 rounded-lg text-xs font-semibold border transition-all
                                    ${!ex.available 
                                      ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-100' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }
                                  `}
                                >
                                  No (On Leave)
                                </button>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeException(exIndex)}
                            className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {ex.available && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-primary-500" />
                                Custom Time Slots
                              </span>
                              <button
                                  type="button"
                                  onClick={() => addExceptionSlot(exIndex)}
                                  className="flex items-center gap-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors font-bold border border-slate-200"
                                >
                                <Plus className="w-3 h-3" />
                                Add Slot
                              </button>
                            </div>

                            {ex.slots.length === 0 ? (
                              <p className="text-center py-4 text-xs text-slate-400 font-medium">No custom slots added yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ex.slots.map((slot, slotIndex) => (
                                  <div key={slotIndex} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 animate-fadeIn">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <input
                                        type="time"
                                        value={slot.start}
                                        onChange={(e) => updateExceptionSlot(exIndex, slotIndex, 'start', e.target.value)}
                                        className="px-2 py-1 border border-slate-300 rounded text-xs outline-none"
                                      />
                                      <input
                                        type="time"
                                        value={slot.end}
                                        onChange={(e) => updateExceptionSlot(exIndex, slotIndex, 'end', e.target.value)}
                                        className="px-2 py-1 border border-slate-300 rounded text-xs outline-none"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeExceptionSlot(exIndex, slotIndex)}
                                      className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BUTTONS NAVIGATION */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              {formData.role === 'doctor' && currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(prev => prev - 1);
                    setError('');
                  }}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="flex-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 w-full shadow-lg shadow-primary-100"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    {formData.role === 'doctor' && currentStep < 4 ? (
                      <>
                        <span>Next Step</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    ) : (
                      <span>{formData.role === 'doctor' ? 'Submit Registration' : 'Create account'}</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>

          {currentStep === 1 && (
            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
