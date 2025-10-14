#!/bin/bash

# CodeJoin Frontend Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 Starting CodeJoin Frontend Deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Build the project first to ensure everything works
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Verify environment variables in Vercel dashboard"
echo "2. Test API connectivity to backend services"
echo "3. Test Socket.IO real-time features"
echo "4. Test authentication with Supabase"
echo "5. Check all static assets are loading correctly"
echo ""
echo "🔗 Your app should be available at: https://your-app-url.vercel.app"
echo ""
echo "📖 For detailed deployment guide, see: docs/VERCEL_DEPLOYMENT_GUIDE.md"