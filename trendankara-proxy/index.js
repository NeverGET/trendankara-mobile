import { http } from '@google-cloud/functions-framework';
import axios from 'axios';
import https from 'https';

// Target backend API
const TARGET_API_BASE = 'https://trendankara.com';

// Create an HTTPS agent that bypasses SSL verification
// WARNING: Only use this because we know the backend has SSL issues
// This proxy exists specifically to work around those issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Bypass SSL certificate verification
});

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Platform, X-App-Version, X-Device-ID, Accept',
  'Access-Control-Max-Age': '3600'
};

// Google Cloud Platform specific headers that should be filtered out
const GCP_HEADERS_TO_REMOVE = [
  'x-appengine-',
  'x-cloud-trace-context',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-google-',
  'function-execution-id',
  'x-goog-',
  'via'
];

// Mobile app specific headers that should be preserved
const MOBILE_APP_HEADERS = [
  'x-platform',
  'x-app-version',
  'x-device-id'
];

// Authentication and standard headers that should be forwarded
const STANDARD_HEADERS = [
  'authorization',
  'content-type',
  'accept',
  'accept-language',
  'accept-encoding',
  'cache-control',
  'if-none-match',
  'if-modified-since'
];

/**
 * Filters request headers to remove GCP-specific headers while preserving
 * mobile app headers and authentication headers
 */
function filterRequestHeaders(originalHeaders) {
  const filteredHeaders = {};

  // Convert header names to lowercase for consistent comparison
  const lowerCaseHeaders = {};
  Object.keys(originalHeaders).forEach(key => {
    lowerCaseHeaders[key.toLowerCase()] = originalHeaders[key];
  });

  // Add mobile app headers if present
  MOBILE_APP_HEADERS.forEach(headerName => {
    if (lowerCaseHeaders[headerName]) {
      filteredHeaders[headerName] = lowerCaseHeaders[headerName];
    }
  });

  // Add standard headers if present
  STANDARD_HEADERS.forEach(headerName => {
    if (lowerCaseHeaders[headerName]) {
      filteredHeaders[headerName] = lowerCaseHeaders[headerName];
    }
  });

  // Add any other headers that are not GCP-specific
  Object.keys(lowerCaseHeaders).forEach(headerName => {
    const shouldRemove = GCP_HEADERS_TO_REMOVE.some(gcpHeader =>
      headerName.startsWith(gcpHeader.toLowerCase())
    );

    // Only add if not already added and not a GCP header
    if (!shouldRemove && !filteredHeaders[headerName]) {
      // Check if it's not already in our standard or mobile app headers
      const isAlreadyAdded = [...MOBILE_APP_HEADERS, ...STANDARD_HEADERS]
        .some(knownHeader => knownHeader === headerName);

      if (!isAlreadyAdded) {
        filteredHeaders[headerName] = lowerCaseHeaders[headerName];
      }
    }
  });

  return filteredHeaders;
}

