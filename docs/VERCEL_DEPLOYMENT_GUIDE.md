# Vercel Deployment Guide for CodeJoin Frontend

## Overview

This guide explains how to deploy the CodeJoin frontend to Vercel with proper configuration for connecting to backend and socket services hosted on Render.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your frontend code should be pushed to GitHub
3. **Backend Services**: Your backend and socket services should be deployed on Render
4. **Environment Variables**: Collect all required environment variables

## Environment Variables Configuration

### Required Environment Variables

You'll need to configure these environment variables in your Vercel project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Services (Render URLs)
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.onrender.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-vercel-app-url.vercel.app
NODE_ENV=production

# Optional: AI Service API Keys (if you use AI features)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENROUTER_API_KEY=sk_or_...
GOOGLE_API_KEY=AIza...
OPENAI_API_KEY=sk-proj-...
```

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables"
4. Add each variable with its value
5. Make sure to select the appropriate environments (Production, Preview, Development)

## Deployment Steps

### Option 1: Using Vercel CLI

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy from your project root:

```bash
vercel --prod
```

### Option 2: Using GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on push to main branch

### Option 3: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure build settings and environment variables
5. Click "Deploy"

## Configuration Files

### vercel.json

Your project includes a pre-configured `vercel.json` file that handles:

- Environment variables
- API rewrites for socket connections
- CORS headers
- Build configuration

### next.config.ts

The Next.js configuration is optimized for Vercel deployment with:

- Proper webpack configuration for Monaco Editor
- Static asset optimization
- Security headers

## Post-Deployment Checklist

After deployment, verify:

1. **Environment Variables**: All environment variables are correctly set
2. **API Connections**: Test backend API connectivity
3. **Socket.IO**: Test real-time features
4. **Supabase**: Test authentication and database connections
5. **Static Assets**: Ensure all static files are loading correctly

## Testing Your Deployment

### 1. Health Check

Visit `https://your-app-url.vercel.app` and check:

- Page loads without errors
- Console shows no critical errors
- All static assets load properly

### 2. API Connectivity Test

Open browser console and test:

```javascript
fetch("/api/health")
  .then((r) => r.json())
  .then(console.log);
```

### 3. Socket.IO Connection Test

Test real-time features like:

- Collaborative editing
- Terminal sessions
- Chat functionality

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: Browser shows CORS errors when connecting to backend
**Solution**:

- Ensure backend CORS settings include your Vercel URL
- Check that `NEXT_PUBLIC_SITE_URL` is set correctly

#### 2. Socket.IO Connection Issues

**Problem**: Real-time features not working
**Solution**:

- Verify `NEXT_PUBLIC_SOCKET_URL` is correct
- Check socket server CORS configuration
- Ensure socket server is running on Render

#### 3. Environment Variables Not Working

**Problem**: App using default values instead of environment variables
**Solution**:

- Redeploy after changing environment variables
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Check Vercel dashboard for correct variable names

#### 4. Build Failures

**Problem**: Deployment fails during build
**Solution**:

- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript errors are resolved

### Debug Commands

Add these to your browser console for debugging:

```javascript
// Check environment variables
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
console.log("Socket URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
console.log("Site URL:", process.env.NEXT_PUBLIC_SITE_URL);

// Test API connection
fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);

// Test Socket.IO connection
import { io } from "socket.io-client";
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
socket.on("connect", () => console.log("Socket connected!"));
```

## Performance Optimization

### 1. Enable Edge Functions

For API routes, consider using Edge Functions for better performance:

```javascript
// app/api/edge-example/route.ts
export const runtime = "edge";
```

### 2. Optimize Images

Ensure all images use Next.js Image component with proper sizing.

### 3. Enable Analytics

Consider adding Vercel Analytics for performance monitoring.

## Security Considerations

1. **API Keys**: Never expose secret API keys on the client-side
2. **CORS**: Configure proper CORS settings on backend services
3. **HTTPS**: Vercel automatically provides HTTPS
4. **Environment Variables**: Use Vercel's encrypted environment variables

## Monitoring and Maintenance

1. **Vercel Analytics**: Monitor performance and usage
2. **Logs**: Check Vercel function logs for errors
3. **Uptime**: Set up monitoring for your deployed application
4. **Updates**: Regularly update dependencies and redeploy

## Rollback Procedures

If you need to rollback:

1. Go to Vercel dashboard
2. Find your deployment
3. Click "..." menu
4. Select "Promote to Production" for a previous deployment

## Support

For issues:

- Check [Vercel documentation](https://vercel.com/docs)
- Review deployment logs
- Check this guide's troubleshooting section
- Ensure backend services are running properly on Render

---

**Last updated**: October 2024
**Version**: 1.0.0
