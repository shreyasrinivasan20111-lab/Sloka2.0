# 🕉️ Sai Kalpataru Vidyalaya - Student Course Management System

A comprehensive web-based student course management system built for Sai Kalpataru Vidyalaya, featuring traditional Sanskrit course offerings and modern web technologies.

## 🌟 Features

### 🎓 Student Features
- **Student Registration & Login** - Secure account creation and authentication
- **Course Enrollment** - Access to 6 traditional Sanskrit courses
- **Time Tracking** - Built-in timer for study sessions
- **Progress Dashboard** - Personal learning analytics
- **Course Materials** - Download study materials and resources

### 👨‍🏫 Admin Features
- **Student Management** - Add, view, and manage student accounts
- **Course Assignment** - Assign multiple courses to students
- **File Upload** - Upload course materials for students
- **Analytics Dashboard** - View student progress and time statistics
- **Student Removal** - Remove students from courses as needed

### 📚 Available Courses
1. **śravaṇaṃ** (Listening)
2. **Kirtanam** (Singing/Chanting)
3. **Smaranam** (Remembering)
4. **Pada Sevanam** (Service at the Feet)
5. **Archanam** (Worship)
6. **Vandanam** (Prostration)

## 👥 Default Admin Accounts

The system comes with pre-configured admin accounts:

- **Admin 1**: `shreya.srinivasan2011@gmail.com` / `Bo142315`
- **Admin 2**: `jayab2021@gmail.com` / `Admin@123`

## 🚀 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **DuckDB** - Embedded analytical database
- **JWT Authentication** - Secure token-based authentication
- **PBKDF2** - Password hashing for security
- **Uvicorn** - ASGI server

### Frontend
- **HTML5 & CSS3** - Modern responsive design
- **JavaScript (jQuery)** - Interactive user interface
- **Custom CSS** - Beautiful UI with traditional color scheme
- **Mobile Responsive** - Works on all devices

### Deployment
- **Vercel Ready** - Configured for serverless deployment
- **Environment Variables** - Secure configuration management
- **Static File Serving** - Optimized asset delivery

## Local Development Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /Users/shreyasrinivasan/Desktop/Sloka2.0
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python main.py
   ```

4. **Access the application:**
   Open your browser and go to `http://localhost:8000`

### Development Notes

- The database (DuckDB) will be automatically created on first run
- Admin users are automatically seeded into the database
- All courses are pre-configured in the system
- Static files are served from the `/static` directory
- Templates are served from the `/templates` directory

## Deployment to Vercel

This application is fully configured for Vercel deployment:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

The `vercel.json` configuration file is already set up to handle the Python FastAPI backend.

## Project Structure

```
/
├── main.py                 # FastAPI backend application
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel deployment configuration
├── .env                   # Environment variables
├── students.db            # DuckDB database (created automatically)
├── static/
│   ├── css/
│   │   └── style.css      # Main stylesheet with custom color scheme
│   └── js/
│       └── app.js         # Main JavaScript application
└── templates/
    ├── base.html          # Base HTML template
    ├── index.html         # Home page
    ├── login.html         # Login page
    ├── signup.html        # Registration page
    ├── dashboard.html     # Student dashboard
    ├── admin.html         # Admin dashboard
    ├── course.html        # Course page with materials and timer
    └── error.html         # Error page
```

## Enhanced Admin Dashboard Features

### 🎯 Multiple Course Assignment
- **Checkbox Interface**: Admins can select multiple courses for each student
- **Real-time Updates**: Course assignments reflect immediately across the system
- **Visual Course Tags**: Assigned courses are displayed as color-coded tags
- **Bulk Management**: Easily add or remove multiple course assignments at once

### 📊 Enhanced Student Overview
- **At-a-Glance Information**: See student name, email, assigned courses, and total practice time
- **Practice Time Tracking**: Total time spent across all courses displayed prominently
- **Course Visualization**: Assigned courses shown as styled tags for easy identification
- **Detailed Statistics**: Click "Detailed Stats" to see comprehensive practice analytics
- **Student Management Actions**: Manage courses, view stats, or remove students with dedicated buttons

