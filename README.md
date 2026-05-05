# AttendTrack - Automated Class Attendance System

A full-stack web application for automated class attendance using fingerprint-based TOTP verification. Built with Django (backend) and React + Vite (frontend).

## Technology Stack

- **Backend:** Django 5.x, Django REST Framework, SimpleJWT
- **Frontend:** React 18, Vite, React Router, Recharts, Axios
- **Database:** PostgreSQL (SQLite fallback for development)
- **Auth:** JWT for lecturers/admins, TOTP (stubbed) for students
- **Dependencies:** Managed with Pipenv (backend) and npm (frontend)

## Project Structure

```
Attendance_System/
├── Pipfile              # Python dependencies
├── README.md
├── backend/
│   ├── manage.py
│   ├── config/          # Django settings, URLs
│   ├── accounts/        # User, StudentProfile, LecturerProfile
│   ├── courses/         # Course, Enrollment, Assignment
│   ├── attendance/      # ClassSession, Attendance, TOTP stubs
│   ├── system_logs/     # SystemLog audit trail
│   └── seed/            # Test data seeding command
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx      # Main routing
        ├── index.css    # Design system
        ├── api/         # Axios config
        ├── context/     # Auth context
        ├── components/  # Layout, Sidebar, Footer
        └── pages/       # All page components
```

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to project root
cd Attendance_System

# Install Python dependencies with Pipenv
pipenv install

# Activate the virtual environment
pipenv shell

# Navigate to backend directory
cd backend

# Run migrations
python manage.py makemigrations accounts courses attendance system_logs
python manage.py migrate

# Seed test data (creates admin, test student, test lecturer, sample courses)
python manage.py seed_data

# Start Django development server
python manage.py runserver
```

### 2. Frontend Setup

```bash
# Open a new terminal, navigate to frontend
cd Attendance_System/frontend

# Install dependencies (already done if you ran npm install)
npm install

# Start Vite development server
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to Django on `http://localhost:8000`.

### 3. Database Configuration

By default, the application uses **SQLite** for development. To use PostgreSQL, set these environment variables before running Django:

```bash
export DB_NAME=attendance_db
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
```

## Test Accounts

After running `python manage.py seed_data`, the following test accounts are available:

| Role     | Email / ID                | Password / OTP |
|----------|---------------------------|----------------|
| Admin    | admin@system.com          | Admin@1234     |
| Lecturer | test@lecturer.com         | Test@1234      |
| Student  | Fingerprint ID: **999**   | OTP: **482391**|

### Student Test Flow
1. Go to `/student/attendance`
2. Enter Fingerprint ID: `999`
3. Enter OTP: `482391`
4. Attendance will be recorded for any active class session

### Lecturer Test Flow
1. Go to `/auth/login`
2. Email: `test@lecturer.com`, Password: `Test@1234`
3. Navigate through the dashboard, course details, schedule, reports

### Admin Test Flow
1. Go to `/auth/login`
2. Email: `admin@system.com`, Password: `Admin@1234`
3. Manage courses, lecturers, students, and view system logs

## Key URLs

| Path                    | Description                          |
|-------------------------|--------------------------------------|
| `/`                     | Redirects to `/auth/login`           |
| `/auth/login`           | Login page (lecturers & admins)      |
| `/auth/signup`          | Registration (student or lecturer)   |
| `/student/attendance`   | Student attendance portal (public)   |
| `/student/history`      | Student attendance history (public)  |
| `/lecturer/dashboard`   | Lecturer dashboard (protected)       |
| `/lecturer/course/:id`  | Course detail with tabs (protected)  |
| `/admin-portal`         | Admin dashboard (protected)          |
| `/admin-portal/courses` | Manage courses (admin)               |
| `/admin-portal/lecturers`| Manage lecturers (admin)            |
| `/admin-portal/students`| Manage students (admin)              |
| `/admin-portal/logs`    | System logs (admin)                  |
| `/contact`              | Contact Us form                      |
| `/faq`                  | FAQ page                             |
| `/privacy`              | Privacy Policy                       |

## TOTP / Hardware Integration Notes

The TOTP verification is currently **stubbed** for development:

- **Test student (ID 999):** Accepts fixed OTP `482391`
- **All other students:** Returns "OTP verification pending hardware integration"
- **Stub location:** `backend/attendance/totp_utils.py`
- **TODO comments** are placed throughout the codebase for future pyotp integration

When the Arduino + RTC hardware is ready:
1. Each student gets a unique base32 TOTP secret stored in the database
2. The Arduino generates TOTP codes using the shared secret + RTC time
3. The server verifies using `pyotp.TOTP(secret).verify(code)`
4. Update `totp_utils.py` to use real pyotp verification

## API Endpoints

### Authentication
- `POST /api/auth/signup/student/` - Student registration
- `POST /api/auth/signup/lecturer/` - Lecturer registration
- `POST /api/auth/login/` - JWT login
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/forgot-password/` - Password reset request
- `GET /api/auth/me/` - Current user profile

### Courses
- `GET /api/courses/` - List courses (filterable)
- `POST /api/courses/` - Create course (admin)
- `GET /api/courses/my-courses/` - Lecturer's courses
- `POST /api/courses/assign-lecturer/` - Assign lecturer (admin)

### Attendance
- `POST /api/attendance/mark/` - Mark attendance (public)
- `POST /api/attendance/history/` - Student history (public)
- `GET/POST /api/attendance/sessions/` - List/create sessions
- `GET /api/attendance/report/<course_id>/` - Course report
- `GET /api/attendance/export/<course_id>/` - CSV export
- `POST /api/attendance/grades/<course_id>/` - Calculate grades

### System Logs
- `GET /api/logs/` - Admin system logs

## Color Palette

- **Primary:** `#2E7D32` (Cool green)
- **White:** `#FFFFFF`
- **Background:** `#F5F5F5` (Light grey)
- **Typography:** Inter / System sans-serif

## Copyright

(c) 2026 DEA Final Year Project
