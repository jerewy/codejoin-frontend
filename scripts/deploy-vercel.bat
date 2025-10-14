@echo off
REM CodeJoin Frontend Vercel Deployment Script for Windows
REM This script automates the deployment process to Vercel

echo 🚀 Starting CodeJoin Frontend Deployment to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please login to Vercel:
    vercel login
)

REM Build the project first to ensure everything works
echo 🔨 Building project...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors before deploying.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod

echo 🎉 Deployment completed!
echo.
echo 📋 Post-deployment checklist:
echo 1. Verify environment variables in Vercel dashboard
echo 2. Test API connectivity to backend services
echo 3. Test Socket.IO real-time features
echo 4. Test authentication with Supabase
echo 5. Check all static assets are loading correctly
echo.
echo 🔗 Your app should be available at: https://your-app-url.vercel.app
echo.
echo 📖 For detailed deployment guide, see: docs/VERCEL_DEPLOYMENT_GUIDE.md
pause