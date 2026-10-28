# Doctor Appointment System - Specification

## 1. Concept & Vision

A professional medical appointment booking platform that connects patients with verified healthcare providers. The system emphasizes trust through doctor verification, transparency in pricing (including all fees), and reliability through intelligent scheduling with reminders. The aesthetic is clinical yet warm—professional enough for medical contexts while remaining approachable for patients.

## 2. Design Language

### Aesthetic Direction
Clean medical-professional aesthetic inspired by modern healthcare apps like Zocdoc and Docplanner. White space dominates, with teal/emerald accents suggesting health and vitality. Card-based layouts with subtle shadows create depth without clutter.

### Color Palette
```
Primary:        #0D9488 (teal-600 - trust, health)
Primary Dark:   #0F766E (teal-700)
Secondary:      #6366F1 (indigo-500 - action buttons)
Accent:         #F59E0B (amber-500 - alerts, notifications)
Success:        #10B981 (emerald-500)
Warning:        #F59E0B (amber-500)
Error:          #EF4444 (red-500)
Background:     #F8FAFC (slate-50)
Surface:        #FFFFFF
Text Primary:   #1E293B (slate-800)
Text Secondary: #64748B (slate-500)
Border:         #E2E8F0 (slate-200)
```

### Typography
- Headings: Inter (600-700 weight)
- Body: Inter (400-500 weight)
- Monospace (codes/IDs): JetBrains Mono

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Card shadows: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)

### Motion Philosophy
- Page transitions: fade 200ms ease-out
- Button hover: scale 1.02, 150ms
- Card hover: translateY -2px, shadow increase
- Toast notifications: slide-in from right, 300ms
- Loading states: pulse animation on skeletons

### Visual Assets
- Icons: Lucide React (consistent stroke width)
- Doctor avatars: placeholder with initials
- Status badges: pill-shaped with semantic colors
- Empty states: simple illustrations with muted colors

## 3. Layout & Structure

### Overall Architecture
```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo, Nav, User Menu)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sidebar (role-based navigation)    │   Main Content   │
│  - Dashboard                       │                   │
│  - Profile                          │   [Dynamic]      │
│  - [Role-specific items]           │                   │
│                                     │                   │
├─────────────────────────────────────────────────────────┤
│  Footer (minimal)                                       │
└─────────────────────────────────────────────────────────┘
```

### Page Structure by Role

**User Dashboard:**
- Quick stats (upcoming appointments, prescriptions)
- Upcoming appointments list
- Available doctors preview
- Recent notifications

**Doctor Dashboard:**
- Today's schedule
- Pending appointments
- Earnings summary (this week/month)
- Quick actions

**Admin Dashboard:**
- Stats overview (users, doctors, appointments, revenue)
- Pending doctor approvals
- Recent activity feed
- Settings access

### Responsive Strategy
- Desktop: Sidebar + content layout
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation, stacked cards

## 4. Features & Interactions

### Authentication
- **Register:** Email, password, name, phone, role selection
- **Login:** Email/password with JWT tokens
- **Session:** Access token (15min) + Refresh token (7 days)
- **Logout:** Clear tokens, redirect to login

### User Features

#### View Doctors
- Grid of doctor cards with photo, name, specialty, rating, fees
- Filter by specialty, availability, price range
- Search by name or specialty
- Click → Doctor detail page with bio, certificates, slots

#### Book Appointment
- Select doctor → View available date slots (calendar)
- Select date → View time slots for that day
- Select slot → Confirm booking modal showing:
  - Doctor name, specialty
  - Date, time
  - Fee breakdown (doctor fee + commission = total)
- Confirm → Create appointment, deduct payment, send notification

#### View Appointments
- Tabs: Upcoming, Completed, Cancelled
- Each appointment shows: doctor, date/time, status, actions
- Actions: Reschedule (if >24h away), Cancel (if >24h away)

#### View Prescriptions
- List of prescriptions with date, doctor, diagnosis
- Expandable to see full prescription details

#### Notifications
- Bell icon with unread count
- Dropdown list of notifications
- Types: booking confirmation, reminders, completion, reschedule

### Doctor Features

#### Registration & Approval
- Register with certificate upload
- Status: Pending → Approved/Rejected by admin
- Can edit profile while pending

#### Profile Management
- Update: name, specialty, bio, consultation fee, available hours
- Upload profile photo, certificates
- Set weekly availability schedule

