// Main application JavaScript - Version 2.1
$(document).ready(function() {
    console.log('App.js Version 2.1 loaded');
    // Initialize the application
    initApp();
});

// Global variables
let currentUser = null;
let authToken = null;
let timers = {};

// Global flag to prevent multiple initializations
let appInitialized = false;

// Initialize application
function initApp() {
    // Prevent multiple initializations
    if (appInitialized) {
        console.warn('App already initialized, skipping...');
        return;
    }
    
    appInitialized = true;
    console.log('Initializing application...');
    
    try {
        // Check for stored authentication
        authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (authToken && userData) {
            currentUser = JSON.parse(userData);
            updateUIForLoggedInUser();
        }
        
        // Bind event handlers
        bindEventHandlers();
        
        // Initialize page-specific functionality
        const page = getCurrentPage();
    switch(page) {
        case 'home':
            initHomePage();
            break;
        case 'login':
            initLoginPage();
            break;
        case 'signup':
            initSignupPage();
            break;
        case 'dashboard':
            initDashboard();
            break;
        case 'admin':
            initAdminDashboard();
            break;
        case 'course':
            initCoursePage();
            break;
    }
    } catch (error) {
        console.error('Error initializing app:', error);
        appInitialized = false; // Reset flag if initialization fails
        throw error; // Re-throw to be caught by global error handler
    }
}

// Get current page
function getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('/login')) return 'login';
    if (path.includes('/signup')) return 'signup';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/course/')) return 'course';
    return 'unknown';
}

// Bind global event handlers
function bindEventHandlers() {
    // Hamburger menu
    $(document).on('click', '.hamburger-btn', function(e) {
        e.stopPropagation();
        $('.dropdown-menu').toggleClass('show');
    });
    
    // Close dropdown when clicking outside
    $(document).on('click', function() {
        $('.dropdown-menu').removeClass('show');
    });
    
    // Prevent dropdown from closing when clicking inside
    $(document).on('click', '.dropdown-menu', function(e) {
        e.stopPropagation();
    });
    
    // Logout functionality
    $(document).on('click', '.logout-btn', function() {
        logout();
    });
    
    // Navigation guards
    $(document).on('click', 'a[href*="/dashboard"], a[href*="/admin"], a[href*="/course/"]', function(e) {
        if (!authToken) {
            e.preventDefault();
            showAlert('Please log in to access this page.', 'error');
            window.location.href = '/login';
        }
    });
}

// Authentication functions
function login(email, password) {
    return makeAPICall('/api/login', 'POST', {
        email: email,
        password: password
    }).then(response => {
        if (response.access_token) {
            authToken = response.access_token;
            currentUser = response.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            
            // Hide loading before redirect
            hideLoading();
            
            // Small delay to ensure loading is hidden before redirect
            setTimeout(() => {
                // Redirect based on user type
                if (currentUser.is_admin) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/dashboard';
                }
            }, 100);
            
            return response;
        } else {
            throw new Error('Login failed');
        }
    });
}

function register(userData) {
    return makeAPICall('/api/register', 'POST', userData).then(response => {
        hideLoading(); // Hide loading on success
        showAlert('Registration successful! Please log in.', 'success');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return response;
    });
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    showAlert('Logged out successfully', 'success');
    window.location.href = '/';
}

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    if (currentUser) {
        $('.auth-buttons').html(`
            <span class="user-name">Welcome, ${currentUser.first_name}!</span>
            <button class="btn btn-secondary logout-btn">Logout</button>
        `);
        
        // Show/hide admin-only elements
        if (currentUser.is_admin) {
            $('.admin-only').show();
        } else {
            $('.admin-only').hide();
        }
    }
}

