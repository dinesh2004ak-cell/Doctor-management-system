# MediBook – Doctor Appointment System
Project Description: A MERN stack web application that allows patients to book doctor appointments online, doctors to manage appointments, and admins to manage the platform.
# Main Features
- Patient: Register/login, search doctors, book appointments, view prescriptions.
- Doctor: Manage profile, set availability, manage appointments, add prescriptions.
- Admin: Approve doctors, monitor appointments, manage users and commission settings.
# Tech Stack
- Frontend: React, React Router, Tailwind CSS, Axios
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Authentication: JWT, bcryptjs
# Important Functionalities
- Role-based authentication (Patient, Doctor, Admin).
- Slot-based booking prevents double bookings.
- Doctor fees and admin commission calculation.
- Appointment cancellation/rescheduling restricted within 24 hours.
- Appointment reminders and notifications.
- Doctor approval by admin before accepting appointments.
How to Run
# Backend
cd backend
npm install
npm run dev


# Frontend (new terminal)
cd frontend
npm install
npm run dev


Demo Admin Login
- Email: admin@medibook.com
- Password: admin123
Note: Demo login works only if the initial admin account has been created in the database.
Project Structure
- models – Database schemas
- controllers – Application logic
- routes – API endpoints
- middleware – Authentication and file uploads
- pages – React screens
- services – API integration

## License

MIT License
