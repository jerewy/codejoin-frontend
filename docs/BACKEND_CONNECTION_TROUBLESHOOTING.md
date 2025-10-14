# Backend Connection Troubleshooting Guide

This guide will help you diagnose and fix issues with your backend connection and code execution.

## Quick Diagnosis Steps

### 1. Check Backend Status

Run the backend checker script:

```bash
npm run check:backend
```

Or visit the connection status page in your app:

```
http://localhost:3000/debug/connection-status
```

### 2. Common Issues and Solutions

#### Issue: "Cannot connect to backend" or "Connection refused"

**Symptoms:**

- Code execution doesn't work
- Connection status shows "disconnected"
- Browser console shows network errors

**Possible Causes:**

1. Backend server is not running
2. Wrong backend URL configuration
3. Port is blocked or in use

**Solutions:**

1. **Start your backend server:**

   ```bash
   # Navigate to your backend directory
   cd code-execution-backend
   npm install
   npm run dev
   ```

2. **Check if the backend is running on the correct port:**

   ```bash
   # Check if port 3001 is in use
   netstat -an | grep 3001
   # or on Windows
   netstat -an | findstr 3001
   ```

3. **Verify your backend URL in .env.local:**
   ```
   AI_BACKEND_URL=http://localhost:3001
   ```

#### Issue: "API Key invalid" or "Unauthorized"

**Symptoms:**

- 401 Unauthorized errors
- Backend responds but with authentication errors

**Solutions:**

1. **Check your API key in .env.local:**

   ```
   AI_BACKEND_API_KEY=test123
   ```

2. **Ensure the backend is configured with the same API key**

#### Issue: "Code execution service unavailable"

**Symptoms:**

- Backend health check passes but code execution fails
- Languages endpoint returns error

**Solutions:**

1. **Check if the code execution service is enabled in your backend**
2. **Verify Docker is running (if using Docker for code execution)**
3. **Check backend logs for specific error messages**

### 3. Testing Your Connection

#### Method 1: Use the Connection Status Page

1. Start your frontend: `npm run dev`
2. Navigate to: `http://localhost:3000/debug/connection-status`
3. Check the status indicators

#### Method 2: Test API Endpoints Directly

```bash
# Test health endpoint
curl -H "X-API-Key: test123" http://localhost:3001/health

# Test code execution
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test123" \
  -d '{"language":"javascript","code":"console.log(\"Hello World\")"}' \
  http://localhost:3001/api/execute
```

#### Method 3: Use the Test Code Snippets Page

1. Navigate to: `http://localhost:3000/test-code-snippets`
2. Try executing a simple code snippet
3. Check browser console for errors

### 4. Environment Configuration

Make sure your `.env.local` file has the correct configuration:

```env
# Backend Configuration
AI_BACKEND_URL=http://localhost:3001
AI_BACKEND_API_KEY=test123

# Socket Configuration (if using Socket.IO)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 5. Port Configuration

If you need to change the default ports:

1. **Update your .env.local:**

   ```env
   AI_BACKEND_URL=http://localhost:YOUR_PORT
   ```

2. **Update lib/api-config.ts if needed:**
   ```typescript
   export const API_CONFIG = {
     BACKEND_URL: getEnvVar(
       "NEXT_PUBLIC_API_URL",
       "http://localhost:YOUR_PORT"
     ),
     // ...
   };
   ```

### 6. Docker Issues (if using Docker for code execution)

#### Check Docker Status

```bash
docker --version
docker info
```

#### Common Docker Issues

1. **Docker is not running**

   - Start Docker Desktop or Docker daemon
   - Check system tray for Docker status

2. **Permission issues**

   - On Linux: Add your user to the docker group
   - On Windows/Mac: Run Docker as administrator if needed

3. **Port conflicts**
   - Check if required ports are already in use
   - Stop conflicting containers

### 7. Browser Console Debugging

1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Try executing code
4. Look for error messages like:
   - `fetch failed` - Network connection issue
   - `CORS error` - Backend CORS configuration issue
   - `timeout` - Backend is not responding

### 8. Network Issues

#### Firewall/Antivirus

- Make sure your firewall isn't blocking port 3001
- Check antivirus software settings
- Try temporarily disabling security software to test

#### Proxy Settings

- If using a proxy, ensure it allows connections to localhost
- Check proxy configuration in your browser or system

### 9. Backend-Specific Issues

If your backend is running but still not working:

1. **Check backend logs:**

   ```bash
   # In your backend directory
   npm run dev
   # Look for error messages in the console
   ```

2. **Verify backend dependencies:**

   ```bash
   cd code-execution-backend
   npm install
   ```

3. **Check backend configuration:**
   - Verify API key configuration
   - Check CORS settings
   - Ensure all required services are running

### 10. Getting Help

If you're still having issues:

1. **Collect the following information:**

   - Backend connection status page output
   - Browser console errors
   - Backend server logs
   - Your .env.local configuration (without sensitive keys)

2. **Check the documentation:**

   - Backend setup guide
   - API documentation
   - Docker setup guide

3. **Create an issue with:**
   - Steps to reproduce
   - Expected vs actual behavior
   - All collected debugging information

## Quick Reference Commands

```bash
# Check backend connection
npm run check:backend

# Start frontend
npm run dev

# Start backend (in backend directory)
cd code-execution-backend
npm run dev

# Check port usage
netstat -an | grep 3001

# Test API endpoint
curl -H "X-API-Key: test123" http://localhost:3001/health
```

## Environment Variables Checklist

- [ ] `AI_BACKEND_URL` is set to the correct backend URL
- [ ] `AI_BACKEND_API_KEY` matches the backend configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set (if using Supabase)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set (if using Supabase)
- [ ] No typos in variable names
- [ ] No extra spaces or quotes around values