// API call wrapper
function makeAPICall(url, method = 'GET', data = null) {
    const options = {
        url: url,
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (data && method !== 'GET') {
        options.data = JSON.stringify(data);
    }
    
    return $.ajax(options).catch(error => {
        console.error('API Error:', error);
        
        if (error.status === 401) {
            // Token expired or invalid
            logout();
            throw new Error('Session expired. Please log in again.');
        }
        
        let errorMessage = 'An error occurred';
        if (error.responseJSON && error.responseJSON.detail) {
            errorMessage = error.responseJSON.detail;
        } else if (error.responseText) {
            try {
                const errorData = JSON.parse(error.responseText);
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
                errorMessage = error.responseText;
            }
        }
        
        throw new Error(errorMessage);
    });
}

// File upload wrapper
function makeFileUpload(url, formData) {
    return $.ajax({
        url: url,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).catch(error => {
        console.error('Upload Error:', error);
        let errorMessage = 'Upload failed';
        if (error.responseJSON && error.responseJSON.detail) {
            errorMessage = error.responseJSON.detail;
        }
        throw new Error(errorMessage);
    });
}

// Alert system
function showAlert(message, type = 'info') {
    const alertClass = `alert-${type}`;
    const alertHtml = `
        <div class="alert ${alertClass}">
            ${message}
            <button type="button" class="close-alert" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
        </div>
    `;
    
    $('#alerts').html(alertHtml);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        $('.alert').fadeOut();
    }, 5000);
    
    // Close button functionality
    $('.close-alert').click(function() {
        $(this).parent().fadeOut();
    });
}

// Loading state management
function showLoading(element = 'body') {
    $(element).append('<div class="loading-overlay"><div class="spinner"></div><div>Loading...</div></div>');
}

function hideLoading() {
    $('.loading-overlay').remove();
}

// Home page initialization
function initHomePage() {
    // Any home page specific initialization
    console.log('Home page initialized');
}

// Login page initialization
function initLoginPage() {
    console.log('Initializing login page - Version 2.1');
    
    // Remove any existing event handlers to prevent duplicates
    $('#loginForm').off('submit');
    
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        console.log('Login form submitted - Version 2.1');
        
        const userEmail = $('#email').val();
        const userPassword = $('#password').val();
        
        if (!userEmail || !userPassword) {
            showAlert('Please fill in all fields', 'error');
            return;
        }
        
        showLoading('#loginForm');
        
        // Use promise-style handling without .finally()
        const loginPromise = login(userEmail, userPassword);
        
        loginPromise
            .then(response => {
                console.log('Login successful in form handler');
                // Success is handled in the login function itself
            })
            .catch(error => {
                console.log('Login error in form handler:', error);
                hideLoading(); // Hide loading on error
                showAlert(error.message, 'error');
            });
    });
}

// Signup page initialization
function initSignupPage() {
    $('#signupForm').on('submit', function(e) {
        e.preventDefault();
        
        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const email = $('#email').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();
        
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showAlert('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long', 'error');
            return;
        }
        
        showLoading('#signupForm');
        
        register({
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password
        }).catch(error => {
            hideLoading(); // Hide loading on error
            showAlert(error.message, 'error');
        });
    });
}

// Dashboard initialization (Student)
function initDashboard() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    loadStudentCourses();
    loadStudentTimeStats();
}

