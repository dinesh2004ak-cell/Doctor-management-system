import { NavLink, useLocation } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  UserCircle,
  Stethoscope,
  Shield,
  Clock,
  DollarSign,
  BookOpen
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, userRole }) => {
  const location = useLocation();

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctors', label: 'Find Doctors', icon: Stethoscope },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/prescriptions', label: 'Prescriptions', icon: FileText },
    { path: '/profile', label: 'Profile', icon: UserCircle }
  ];

  const doctorNavItems = [
    { path: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { path: '/doctor/schedule', label: 'Availability', icon: Clock },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { path: '/doctor/profile', label: 'Profile', icon: UserCircle }
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/appointments', label: 'Appointments', icon: Calendar },
    { path: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  const navItems = userRole === 'admin' ? adminNavItems 
    : userRole === 'doctor' ? doctorNavItems 
    : userNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-800"></span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Role indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              {userRole === 'admin' ? (
                <Shield className="w-4 h-4 text-primary-600" />
              ) : userRole === 'doctor' ? (
                <Stethoscope className="w-4 h-4 text-primary-600" />
              ) : (
                <Users className="w-4 h-4 text-primary-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
