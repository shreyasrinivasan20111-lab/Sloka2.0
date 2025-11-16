#!/bin/bash

# Test script for Sai Kalpataru Vidyalaya
# This script tests the main functionality of the application

echo "🧪 Testing Sai Kalpataru Vidyalaya Student Course Management System"
echo ""

BASE_URL="http://localhost:8000"

# Check if server is running
echo "📡 Checking if server is running..."
if curl -s -f "$BASE_URL" > /dev/null; then
    echo "✅ Server is running at $BASE_URL"
else
    echo "❌ Server is not running. Please start with: python main.py"
    exit 1
fi

echo ""
echo "🏠 Testing Home Page..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/"

echo ""
echo "📝 Testing Registration Page..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/signup"

echo ""
echo "🔐 Testing Login Page..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/login"

echo ""
echo "📊 Testing Dashboard Page..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/dashboard"

echo ""
echo "👑 Testing Admin Page..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/admin"

echo ""
echo "📚 Testing API Endpoints..."

# Test course API (should require auth)
echo "Testing /api/courses..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/api/courses"

echo ""
echo "🎯 Testing Registration API..."
curl -s -X POST "$BASE_URL/api/register" \
     -H "Content-Type: application/json" \
     -d '{
         "first_name": "Test",
         "last_name": "Student", 
         "email": "test@example.com",
         "password": "testpass123"
     }' \
     -w "Status: %{http_code}\n"

echo ""
echo "🔓 Testing Login API with Admin Credentials..."
curl -s -X POST "$BASE_URL/api/login" \
     -H "Content-Type: application/json" \
     -d '{
         "email": "shreya.srinivasan2011@gmail.com",
         "password": "Bo142315"
     }' \
     -w "Status: %{http_code}\n"

echo ""
echo "✅ Basic functionality tests completed!"
echo ""
echo "📋 Manual Testing Checklist:"
echo "   □ Open http://localhost:8000 in browser"
echo "   □ Test student registration with new email"
echo "   □ Test admin login with provided credentials"
echo "   □ Test course assignment from admin panel"
echo "   □ Test timer functionality in course pages"
echo "   □ Test file upload for course materials"
echo "   □ Test responsive design on mobile device"
echo ""
echo "🎨 Visual Elements to Verify:"
echo "   □ Limelight font for titles"
echo "   □ Nova Round font for body text"
echo "   □ Vertical stripe background pattern"
echo "   □ Color scheme: #C5A098 and #B8927E stripes"
echo "   □ Text color: #704f3b"