// Load student courses
function loadStudentCourses() {
    makeAPICall('/api/courses').then(courses => {
        const coursesList = $('#coursesList');
        
        if (courses.length === 0) {
            coursesList.html('<div class="alert alert-info">No courses assigned yet. Please contact your administrator.</div>');
            return;
        }
        
        let coursesHtml = '<div class="row">';
        courses.forEach(course => {
            coursesHtml += `
                <div class="col-3">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">${course.name}</h3>
                        </div>
                        <p>${course.description}</p>
                        <a href="/course/${course.id}" class="btn btn-primary">Enter Class</a>
                    </div>
                </div>
            `;
        });
        coursesHtml += '</div>';
        
        coursesList.html(coursesHtml);
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Load student time statistics
function loadStudentTimeStats() {
    if (!currentUser) return;
    
    makeAPICall(`/api/time-stats/${currentUser.id}`).then(stats => {
        const statsContainer = $('#timeStats');
        
        if (stats.length === 0) {
            statsContainer.html('<div class="alert alert-info">No time tracked yet.</div>');
            return;
        }
        
        let statsHtml = '<h3>Your Time Statistics</h3><div class="table-responsive"><table class="table"><thead><tr><th>Course</th><th>Total Time</th><th>Sessions</th></tr></thead><tbody>';
        
        stats.forEach(stat => {
            const hours = Math.floor(stat.total_time / 3600);
            const minutes = Math.floor((stat.total_time % 3600) / 60);
            statsHtml += `
                <tr>
                    <td>${stat.course_name}</td>
                    <td>${hours}h ${minutes}m</td>
                    <td>${stat.sessions}</td>
                </tr>
            `;
        });
        
        statsHtml += '</tbody></table></div>';
        statsContainer.html(statsHtml);
    }).catch(error => {
        console.error('Error loading time stats:', error);
    });
}

// Admin dashboard initialization
function initAdminDashboard() {
    if (!authToken || !currentUser || !currentUser.is_admin) {
        window.location.href = '/login';
        return;
    }
    
    loadAllCourses();
    loadAllStudents();
    loadAllTimeStats();
}

// Load all courses for admin
function loadAllCourses() {
    makeAPICall('/api/courses').then(courses => {
        const coursesList = $('#adminCoursesList');
        
        let coursesHtml = '<h3>All Courses</h3><div class="row">';
        courses.forEach(course => {
            coursesHtml += `
                <div class="col-4">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">${course.name}</h4>
                        </div>
                        <p>${course.description}</p>
                        <a href="/course/${course.id}" class="btn btn-primary">Manage Course</a>
                    </div>
                </div>
            `;
        });
        coursesHtml += '</div>';
        
        coursesList.html(coursesHtml);
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Load all students for admin
function loadAllStudents() {
    makeAPICall('/api/students').then(students => {
        const studentsList = $('#studentsList');
        
        let studentsHtml = '<h3>Student Management</h3>';
        
        if (students.length === 0) {
            studentsHtml += '<div class="alert alert-info">No students registered yet.</div>';
        } else {
            studentsHtml += '<div class="table-responsive"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Assigned Courses</th><th>Total Practice Time</th><th>Actions</th></tr></thead><tbody>';
            
            students.forEach(student => {
                const assignedCourses = student.assigned_courses ? student.assigned_courses.split(',') : [];
                const coursesList = assignedCourses.length > 0 ? 
                    assignedCourses.map(course => `<span class="course-tag">${course.trim()}</span>`).join(' ') : 
                    '<span class="text-muted">None assigned</span>';
                
                // Format total time
                const totalMinutes = Math.floor((student.total_practice_time || 0) / 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const timeDisplay = `${hours}h ${minutes}m`;
                
                studentsHtml += `
                    <tr>
                        <td><strong>${student.first_name} ${student.last_name}</strong></td>
                        <td>${student.email}</td>
                        <td class="assigned-courses">${coursesList}</td>
                        <td><span class="time-badge">${timeDisplay}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm assign-course-btn" data-student-id="${student.id}" 
                                    data-student-name="${student.first_name} ${student.last_name}">Manage Courses</button>
                            <button class="btn btn-secondary btn-sm view-stats-btn" data-student-id="${student.id}"
                                    data-student-name="${student.first_name} ${student.last_name}">Detailed Stats</button>
                            <button class="btn btn-danger btn-sm remove-student-btn" data-student-id="${student.id}"
                                    data-student-name="${student.first_name} ${student.last_name}">Remove Student</button>
                        </td>
                    </tr>
                `;
            });
            
            studentsHtml += '</tbody></table></div>';
        }
        
        studentsList.html(studentsHtml);
        
        // Bind course assignment functionality
        $('.assign-course-btn').click(function() {
            const studentId = $(this).data('student-id');
            const studentName = $(this).data('student-name');
            showCourseManagementModal(studentId, studentName);
        });
        
        // Bind view stats functionality
        $('.view-stats-btn').click(function() {
            const studentId = $(this).data('student-id');
            const studentName = $(this).data('student-name');
            showStudentStatsModal(studentId, studentName);
        });
        
        // Bind remove student functionality
        $('.remove-student-btn').click(function() {
            const studentId = $(this).data('student-id');
            const studentName = $(this).data('student-name');
            showRemoveStudentModal(studentId, studentName);
        });
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Show course management modal (replaces showCourseAssignmentModal)
function showCourseManagementModal(studentId, studentName) {
    Promise.all([
        makeAPICall('/api/courses'),
        makeAPICall(`/api/student-assignments/${studentId}`)
    ]).then(([courses, assignments]) => {
        const assignedCourseIds = assignments.map(a => a.course_id);
        
        let modalHtml = `
            <div class="modal-overlay">
                <div class="card" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; min-width: 500px; max-height: 80vh; overflow-y: auto;">
                    <div class="card-header">
                        <h3>Manage Courses for ${studentName}</h3>
                        <button class="close-modal" style="float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <div class="p-3">
                        <h4>Available Courses</h4>
                        <p class="text-muted">Check the courses you want to assign to this student:</p>
                        <form id="courseManagementForm">
        `;
        
        courses.forEach(course => {
            const isAssigned = assignedCourseIds.includes(course.id);
            modalHtml += `
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="courses" value="${course.id}" ${isAssigned ? 'checked' : ''}>
                        <strong>${course.name}</strong> - ${course.description}
                    </label>
                </div>
            `;
        });
        
        modalHtml += `
                            <div class="mt-3">
                                <button type="submit" class="btn btn-primary">Update Course Assignments</button>
                                <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        // Handle form submission
        $('#courseManagementForm').on('submit', function(e) {
            e.preventDefault();
            
            const selectedCourses = [];
            $('input[name="courses"]:checked').each(function() {
                selectedCourses.push(parseInt($(this).val()));
            });
            
            const formData = new FormData();
            formData.append('student_id', studentId);
            formData.append('course_ids', JSON.stringify(selectedCourses));
            
            makeFileUpload('/api/update-student-courses', formData)
                .then(() => {
                    showAlert('Course assignments updated successfully', 'success');
                    $('.modal-overlay').remove();
                    loadAllStudents(); // Refresh the students list
                })
                .catch(error => {
                    showAlert(error.message, 'error');
                });
        });
        
        // Handle modal close
        $('.close-modal').click(function() {
            $('.modal-overlay').remove();
        });
        
        // Close modal when clicking overlay
        $('.modal-overlay').click(function(e) {
            if (e.target === this) {
                $(this).remove();
            }
        });
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Show student stats modal
function showStudentStatsModal(studentId, studentName) {
    makeAPICall(`/api/time-stats/${studentId}`).then(stats => {
        let totalTime = 0;
        let totalSessions = 0;
        
        let modalHtml = `
            <div class="modal-overlay">
                <div class="card" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; min-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <div class="card-header">
                        <h3>Practice Statistics - ${studentName}</h3>
                        <button class="close-modal" style="float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <div class="p-3">
        `;
        
        if (stats.length === 0) {
            modalHtml += '<div class="alert alert-info">No practice time recorded for this student yet.</div>';
        } else {
            // Calculate totals
            stats.forEach(stat => {
                totalTime += stat.total_time || 0;
                totalSessions += stat.sessions || 0;
            });
            
            const totalHours = Math.floor(totalTime / 3600);
            const totalMinutes = Math.floor((totalTime % 3600) / 60);
            
            modalHtml += `
                <div class="row mb-3">
                    <div class="col-2">
                        <div class="stats-card text-center p-3" style="background: var(--primary-color); border-radius: 10px;">
                            <h4>${totalHours}h ${totalMinutes}m</h4>
                            <p>Total Practice Time</p>
                        </div>
                    </div>
                    <div class="col-2">
                        <div class="stats-card text-center p-3" style="background: var(--primary-dark); border-radius: 10px; color: white;">
                            <h4>${totalSessions}</h4>
                            <p>Total Sessions</p>
                        </div>
                    </div>
                </div>
                
                <h4>Course Breakdown</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Practice Time</th>
                            <th>Sessions</th>
                            <th>Avg. Session</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            stats.forEach(stat => {
                const hours = Math.floor(stat.total_time / 3600);
                const minutes = Math.floor((stat.total_time % 3600) / 60);
                const avgSessionTime = stat.sessions > 0 ? Math.floor(stat.total_time / stat.sessions / 60) : 0;
                const progressPercentage = Math.min((stat.total_time / 3600) * 20, 100); // Assume 5 hours = 100%
                
                modalHtml += `
                    <tr>
                        <td><strong>${stat.course_name}</strong></td>
                        <td>${hours}h ${minutes}m</td>
                        <td>${stat.sessions}</td>
                        <td>${avgSessionTime}m</td>
                        <td>
                            <div class="progress-bar" style="background: #e0e0e0; border-radius: 10px; height: 10px;">
                                <div style="background: var(--primary-color); height: 100%; width: ${progressPercentage}%; border-radius: 10px;"></div>
                            </div>
                            <small>${Math.round(progressPercentage)}%</small>
                        </td>
                    </tr>
                `;
            });
            
            modalHtml += '</tbody></table>';
        }
        
        modalHtml += `
                    </div>
                    <div class="p-3 text-center">
                        <button class="btn btn-secondary close-modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        // Handle modal close
        $('.close-modal').click(function() {
            $('.modal-overlay').remove();
        });
        
        // Close modal when clicking overlay
        $('.modal-overlay').click(function(e) {
            if (e.target === this) {
                $(this).remove();
            }
        });
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Show remove student confirmation modal
function showRemoveStudentModal(studentId, studentName) {
    let modalHtml = `
        <div class="modal-overlay">
            <div class="card" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; min-width: 400px;">
                <div class="card-header">
                    <h3>⚠️ Remove Student</h3>
                    <button class="close-modal" style="float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div class="p-3">
                    <div class="alert alert-error">
                        <strong>Warning:</strong> This action cannot be undone!
                    </div>
                    <p>Are you sure you want to remove <strong>${studentName}</strong> from the system?</p>
                    <p class="text-muted">This will permanently delete:</p>
                    <ul class="text-muted">
                        <li>Student account and profile</li>
                        <li>All course assignments</li>
                        <li>All practice time records</li>
                        <li>All associated data</li>
                    </ul>
                    <div class="mt-4">
                        <button class="btn btn-danger confirm-remove-btn" data-student-id="${studentId}">
                            Yes, Remove Student Permanently
                        </button>
                        <button class="btn btn-secondary close-modal ml-2">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('body').append(modalHtml);
    
    // Handle confirmation
    $('.confirm-remove-btn').click(function() {
        const studentId = $(this).data('student-id');
        removeStudent(studentId);
    });
    
    // Handle modal close
    $('.close-modal').click(function() {
        $('.modal-overlay').remove();
    });
    
    // Close modal when clicking overlay
    $('.modal-overlay').click(function(e) {
        if (e.target === this) {
            $(this).remove();
        }
    });
}

// Remove student from system
function removeStudent(studentId) {
    // Show immediate feedback
    const confirmBtn = $('.confirm-remove-btn');
    const originalText = confirmBtn.text();
    confirmBtn.text('Removing...').prop('disabled', true);
    
    $.ajax({
        url: '/api/remove-student',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            student_id: studentId
        }),
        timeout: 5000 // 5 second timeout for quick response
    })
    .done((response) => {
        showAlert('Student removed successfully', 'success');
        $('.modal-overlay').remove();
        loadAllStudents(); // Refresh the students list
    })
    .fail((xhr) => {
        let errorMessage = 'Failed to remove student';
        if (xhr.responseJSON && xhr.responseJSON.detail) {
            errorMessage = xhr.responseJSON.detail;
        } else if (xhr.statusText === 'timeout') {
            errorMessage = 'Request timed out. Please try again.';
        }
        showAlert(errorMessage, 'error');
        // Restore button state on error
        confirmBtn.text(originalText).prop('disabled', false);
    });
}

// Load all time statistics for admin
function loadAllTimeStats() {
    // This could be implemented to show overall statistics
    console.log('Loading all time stats...');
}

// Course page initialization
function initCoursePage() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    const courseId = getCurrentCourseId();
    if (!courseId) {
        window.location.href = '/dashboard';
        return;
    }
    
    loadCourseMaterials(courseId);
    initTimer(courseId);
    
    // Initialize file upload for admin
    if (currentUser && currentUser.is_admin) {
        initFileUpload(courseId);
    }
}

// Get current course ID from URL
function getCurrentCourseId() {
    const path = window.location.pathname;
    const match = path.match(/\/course\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Load course materials
function loadCourseMaterials(courseId) {
    makeAPICall(`/api/course-materials/${courseId}`).then(materials => {
        const lyricsContainer = $('#lyrics-materials');
        const recordingsContainer = $('#recordings-materials');
        
        const lyrics = materials.filter(m => m.material_type === 'lyrics');
        const recordings = materials.filter(m => m.material_type === 'recordings');
        
        // Display lyrics
        let lyricsHtml = '<h4>Lyrics</h4>';
        if (lyrics.length === 0) {
            lyricsHtml += '<p class="text-muted">No lyrics available yet.</p>';
        } else {
            lyricsHtml += '<div class="material-list">';
            lyrics.forEach(material => {
                lyricsHtml += `
                    <div class="material-item">
                        <span>${material.filename}</span>
                        <button class="btn btn-primary btn-sm download-material" data-material-id="${material.id}">Download</button>
                    </div>
                `;
            });
            lyricsHtml += '</div>';
        }
        lyricsContainer.html(lyricsHtml);
        
        // Display recordings
        let recordingsHtml = '<h4>Recordings</h4>';
        if (recordings.length === 0) {
            recordingsHtml += '<p class="text-muted">No recordings available yet.</p>';
        } else {
            recordingsHtml += '<div class="material-list">';
            recordings.forEach(material => {
                recordingsHtml += `
                    <div class="material-item">
                        <span>${material.filename}</span>
                        <button class="btn btn-primary btn-sm download-material" data-material-id="${material.id}">Download</button>
                    </div>
                `;
            });
            recordingsHtml += '</div>';
        }
        recordingsContainer.html(recordingsHtml);
        
        // Bind download functionality (using event delegation to prevent multiple bindings)
        $(document).off('click', '.download-material').on('click', '.download-material', function() {
            const materialId = $(this).data('material-id');
            downloadMaterial(materialId);
        });
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Download material
function downloadMaterial(materialId) {
    makeAPICall(`/api/download-material/${materialId}`).then(response => {
        // Convert base64 to blob and download
        const byteCharacters = atob(response.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray]);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }).catch(error => {
        showAlert(error.message, 'error');
    });
}

// Initialize file upload for admin
function initFileUpload(courseId) {
    // Remove any existing event handlers to prevent stacking
    $('#lyrics-upload').off('click');
    $('#lyrics-file-input').off('change');
    $('#recordings-upload').off('click');
    $('#recordings-file-input').off('change');
    
    // Lyrics upload
    $('#lyrics-upload').on('click', function() {
        $('#lyrics-file-input').click();
    });
    
    $('#lyrics-file-input').on('change', function() {
        const file = this.files[0];
        if (file) {
            uploadMaterial(courseId, 'lyrics', file);
            // Clear the input so the same file can be uploaded again if needed
            $(this).val('');
        }
    });
    
    // Recordings upload
    $('#recordings-upload').on('click', function() {
        $('#recordings-file-input').click();
    });
    
    $('#recordings-file-input').on('change', function() {
        const file = this.files[0];
        if (file) {
            uploadMaterial(courseId, 'recordings', file);
            // Clear the input so the same file can be uploaded again if needed
            $(this).val('');
        }
    });
}

// Upload material
function uploadMaterial(courseId, materialType, file) {
    // Validate file
    if (!file) {
        showAlert('Please select a file to upload', 'error');
        return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('File size must be less than 10MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('material_type', materialType);
    formData.append('file', file);
    
    showLoading();
    
    makeFileUpload(`/api/upload-material/${courseId}`, formData)
        .then(() => {
            hideLoading(); // Hide loading on success
            showAlert('Material uploaded successfully', 'success');
            // Add a small delay to prevent rapid successive calls
            setTimeout(() => {
                loadCourseMaterials(courseId); // Refresh materials
            }, 100);
        })
        .catch(error => {
            hideLoading(); // Hide loading on error
            console.error('Upload error:', error);
            showAlert(error.message || 'Failed to upload material', 'error');
        });
}

// Timer functionality
function initTimer(courseId) {
    const timerDisplay = $('#timer-display');
    const startBtn = $('#start-timer');
    const stopBtn = $('#stop-timer');
    const restartBtn = $('#restart-timer');
    
    let startTime = null;
    let elapsedTime = 0;
    let timerInterval = null;
    
    // Initialize timer display
    updateTimerDisplay(0);
    
    // Start timer
    startBtn.click(function() {
        if (!timerInterval) {
            startTime = new Date();
            timerInterval = setInterval(() => {
                const now = new Date();
                elapsedTime = Math.floor((now - startTime) / 1000);
                updateTimerDisplay(elapsedTime);
            }, 1000);
            
            $(this).prop('disabled', true);
            stopBtn.prop('disabled', false);
            restartBtn.prop('disabled', false);
        }
    });
    
    // Stop timer
    stopBtn.click(function() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            
            // Save time entry
            if (startTime && elapsedTime > 0) {
                const endTime = new Date();
                saveTimeEntry(courseId, startTime, endTime, elapsedTime);
            }
            
            startBtn.prop('disabled', false);
            $(this).prop('disabled', true);
        }
    });
    
    // Restart timer
    restartBtn.click(function() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        elapsedTime = 0;
        startTime = null;
        updateTimerDisplay(0);
        
        startBtn.prop('disabled', false);
        stopBtn.prop('disabled', true);
        $(this).prop('disabled', true);
    });
}

// Update timer display
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    $('#timer-display').text(display);
}

// Save time entry
function saveTimeEntry(courseId, startTime, endTime, duration) {
    const timeEntry = {
        course_id: courseId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: duration
    };
    
    makeAPICall('/api/time-tracking', 'POST', timeEntry)
        .then(() => {
            showAlert('Time tracked successfully', 'success');
        })
        .catch(error => {
            console.error('Error saving time entry:', error);
            showAlert('Failed to save time entry', 'error');
        });
}

// Global error tracking to prevent recursive error handling
let errorHandlerActive = false;

// Error handling
window.addEventListener('error', function(e) {
    // Prevent recursive error handling
    if (errorHandlerActive) {
        console.warn('Error handler already active, skipping to prevent recursion');
        return;
    }
    
    errorHandlerActive = true;
    
    try {
        console.error('JavaScript Error:', e.error);
        console.error('Error details:', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error ? e.error.stack : 'No stack trace available'
        });
        
        // Don't show alert for stack overflow errors or script errors to prevent more issues
        if (e.message && (e.message.includes('Maximum call stack size exceeded') || 
                         e.message === 'Script error.')) {
            console.error('Stack overflow or script error detected - not showing alert to prevent further issues');
            return;
        }
        
        // Only show alert if showAlert function exists and is safe to call
        if (typeof showAlert === 'function') {
            showAlert('An unexpected error occurred. Please refresh the page.', 'error');
        }
    } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
    } finally {
        // Reset flag after a delay to allow for proper error handling
        setTimeout(() => {
            errorHandlerActive = false;
        }, 1000);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    // Prevent recursive error handling
    if (errorHandlerActive) {
        console.warn('Error handler already active, skipping promise rejection to prevent recursion');
        return;
    }
    
    console.error('Unhandled Promise Rejection:', e.reason);
    
    // Only show alert if showAlert function exists
    if (typeof showAlert === 'function') {
        try {
            showAlert('An unexpected error occurred. Please try again.', 'error');
        } catch (alertError) {
            console.error('Error showing alert for promise rejection:', alertError);
        }
    }
    
    e.preventDefault(); // Prevent the default browser behavior
});

// Add loading overlay styles dynamically - moved to CSS file to prevent dynamic injection issues
