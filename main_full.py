from fastapi import FastAPI, HTTPException, Depends, Request, File, UploadFile, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import duckdb
import os
from typing import Optional, List
import json
import base64
import hashlib
import secrets

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")
        # Continue anyway - database will be initialized on first request
    yield
    # Shutdown
    pass

app = FastAPI(lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "sai-kalpataru-secret-key-2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

security = HTTPBearer()

# Global database connection
db_conn = None

# Helper function to get database connection
def get_db():
    global db_conn
    if db_conn is None:
        init_db()
    return db_conn

# Database initialization
def init_db():
    global db_conn
    # Use in-memory database for serverless environments
    # In production, you'd use a proper database service
    try:
        # Try to use a temporary file first
        db_path = "/tmp/students.db" if os.path.exists("/tmp") else ":memory:"
        db_conn = duckdb.connect(db_path)
        conn = db_conn
    except Exception as e:
        # Fallback to in-memory database
        db_conn = duckdb.connect(":memory:")
        conn = db_conn
    
    # Users table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            first_name VARCHAR,
            last_name VARCHAR,
            email VARCHAR UNIQUE,
            password_hash VARCHAR,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Courses table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY,
            name VARCHAR UNIQUE,
            description VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Student course assignments
    conn.execute("""
        CREATE TABLE IF NOT EXISTS student_courses (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            course_id INTEGER,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    """)
    
    # Time tracking
    conn.execute("""
        CREATE TABLE IF NOT EXISTS time_tracking (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            course_id INTEGER,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            duration INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    """)
    
    # Course materials
    conn.execute("""
        CREATE TABLE IF NOT EXISTS course_materials (
            id INTEGER PRIMARY KEY,
            course_id INTEGER,
            material_type VARCHAR, -- 'lyrics' or 'recording'
            filename VARCHAR,
            content BLOB,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    """)
    
    # Insert default courses
    courses = ["śravaṇaṃ", "Kirtanam", "Smaranam", "Pada Sevanam", "Archanam", "Vandanam"]
    for i, course in enumerate(courses, 1):
        conn.execute("INSERT OR IGNORE INTO courses (id, name, description) VALUES (?, ?, ?)", 
                    (i, course, f"Traditional Vedic practice: {course}"))
    
    # Insert admin users
    admin_hash1 = get_password_hash("Bo142315")
    admin_hash2 = get_password_hash("Admin@123")
    
    conn.execute("""
        INSERT OR IGNORE INTO users (id, first_name, last_name, email, password_hash, is_admin) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, (1, "Shreya", "Srinivasan", "shreya.srinivasan2011@gmail.com", admin_hash1, True))
    
    conn.execute("""
        INSERT OR IGNORE INTO users (id, first_name, last_name, email, password_hash, is_admin) 
        VALUES (?, ?, ?, ?, ?, ?)
    """, (2, "Jaya", "B", "jayab2021@gmail.com", admin_hash2, True))
    

# Models
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TimeEntry(BaseModel):
    course_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[int] = None

# Utility functions
def verify_password(plain_password, hashed_password):
    # Split the stored hash to get salt and hash
    try:
        stored_salt, stored_hash = hashed_password.split('$', 1)
        # Hash the plain password with the stored salt
        password_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), stored_salt.encode('utf-8'), 100000)
        return secrets.compare_digest(password_hash.hex(), stored_hash)
    except:
        return False

def get_password_hash(password):
    # Generate a random salt
    salt = secrets.token_hex(32)
    # Hash the password with the salt
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    # Return salt$hash format
    return f"{salt}${password_hash.hex()}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    conn = get_db()
    user = conn.execute("""
        SELECT id, first_name, last_name, email, password_hash, is_admin 
        FROM users 
        WHERE email = ?
    """, (email,)).fetchone()
    
    if user is None:
        raise credentials_exception
    return user

# Routes

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

@app.get("/course/{course_id}", response_class=HTMLResponse)
async def course_page(request: Request, course_id: int):
    return templates.TemplateResponse("course.html", {"request": request, "course_id": course_id})

@app.get("/error", response_class=HTMLResponse)
async def error_page(request: Request):
    return templates.TemplateResponse("error.html", {"request": request})

# API Routes
@app.post("/api/register")
async def register(user: UserCreate):
    try:
        conn = get_db()
        
        # Check if user already exists
        existing_user = conn.execute("""
            SELECT id, first_name, last_name, email, password_hash, is_admin 
            FROM users 
            WHERE email = ?
        """, (user.email,)).fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        password_hash = get_password_hash(user.password)
        # Get next user ID
        max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM users").fetchone()[0]
        next_id = max_id + 1
        conn.execute("""
            INSERT INTO users (id, first_name, last_name, email, password_hash, is_admin) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (next_id, user.first_name, user.last_name, user.email, password_hash, False))
        
        return {"message": "User registered successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/login")
async def login(user: UserLogin):
    try:
        conn = get_db()
        db_user = conn.execute("""
            SELECT id, first_name, last_name, email, password_hash, is_admin 
            FROM users 
            WHERE email = ?
        """, (user.email,)).fetchone()
        
        if not db_user or not verify_password(user.password, db_user[4]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user[0],
                "first_name": db_user[1],
                "last_name": db_user[2],
                "email": db_user[3],
                "is_admin": db_user[5]
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/courses")
async def get_courses(current_user: tuple = Depends(get_current_user)):
    try:
        conn = get_db()
        
        if current_user[5]:  # is_admin
            courses = conn.execute("SELECT * FROM courses ORDER BY name").fetchall()
        else:
            # Get only assigned courses for students
            courses = conn.execute("""
                SELECT c.* FROM courses c
                JOIN student_courses sc ON c.id = sc.course_id
                WHERE sc.student_id = ?
                ORDER BY c.name
            """, (current_user[0],)).fetchall()
        
        
        course_list = []
        for course in courses:
            course_list.append({
                "id": course[0],
                "name": course[1],
                "description": course[2],
                "created_at": str(course[3])
            })
        
        return course_list
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/students")
async def get_students(current_user: tuple = Depends(get_current_user)):
    try:
        if not current_user[5]:  # Not admin
            raise HTTPException(status_code=403, detail="Admin access required")
        
        conn = get_db()
        # First get all students
        students_basic = conn.execute("""
            SELECT id, first_name, last_name, email
            FROM users
            WHERE is_admin = FALSE
            ORDER BY first_name, last_name
        """).fetchall()
        
        student_list = []
        for student in students_basic:
            student_id = student[0]
            
            # Get assigned courses
            courses = conn.execute("""
                SELECT c.name
                FROM student_courses sc
                JOIN courses c ON sc.course_id = c.id
                WHERE sc.student_id = ?
                ORDER BY c.name
            """, (student_id,)).fetchall()
            
            # Get total practice time
            total_time = conn.execute("""
                SELECT COALESCE(SUM(duration), 0)
                FROM time_tracking
                WHERE student_id = ?
            """, (student_id,)).fetchone()[0]
            
            assigned_courses = ", ".join([course[0] for course in courses]) if courses else ""
            
            student_list.append({
                "id": student[0],
                "first_name": student[1],
                "last_name": student[2],
                "email": student[3],
                "assigned_courses": assigned_courses,
                "total_practice_time": total_time or 0
            })
        
        return student_list

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/assign-course")
async def assign_course(student_id: int = Form(...), course_id: int = Form(...), current_user: tuple = Depends(get_current_user)):
    try:
        if not current_user[5]:  # Not admin
            raise HTTPException(status_code=403, detail="Admin access required")
        
        conn = get_db()
        
        # Check if assignment already exists
        existing = conn.execute("""
            SELECT * FROM student_courses WHERE student_id = ? AND course_id = ?
        """, (student_id, course_id)).fetchone()
        
        if not existing:
            # Get next ID
            max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM student_courses").fetchone()[0]
            next_id = max_id + 1
            conn.execute("""
                INSERT INTO student_courses (id, student_id, course_id) VALUES (?, ?, ?)
            """, (next_id, student_id, course_id))
        
        return {"message": "Course assigned successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/time-tracking")
async def save_time_entry(time_entry: TimeEntry, current_user: tuple = Depends(get_current_user)):
    try:
        conn = get_db()
        
        # Get next ID
        max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM time_tracking").fetchone()[0]
        next_id = max_id + 1
        conn.execute("""
            INSERT INTO time_tracking (id, student_id, course_id, start_time, end_time, duration)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (next_id, current_user[0], time_entry.course_id, time_entry.start_time, 
              time_entry.end_time, time_entry.duration))
        
        return {"message": "Time entry saved successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/time-stats/{student_id}")
async def get_time_stats(student_id: int, current_user: tuple = Depends(get_current_user)):
    try:
        if not current_user[5] and current_user[0] != student_id:  # Not admin and not own stats
            raise HTTPException(status_code=403, detail="Access denied")
        
        conn = get_db()
        stats = conn.execute("""
            SELECT c.name, SUM(tt.duration) as total_time, COUNT(tt.id) as sessions
            FROM time_tracking tt
            JOIN courses c ON tt.course_id = c.id
            WHERE tt.student_id = ?
            GROUP BY c.id, c.name
            ORDER BY total_time DESC
        """, (student_id,)).fetchall()
        
        stats_list = []
        for stat in stats:
            stats_list.append({
                "course_name": stat[0],
                "total_time": stat[1] or 0,
                "sessions": stat[2] or 0
            })
        
        return stats_list
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/upload-material/{course_id}")
async def upload_material(
    course_id: int,
    material_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: tuple = Depends(get_current_user)
):
    try:
        if not current_user[5]:  # Not admin
            raise HTTPException(status_code=403, detail="Admin access required")
        
        content = await file.read()
        
        conn = get_db()
        # Get next ID
        max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM course_materials").fetchone()[0]
        next_id = max_id + 1
        conn.execute("""
            INSERT INTO course_materials (id, course_id, material_type, filename, content)
            VALUES (?, ?, ?, ?, ?)
        """, (next_id, course_id, material_type, file.filename, content))
        
        return {"message": "Material uploaded successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/course-materials/{course_id}")
async def get_course_materials(course_id: int, current_user: tuple = Depends(get_current_user)):
    try:
        conn = get_db()
        materials = conn.execute("""
            SELECT id, material_type, filename, uploaded_at
            FROM course_materials
            WHERE course_id = ?
            ORDER BY material_type, uploaded_at DESC
        """, (course_id,)).fetchall()
        
        material_list = []
        for material in materials:
            material_list.append({
                "id": material[0],
                "material_type": material[1],
                "filename": material[2],
                "uploaded_at": str(material[3])
            })
        
        return material_list
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/download-material/{material_id}")
async def download_material(material_id: int, current_user: tuple = Depends(get_current_user)):
    try:
        conn = get_db()
        material = conn.execute("""
            SELECT filename, content FROM course_materials WHERE id = ?
        """, (material_id,)).fetchone()
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        return JSONResponse({
            "filename": material[0],
            "content": base64.b64encode(material[1]).decode('utf-8')
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/student-assignments/{student_id}")
async def get_student_assignments(student_id: int, current_user: tuple = Depends(get_current_user)):
    try:
        if not current_user[5]:  # Not admin
            raise HTTPException(status_code=403, detail="Admin access required")
        
        conn = get_db()
        assignments = conn.execute("""
            SELECT sc.course_id, c.name
            FROM student_courses sc
            JOIN courses c ON sc.course_id = c.id
            WHERE sc.student_id = ?
            ORDER BY c.name
        """, (student_id,)).fetchall()
        
        assignment_list = []
        for assignment in assignments:
            assignment_list.append({
                "course_id": assignment[0],
                "course_name": assignment[1]
            })
        
        return assignment_list
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/update-student-courses")
async def update_student_courses(
    student_id: int = Form(...), 
    course_ids: str = Form(...), 
    current_user: tuple = Depends(get_current_user)
):
    try:
        if not current_user[5]:  # Not admin
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Parse course IDs from JSON string
        import json
        selected_course_ids = json.loads(course_ids)
        
        conn = get_db()
        
        # Remove all existing assignments for this student
        conn.execute("DELETE FROM student_courses WHERE student_id = ?", (student_id,))
        
        # Add new assignments
        for course_id in selected_course_ids:
            # Get next ID
            max_id = conn.execute("SELECT COALESCE(MAX(id), 0) FROM student_courses").fetchone()[0]
            next_id = max_id + 1
            conn.execute("""
                INSERT INTO student_courses (id, student_id, course_id) VALUES (?, ?, ?)
            """, (next_id, student_id, course_id))
        
        return {"message": f"Course assignments updated successfully. {len(selected_course_ids)} courses assigned."}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

class RemoveStudentRequest(BaseModel):
    student_id: int

@app.post("/api/remove-student")
async def remove_student(request: RemoveStudentRequest, current_user: tuple = Depends(get_current_user)):
    try:
        if not current_user[5]:  # Not admin
            raise HTTPException(status_code=403, detail="Admin access required")
        
        student_id = request.student_id
        conn = get_db()
        
        # Check if student exists and is not an admin
        student = conn.execute("""
            SELECT id, first_name, last_name, email, password_hash, is_admin 
            FROM users 
            WHERE id = ? AND is_admin = FALSE
        """, (student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found or cannot remove admin users")
        
        # Remove all related data in correct order (due to foreign key constraints)
        # 1. Remove course materials uploaded by this student (if any)
        # Note: We don't have a direct link, but this is for completeness
        
        # 2. Remove time tracking records
        conn.execute("DELETE FROM time_tracking WHERE student_id = ?", (student_id,))
        
        # 3. Remove course assignments
        conn.execute("DELETE FROM student_courses WHERE student_id = ?", (student_id,))
        
        # 4. Remove the user account
        conn.execute("DELETE FROM users WHERE id = ?", (student_id,))
        
        
        return {"message": "Student and all associated data removed successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions (like 403, 404)
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

# Vercel handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