// Media proxy handler for images and media files
http('mediaProxy', async (req, res) => {
  try {
    // Apply CORS headers to all responses
    Object.keys(CORS_HEADERS).forEach(key => {
      res.set(key, CORS_HEADERS[key]);
    });

    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    // Only allow GET requests for media
    if (req.method !== 'GET') {
      res.status(405).json({
        error: 'Method Not Allowed',
        message: 'Only GET requests are allowed for media proxy'
      });
      return;
    }

    // Get the media URL from query parameter
    const mediaUrl = req.query.url;
    if (!mediaUrl) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Media URL is required as query parameter: ?url=...'
      });
      return;
    }

    console.log(`[${new Date().toISOString()}] Media proxy request: ${mediaUrl}`);

    // Configure axios request for media
    const axiosConfig = {
      method: 'GET',
      url: mediaUrl,
      timeout: 30000, // 30 seconds for media files
      maxRedirects: 5,
      validateStatus: () => true,
      responseType: 'stream', // Handle as stream for binary data
      httpsAgent: httpsAgent // Use the agent that bypasses SSL verification
    };

    // Make request to get media
    const response = await axios(axiosConfig);

    console.log(`[${new Date().toISOString()}] Media response: ${response.status}`);

    // Forward appropriate headers
    if (response.headers['content-type']) {
      res.set('content-type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.set('content-length', response.headers['content-length']);
    }
    if (response.headers['cache-control']) {
      res.set('cache-control', response.headers['cache-control']);
    } else {
      // Set default cache control for media files
      res.set('cache-control', 'public, max-age=86400'); // 24 hours
    }

    // Set status and pipe the response
    res.status(response.status);
    response.data.pipe(res);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Media proxy error:`, error.message);

    // Ensure CORS headers are applied even in error responses
    Object.keys(CORS_HEADERS).forEach(key => {
      res.set(key, CORS_HEADERS[key]);
    });

    res.status(500).json({
      error: 'Media Proxy Error',
      message: 'Failed to fetch media content',
      timestamp: new Date().toISOString()
    });
  }
});

// Core proxy handler function
http('proxyHandler', async (req, res) => {
  try {
    // Apply CORS headers to all responses
    Object.keys(CORS_HEADERS).forEach(key => {
      res.set(key, CORS_HEADERS[key]);
    });

    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    // Construct target URL with path and query parameters
    const targetUrl = `${TARGET_API_BASE}${req.path}`;

    console.log(`[${new Date().toISOString()}] ${req.method} ${targetUrl}`);

    // Filter request headers to remove GCP-specific headers
    const filteredHeaders = filterRequestHeaders(req.headers);

    // Log header filtering for debugging (in development)
    console.log(`[${new Date().toISOString()}] Filtered headers:`, Object.keys(filteredHeaders));

    // Add user-agent for identification
    filteredHeaders['user-agent'] = 'TrendAnkara-Proxy/1.0';

    // Configure axios request
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      params: req.query,
      headers: filteredHeaders,
      timeout: 25000, // 25 seconds (leaving 5s buffer for Cloud Function timeout)
      maxRedirects: 3, // Limit redirects to prevent loops
      validateStatus: () => true, // Accept all HTTP status codes
      httpsAgent: httpsAgent // Use the agent that bypasses SSL verification
    };

    // Remove undefined headers
    Object.keys(axiosConfig.headers).forEach(key => {
      if (axiosConfig.headers[key] === undefined) {
        delete axiosConfig.headers[key];
      }
    });

    // Add request body for POST, PUT, PATCH methods (as per requirements)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      axiosConfig.data = req.body;
    }

    // Make request to backend
    const response = await axios(axiosConfig);

    console.log(`[${new Date().toISOString()}] Response: ${response.status}`);

    // Set response headers
    if (response.headers['content-type']) {
      res.set('content-type', response.headers['content-type']);
    }

    // Return exact backend response
    res.status(response.status).send(response.data);

  } catch (error) {
    // Enhanced error logging with appropriate detail levels
    const timestamp = new Date().toISOString();
    const requestInfo = `${req.method} ${req.path}`;

    console.error(`[${timestamp}] Error processing request: ${requestInfo}`);
    console.error(`[${timestamp}] Error details:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      stack: error.stack
    });

    // Ensure CORS headers are applied even in error responses
    Object.keys(CORS_HEADERS).forEach(key => {
      res.set(key, CORS_HEADERS[key]);
    });

    // Enhanced error handling with structured responses
    let statusCode, errorResponse;

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // 504 Gateway Timeout for backend timeouts
      statusCode = 504;
      errorResponse = {
        error: 'Gateway Timeout',
        message: 'The backend server took too long to respond',
        code: 'TIMEOUT_ERROR',
        timestamp: timestamp
      };
      console.error(`[${timestamp}] Timeout error: Backend did not respond within 30 seconds`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH') {
      // 502 Bad Gateway for unreachable backend
      statusCode = 502;
      errorResponse = {
        error: 'Bad Gateway',
        message: 'Cannot reach the backend server',
        code: 'BACKEND_UNREACHABLE',
        timestamp: timestamp
      };
      console.error(`[${timestamp}] Backend unreachable: ${error.code} - ${error.message}`);
    } else if (error.response) {
      // Backend responded with an error status - forward the status but with structured error
      statusCode = error.response.status;
      errorResponse = {
        error: error.response.statusText || 'Backend Error',
        message: `Backend server returned ${error.response.status}`,
        code: 'BACKEND_ERROR',
        timestamp: timestamp
      };
      console.error(`[${timestamp}] Backend error: ${error.response.status} ${error.response.statusText}`);
    } else {
      // 500 Internal Server Error for other errors
      statusCode = 500;
      errorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred in the proxy server',
        code: 'INTERNAL_ERROR',
        timestamp: timestamp
      };
      console.error(`[${timestamp}] Internal server error:`, error);
    }

    // Send structured error response
    res.status(statusCode).json(errorResponse);
  }
});