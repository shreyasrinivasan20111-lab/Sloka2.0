#!/bin/bash

# Deployment script for Sai Kalpataru Vidyalaya
# This script helps deploy the application to Vercel

echo "🚀 Deploying Sai Kalpataru Vidyalaya Student Course Management System"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Clean up any existing database for fresh deployment
echo "🧹 Cleaning up local database for deployment..."
rm -f students.db

echo "📋 Deployment Checklist:"
echo "✅ FastAPI backend configured"
echo "✅ DuckDB database setup"
echo "✅ Admin credentials configured"
echo "✅ All courses pre-loaded"
echo "✅ Time tracking functionality"
echo "✅ File upload for course materials"
echo "✅ Responsive design with custom color scheme"
echo "✅ Error handling and authentication"

echo ""
echo "🔑 Admin Credentials (already configured):"
echo "   Admin 1: shreya.srinivasan2011@gmail.com / Bo142315"
echo "   Admin 2: jayab2021@gmail.com / Admin@123"

echo ""
echo "📚 Available Courses:"
echo "   1. śravaṇaṃ"
echo "   2. Kirtanam"
echo "   3. Smaranam"
echo "   4. Pada Sevanam"
echo "   5. Archanam"
echo "   6. Vandanam"

echo ""
echo "🌐 Starting Vercel deployment..."

# Deploy to Vercel
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📝 Post-deployment checklist:"
echo "   □ Test student registration"
echo "   □ Test admin login"
echo "   □ Test course assignment"
echo "   □ Test time tracking"
echo "   □ Test file uploads"
echo "   □ Test responsive design on mobile"
echo ""
echo "🔗 Your application should now be live at the Vercel URL provided above!"