#### Availability Management
- Set recurring weekly schedule (e.g., Mon-Fri, 9am-5pm)
- Add/remove specific date exceptions
- View slot utilization

#### View Appointments
- Today's appointments (timeline view)
- All appointments (calendar/list)
- Patient details (name, contact, complaint)

#### Add Prescription
- Select appointment (must be completed/past)
- Add diagnosis, medications, notes
- Attach files if needed

### Admin Features

#### Dashboard
- Stats cards: Total Users, Active Doctors, Appointments Today, Revenue
- Charts: Appointments trend, Revenue by month
- Recent activity log

#### Doctor Management
- List all doctors with status
- Approve/Reject pending doctors
- View doctor details, certificates
- Deactivate doctors

#### User Management
- List all users
- View user details, appointment history
- Deactivate users

#### Appointment Monitoring
- View all appointments
- Filter by status, date, doctor, user
- Handle disputes/issues

#### Settings
- **Commission:** Set percentage (e.g., 10%)
- **Branding:** Upload app logo, set clinic name
- **Notifications:** Toggle email/SMS reminders

### Core Logic

#### Slot-Based Booking
- Slots are 30-minute intervals within doctor's availability
- When booked, slot becomes unavailable
- No double booking allowed (database constraint)

#### Fee Calculation
```
Total Fee = Doctor Fee + (Doctor Fee × Commission %)
Example: Doctor fee ₹500, Commission 10%
Total = ₹500 + ₹50 = ₹550
```

#### Rescheduling Logic
- On appointment day, if patient doesn't confirm within 15 min:
  - Auto-reschedule to next available slot same day
  - If none, find next day with availability
  - If still none, mark as "Reschedule Needed" - patient must rebook
- Only if appointment is within next 24h

#### Cancellation/Reschedule Restrictions
- Cannot cancel or reschedule within 24 hours of appointment
- Button disabled with tooltip explaining restriction

#### Notifications (Simulated)
- Booking confirmation: Immediate
- 1 day reminder: Cron job checks daily
- 1 hour reminder: Cron job checks hourly
- 15 min reminder: Cron job checks every 15 min
- Completion: After appointment time passes

## 5. Component Inventory

### Buttons
- **Primary:** Teal background, white text, hover darkens
- **Secondary:** White background, teal border, teal text
- **Danger:** Red background for destructive actions
- **States:** Default, hover, active, disabled, loading (spinner)

### Cards
- **Doctor Card:** Photo, name, specialty, rating, fee, book button
- **Appointment Card:** Date/time, doctor, status badge, actions
- **Stat Card:** Icon, value, label, trend indicator

### Forms
- **Input:** Border, focus ring, error state with red border + message
- **Select:** Custom dropdown with search for long lists
- **File Upload:** Dashed border zone, drag-drop, preview

### Tables
- **Data Table:** Sortable headers, pagination, row actions
- **Mobile:** Card view instead of table

### Navigation
- **Sidebar:** Icon + label, active state highlight
- **Header:** Logo, nav links, user dropdown

### Feedback
- **Toast:** Success (green), Error (red), Info (blue), slide-in animation
- **Modal:** Centered, backdrop blur, close button
- **Skeleton:** Pulse animation for loading states

### Status Badges
- **Pending:** Yellow background, dark text
- **Approved/Confirmed:** Green background
- **Completed:** Blue background
- **Cancelled:** Red background, strikethrough
- **Rejected:** Red background

## 6. Technical Approach

### Backend (Node.js + Express)

