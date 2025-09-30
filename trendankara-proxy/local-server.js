#!/usr/bin/env node

/**
 * Local Development Server for TrendAnkara Proxy
 * Uses Google Cloud Functions Framework for local testing
 */

const { getFunction } = require('@google-cloud/functions-framework');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

console.log(`${colors.cyan}==========================================${colors.reset}`);
console.log(`${colors.cyan}TrendAnkara Proxy - Local Development${colors.reset}`);
console.log(`${colors.cyan}==========================================${colors.reset}`);
console.log('');

// Import the function (this will register it with the framework)
require('./index.js');

// Get the registered function
const proxyHandler = getFunction('proxyHandler');

if (!proxyHandler) {
  console.error(`${colors.red}Error: Could not find function 'proxyHandler'${colors.reset}`);
  console.error(`${colors.red}Make sure your index.js exports the function correctly${colors.reset}`);
  process.exit(1);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Platform, X-App-Version, X-Device-ID, Accept');

  // Log requests
  const timestamp = new Date().toISOString();
  console.log(`${colors.blue}[${timestamp}] ${req.method} ${req.url}${colors.reset}`);

  // Handle request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (error) {
        req.body = body;
      }

      // Parse query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      req.query = Object.fromEntries(url.searchParams);
      req.path = url.pathname;

      // Call the Cloud Function
      proxyHandler(req, res);
    });
  } else {
    // Parse query parameters for GET requests
    const url = new URL(req.url, `http://${req.headers.host}`);
    req.query = Object.fromEntries(url.searchParams);
    req.path = url.pathname;

    // Call the Cloud Function
    proxyHandler(req, res);
  }
});

// Error handling
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`${colors.red}Error: Port ${PORT} is already in use${colors.reset}`);
    console.error(`${colors.yellow}Try using a different port: PORT=8081 npm start${colors.reset}`);
  } else {
    console.error(`${colors.red}Server error:${colors.reset}`, error);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log('');
  console.log(`${colors.yellow}Received ${signal}. Shutting down gracefully...${colors.reset}`);

  server.close(() => {
    console.log(`${colors.green}Local development server stopped${colors.reset}`);
    process.exit(0);
  });

  // Force close after 5 seconds
  setTimeout(() => {
    console.log(`${colors.red}Forced shutdown${colors.reset}`);
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, HOST, () => {
  console.log(`${colors.green}✓ Local development server running${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}Server Details:${colors.reset}`);
  console.log(`  URL: http://${HOST}:${PORT}`);
  console.log(`  Environment: development`);
  console.log(`  Hot Reload: enabled`);
  console.log('');
  console.log(`${colors.cyan}Test Endpoints:${colors.reset}`);
  console.log(`  Health Check: http://${HOST}:${PORT}/`);
  console.log(`  Radio API: http://${HOST}:${PORT}/api/mobile/v1/radio`);
  console.log(`  News API: http://${HOST}:${PORT}/api/mobile/v1/news`);
  console.log(`  Cards API: http://${HOST}:${PORT}/api/mobile/v1/content/cards`);
  console.log('');
  console.log(`${colors.cyan}Testing:${colors.reset}`);
  console.log(`  Run tests: PROXY_URL=http://${HOST}:${PORT} node test-proxy.js`);
  console.log('');
  console.log(`${colors.yellow}Press Ctrl+C to stop the server${colors.reset}`);
  console.log('');
});

// Hot reload support (restart on file changes)
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const path = require('path');

  const watchFiles = ['index.js', 'package.json'];

  watchFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.watchFile(file, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          console.log(`${colors.yellow}File ${file} changed. Please restart the server manually.${colors.reset}`);
          console.log(`${colors.yellow}Hot reload for Cloud Functions is limited.${colors.reset}`);
        }
      });
    }
  });
}

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'TrendAnkara Proxy Gateway',
      environment: 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }
});