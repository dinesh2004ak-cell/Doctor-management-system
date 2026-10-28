import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastProvider from './context/ToastContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import Doctors from './pages/user/Doctors';
import DoctorDetail from './pages/user/DoctorDetail';
import UserAppointments from './pages/user/Appointments';
import UserPrescriptions from './pages/user/Prescriptions';
import UserProfile from './pages/user/Profile';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorSchedule from './pages/doctor/Schedule';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorProfile from './pages/doctor/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminDoctors from './pages/admin/Doctors';
import AdminUsers from './pages/admin/Users';
import AdminAppointments from './pages/admin/Appointments';
import AdminSettings from './pages/admin/Settings';

// Components
import Loading from './components/common/Loading';
import ProtectedRoute from './components/common/ProtectedRoute';

// Helper component for role-based redirects
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'doctor':
      return <Navigate to="/doctor" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Role-based redirect */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Protected routes with dashboard layout */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
              <Route path="/doctors" element={<ProtectedRoute allowedRoles={['user']}><Doctors /></ProtectedRoute>} />
              <Route path="/doctors/:id" element={<ProtectedRoute allowedRoles={['user']}><DoctorDetail /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute allowedRoles={['user']}><UserAppointments /></ProtectedRoute>} />
              <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={['user']}><UserPrescriptions /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'doctor']}><UserProfile /></ProtectedRoute>} />
              
              {/* Doctor Routes */}
              <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
              <Route path="/doctor/schedule" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorSchedule /></ProtectedRoute>} />
              <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPrescriptions /></ProtectedRoute>} />
              <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfile /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDoctors /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointments /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
