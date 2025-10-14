const http = require('http');
const https = require('https');

// Configuration from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'https://codejoin-backend.onrender.com';
const API_KEY = process.env.BACKEND_API_KEY || 'test123';

function checkBackendHealth() {
  console.log('Checking backend connection...');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log('');

  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}/health`);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Backend is running!');
          console.log('Response:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log('❌ Backend responded but with invalid JSON');
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Cannot connect to backend');
      console.log('Error:', error.message);
      console.log('');
      console.log('Possible solutions:');
      console.log('1. Make sure your backend server is running on port 3001');
      console.log('2. Check if the backend URL in your .env.local is correct');
      console.log('3. Verify the API key matches your backend configuration');
      console.log('4. Check if there are any firewall issues');
      reject(error);
    });

    req.on('timeout', () => {
      console.log('❌ Connection timeout - backend is not responding');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

function checkCodeExecution() {
  console.log('\nChecking code execution service...');
  
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}/api/languages`);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Code execution service is available!');
          if (result.languages && result.languages.length > 0) {
            console.log(`Supported languages: ${result.languages.map(l => l.name || l.id).join(', ')}`);
          }
          resolve(result);
        } catch (error) {
          console.log('❌ Code execution service responded but with invalid JSON');
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Cannot connect to code execution service');
      console.log('Error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('❌ Connection timeout - code execution service is not responding');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 CodeJoin Backend Connection Checker');
  console.log('=====================================\n');

  try {
    await checkBackendHealth();
    await checkCodeExecution();
    console.log('\n✅ All checks passed! Your backend is properly configured.');
  } catch (error) {
    console.log('\n❌ Some checks failed. Please see the errors above.');
    process.exit(1);
  }
}

main();