#### Directory Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── jwt.js         # JWT config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── doctorController.js
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js        # JWT verification
│   │   ├── roleAuth.js    # Role-based access
│   │   └── upload.js      # Multer config
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   ├── Prescription.js
│   │   ├── Notification.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── doctors.js
│   │   ├── appointments.js
│   │   └── admin.js
│   ├── services/
│   │   ├── appointmentService.js
│   │   ├── notificationService.js
│   │   └── slotService.js
│   └── utils/
│       └── helpers.js
│   └── app.js
├── uploads/
│   ├── certificates/
│   └── logos/
└── package.json
```

#### API Endpoints

**Auth**
- POST /api/auth/register - Register user/doctor
- POST /api/auth/login - Login
- POST /api/auth/refresh - Refresh token
- POST /api/auth/logout - Logout

**Users**
- GET /api/users/profile - Get own profile
- PUT /api/users/profile - Update profile
- GET /api/users/appointments - Get appointments
- GET /api/users/prescriptions - Get prescriptions
- GET /api/users/notifications - Get notifications

**Doctors**
- GET /api/doctors - List all approved doctors
- GET /api/doctors/:id - Get doctor details
- POST /api/doctors/register - Register as doctor
- PUT /api/doctors/profile - Update profile (own)
- GET /api/doctors/slots - Get available slots
- PUT /api/doctors/availability - Set availability

**Appointments**
- POST /api/appointments - Book appointment
- GET /api/appointments - List appointments
- PUT /api/appointments/:id/confirm - Confirm appointment
- PUT /api/appointments/:id/reschedule - Reschedule
- PUT /api/appointments/:id/cancel - Cancel

**Prescriptions**
- POST /api/prescriptions - Create prescription
- GET /api/prescriptions/:appointmentId - Get for appointment

**Admin**
- GET /api/admin/dashboard - Dashboard stats
- GET /api/admin/doctors - All doctors with status
- PUT /api/admin/doctors/:id/approve - Approve doctor
- PUT /api/admin/doctors/:id/reject - Reject doctor
- GET /api/admin/users - All users
- GET /api/admin/appointments - All appointments
- GET /api/admin/settings - Get settings
- PUT /api/admin/settings - Update settings

#### Database Models

**User**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: Enum ['user', 'doctor', 'admin'],
  avatar: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Doctor**
```javascript
{
  userId: ObjectId (ref User),
  specialty: String,
  qualification: String,
  experience: Number,
  bio: String,
  consultationFee: Number,
  certificate: String,
  certificates: [String],
  status: Enum ['pending', 'approved', 'rejected'],
  rating: Number,
  totalRatings: Number,
  availability: {
    monday: [{ start: String, end: String }],
    tuesday: [...],
    // ... other days
  },
  exceptions: [{ date: Date, available: Boolean }],
  createdAt: Date,
  updatedAt: Date
}
```

**Appointment**
```javascript
{
  userId: ObjectId (ref User),
  doctorId: ObjectId (ref Doctor),
  date: Date,
  startTime: String,
  endTime: String,
  status: Enum ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
  fee: Number,
  commission: Number,
  totalFee: Number,
  reason: String,
  notes: String,
  rescheduleCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Prescription**
```javascript
{
  appointmentId: ObjectId (ref Appointment),
  doctorId: ObjectId (ref Doctor),
  userId: ObjectId (ref User),
  diagnosis: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: String,
  attachments: [String],
  createdAt: Date
}
```

**Notification**
```javascript
{
  userId: ObjectId (ref User),
  type: Enum ['booking', 'reminder_1d', 'reminder_1h', 'reminder_15m', 'completed', 'cancelled'],
  title: String,
  message: String,
  data: Object,
  isRead: Boolean,
  createdAt: Date
}
```

**Settings**
```javascript
{
  commission: Number (percentage),
  appName: String,
  logo: String,
  emailNotifications: Boolean,
  smsNotifications: Boolean,
  reminder_1d: Boolean,
  reminder_1h: Boolean,
  reminder_15m: Boolean
}
```

### Frontend (React)

#### Directory Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── layout/
│   │   │   └── Layout.jsx
│   │   ├── appointments/
│   │   │   ├── AppointmentCard.jsx
│   │   │   ├── SlotPicker.jsx
│   │   │   └── BookingModal.jsx
│   │   ├── doctors/
│   │   │   ├── DoctorCard.jsx
│   │   │   ├── DoctorList.jsx
│   │   │   └── AvailabilityForm.jsx
│   │   └── prescriptions/
│   │       └── PrescriptionCard.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── user/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Doctors.jsx
│   │   │   ├── DoctorDetail.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Prescriptions.jsx
│   │   │   └── Profile.jsx
│   │   ├── doctor/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Schedule.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Prescriptions.jsx
│   │   │   └── Profile.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Doctors.jsx
│   │       ├── Users.jsx
│   │       ├── Appointments.jsx
│   │       └── Settings.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   └── useApi.js
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

#### Key Libraries
- React 18
- React Router v6
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons
- React Hot Toast for notifications
- date-fns for date manipulation
- React Query for data fetching

### File Upload (Multer)
- Destination: `/uploads/` with subdirectories
- Max file size: 5MB
- Allowed types: jpg, jpeg, png, pdf
- Generates unique filenames with timestamp

### Security
- Password hashing with bcrypt
- JWT with short expiry + refresh tokens
- Role-based middleware
- Input validation with express-validator
- File upload validation
