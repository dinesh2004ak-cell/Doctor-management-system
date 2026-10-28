import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
  Settings as SettingsIcon,
  Percent,
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  Upload,
  Bell,
  Shield,
  DollarSign
} from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    appName: '',
    tagline: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    commission: 10,
    emailNotifications: true,
    smsNotifications: true,
    reminder_1d: true,
    reminder_1h: true,
    reminder_15m: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      const data = response.data.data;
      setSettings(data);
      setFormData({
        appName: data.appName || '',
        tagline: data.tagline || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        commission: data.commission || 10,
        emailNotifications: data.emailNotifications !== false,
        smsNotifications: data.smsNotifications !== false,
        reminder_1d: data.reminders?.reminder_1d !== false,
        reminder_1h: data.reminders?.reminder_1h !== false,
        reminder_15m: data.reminders?.reminder_15m !== false
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    setUploading(true);
    try {
      const response = await adminAPI.uploadLogo(formData);
      setSettings({ ...settings, logo: response.data.data.logo });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminAPI.updateSettings({
        appName: formData.appName,
        tagline: formData.tagline,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        commission: parseFloat(formData.commission),
        emailNotifications: formData.emailNotifications,
        smsNotifications: formData.smsNotifications,
        reminders: {
          reminder_1d: formData.reminder_1d,
          reminder_1h: formData.reminder_1h,
          reminder_15m: formData.reminder_15m
        }
      });
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Configure your application settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Branding
          </h2>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Application Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                {settings?.logo ? (
                  <img 
                    src={settings.logo} 
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <label className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer inline-flex items-center gap-2">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Logo
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Application Name
              </label>
              <input
                type="text"
                name="appName"
                value={formData.appName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="MediBook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your Health, Our Priority"
              />
            </div>
          </div>
        </div>

        {/* Commission */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Commission Settings
          </h2>

          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Platform Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              This percentage will be added to each appointment as service charge
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-800">Email Notifications</p>
                <p className="text-sm text-slate-500">Send email notifications to users</p>
              </div>
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="font-medium text-slate-800">SMS Notifications</p>
                <p className="text-sm text-slate-500">Send SMS notifications to users</p>
              </div>
              <input
                type="checkbox"
                name="smsNotifications"
                checked={formData.smsNotifications}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Appointment Reminders
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-800">1 Day Before</p>
                <p className="text-sm text-slate-500">Send reminder 24 hours before appointment</p>
              </div>
              <input
                type="checkbox"
                name="reminder_1d"
                checked={formData.reminder_1d}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="font-medium text-slate-800">1 Hour Before</p>
                <p className="text-sm text-slate-500">Send reminder 1 hour before appointment</p>
              </div>
              <input
                type="checkbox"
                name="reminder_1h"
                checked={formData.reminder_1h}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div>
                <p className="font-medium text-slate-800">15 Minutes Before</p>
                <p className="text-sm text-slate-500">Send reminder 15 minutes before appointment</p>
              </div>
              <input
                type="checkbox"
                name="reminder_15m"
                checked={formData.reminder_15m}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