### 📈 Advanced Progress Monitoring
- **Course Breakdown**: See time spent on each individual course
- **Session Analytics**: Track number of practice sessions per course
- **Progress Indicators**: Visual progress bars showing student advancement
- **Average Session Time**: Calculate typical session duration for better insights

### 🎨 Improved User Interface
- **Modern Design**: Clean, professional interface with consistent styling
- **Time Badges**: Practice time displayed in attractive badges
- **Progress Cards**: Statistics presented in visually appealing cards
- **Responsive Tables**: Student management table adapts to all screen sizes

## Key Features Explained

### Student Workflow
1. **Registration**: Students register with first name, last name, and email
2. **Assignment**: Admins assign courses to students
3. **Learning**: Students access assigned courses, view materials, and track time
4. **Progress**: Students can view their time statistics and learning progress

### Admin Workflow
1. **Login**: Use admin credentials to access admin dashboard
2. **Enhanced Student Management**: View all registered students with their course assignments and total practice time
3. **Multiple Course Assignment**: Assign multiple courses to students simultaneously with checkbox interface
4. **Course Management**: Easily manage which courses each student is enrolled in
5. **Student Removal**: Remove students from the system with all associated data (with confirmation dialog)
6. **Material Upload**: Upload lyrics and recordings for each course
7. **Detailed Progress Monitoring**: View comprehensive time statistics with course breakdowns and progress indicators

### Time Tracking
- Each course page includes a timer with Start, Stop, and Restart buttons
- Time is automatically saved to the database when stopped
- Statistics are available for both students and admins
- Time tracking works seamlessly after Vercel deployment

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Admin-only routes and functionality
- Secure file upload with validation

## Color Scheme & Design

The application uses a custom color scheme as specified:
- **Primary Colors**: #C5A098 (lighter) and #B8927E (darker) in vertical stripes
- **Text Color**: #704f3b
- **Fonts**: 
  - Titles: 'Limelight' (Google Fonts)
  - Body: 'Nova Round' (Google Fonts)

## Error Handling

The application includes comprehensive error handling:
- Global JavaScript error handlers
- API error responses with meaningful messages
- Custom error page with debugging information
- Graceful fallbacks for network issues
- No blank pages or form submission failures

## Database Schema

### Users Table
- id, first_name, last_name, email, password_hash, is_admin, created_at

### Courses Table
- id, name, description, created_at

### Student Courses Table
- id, student_id, course_id, assigned_at

### Time Tracking Table
- id, student_id, course_id, start_time, end_time, duration, created_at

### Course Materials Table
- id, course_id, material_type, filename, content, uploaded_at

## API Endpoints

### Authentication
- `POST /api/register` - Student registration
- `POST /api/login` - User login

### Courses
- `GET /api/courses` - Get courses (filtered by user type)
- `GET /api/course-materials/{course_id}` - Get course materials
- `POST /api/upload-material/{course_id}` - Upload course material (admin only)

### Students & Management
- `GET /api/students` - Get all students with course assignments and practice time (admin only)
- `GET /api/student-assignments/{student_id}` - Get courses assigned to specific student (admin only)
- `POST /api/assign-course` - Assign single course to student (admin only)
- `POST /api/update-student-courses` - Update multiple course assignments for student (admin only)
- `POST /api/remove-student` - Remove student and all associated data (admin only)

### Time Tracking
- `POST /api/time-tracking` - Save time entry
- `GET /api/time-stats/{student_id}` - Get time statistics

## Mission Statement

Sai Kalpataru Vidyalaya is a non-profit organization formed in 2020, which began with teaching bhajans for young kids. This evolved into a structured curriculum where shlokas from Vedic literature are taught throughout the academic year.

The mission of this institution is to spread the word of Sanatana Dharma to the world and instill spiritual practice in young minds through recital of shlokas in Sanskrit language.

## Support

For technical issues or questions about the application, please check the error page for debugging information or contact the system administrators.
