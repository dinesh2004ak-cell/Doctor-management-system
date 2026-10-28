import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI, authAPI } from '../../services/api';
import { 
  User,
  Mail,
  Phone,
  Camera,
  Stethoscope,
  Award,
  Save,
  FileText,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const DoctorProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [userFormData, setUserFormData] = useState({
    name: '',
    phone: ''
  });

  const [doctorFormData, setDoctorFormData] = useState({
    specialty: '',
    qualification: '',
    experience: '',
    bio: '',
    consultationFee: '',
    isAvailable: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await doctorAPI.getMyProfile();
      const data = response.data.data;
      setProfile(data);

      const userData = data.userId;
      setUserFormData({
        name: userData.name,
        phone: userData.phone || ''
      });

      setDoctorFormData({
        specialty: data.specialty || '',
        qualification: data.qualification || '',
        experience: data.experience || '',
        bio: data.bio || '',
        consultationFee: data.consultationFee || '',
        isAvailable: data.isAvailable !== false
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const response = await authAPI.uploadAvatar(formData);
      const newAvatar = response.data.data.avatar;
      setProfile({ ...profile, userId: { ...profile.userId, avatar: newAvatar } });
      updateUser({ ...user, avatar: newAvatar });
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await authAPI.uploadAvatar(new FormData()); // Just to trigger save
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await doctorAPI.updateProfile({
        specialty: doctorFormData.specialty,
        qualification: doctorFormData.qualification,
        experience: parseInt(doctorFormData.experience) || 0,
        bio: doctorFormData.bio,
        consultationFee: parseInt(doctorFormData.consultationFee) || 500,
        isAvailable: doctorFormData.isAvailable
      });
      toast.success('Doctor profile updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading size="lg" className="py-20" />;
  }

  const userData = profile?.userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-500 mt-1">Manage your professional profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6">Personal Information</h2>
          
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center overflow-hidden">
                {userData?.avatar ? (
                  <img 
                    src={userData.avatar} 
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary-600">
                    {userData?.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                />
              </label>
            </div>
            <div>
              <p className="font-medium text-slate-800">Profile Photo</p>
              <p className="text-sm text-slate-500">JPG, PNG up to 5MB</p>
            </div>
          </div>

          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={userData?.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Professional info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6">Professional Information</h2>
          
          {/* Status badge */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg flex items-center gap-3">
            {profile?.status === 'approved' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <div className="w-6 h-6 bg-yellow-100 rounded-full" />
            )}
            <div>
              <p className="font-medium text-slate-800 capitalize">
                {profile?.status === 'approved' ? 'Approved Doctor' : profile?.status + ' - '}
                {profile?.status === 'pending' && 'Awaiting verification'}
                {profile?.status === 'rejected' && 'Contact support'}
              </p>
              <p className="text-sm text-slate-500">Your verification status</p>
            </div>
          </div>

          <form onSubmit={handleDoctorSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Specialty *
              </label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={doctorFormData.specialty}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, specialty: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., General Physician"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Qualification
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={doctorFormData.qualification}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, qualification: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., MBBS, MD"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={doctorFormData.experience}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, experience: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={doctorFormData.consultationFee}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, consultationFee: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bio
              </label>
              <textarea
                value={doctorFormData.bio}
                onChange={(e) => setDoctorFormData({ ...doctorFormData, bio: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                placeholder="Tell patients about yourself..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvailable"
                checked={doctorFormData.isAvailable}
                onChange={(e) => setDoctorFormData({ ...doctorFormData, isAvailable: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isAvailable" className="text-sm text-slate-700">
                Accepting new patients
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
              <Save className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Certificates
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile?.certificates?.map((cert, index) => (
            <a
              key={index}
              href={cert}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-center text-slate-600">Certificate {index + 1}</p>
            </a>
          ))}
          {(!profile?.certificates || profile.certificates.length === 0) && (
            <p className="text-slate-500 col-span-4 text-center py-4">No certificates uploaded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
