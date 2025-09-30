# Google Cloud Functions Proxy Gateway Solution for SSL Issues

## Overview

This document provides a comprehensive solution to bypass SSL certificate issues in your React Native mobile app by implementing a Google Cloud Function as a proxy gateway. This approach leverages Google's infrastructure to handle SSL/TLS connections properly, ensuring secure communication between your mobile app and the backend API.

## Problem Statement

- **Current Issue**: SSL certificate problems preventing the React Native app from connecting to the backend API at `https://trendankara.com`
- **Timeline**: Fixing the SSL issue directly would take approximately one month
- **Impact**: Mobile app cannot fetch data from API endpoints defined in the documentation

## Solution Architecture

```
React Native App → Google Cloud Function (Proxy) → Backend API (trendankara.com)
```

### Benefits

1. **Immediate Solution**: Deploy within hours instead of waiting a month
2. **Cost-Effective**: Minimal processing means virtually no cost (within free tier limits)
3. **SSL/TLS Handled by Google**: Google's infrastructure manages SSL certificates
4. **No Backend Changes Required**: Transparent proxy layer
5. **CORS Support**: Properly configured for mobile apps

## Prerequisites

1. **Google Cloud Account**: Create one at [console.cloud.google.com](https://console.cloud.google.com)
2. **Node.js**: Version 18 or higher
3. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)
4. **Basic Knowledge**: JavaScript/Node.js and command line

## Step-by-Step Implementation

### Step 1: Set Up Google Cloud Project

```bash
# Install Google Cloud SDK if not already installed
curl https://sdk.cloud.google.com | bash

# Initialize gcloud and authenticate
gcloud init

# Create a new project (replace with your project ID)
gcloud projects create trendankara-proxy --name="TrendAnkara Proxy"

# Set the project as active
gcloud config set project trendankara-proxy

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 2: Create the Proxy Function

Create a new directory for your Cloud Function:

```bash
mkdir trendankara-proxy
cd trendankara-proxy
```

#### 2.1 Create `package.json`

```json
{
  "name": "trendankara-proxy",
  "version": "1.0.0",
  "description": "Proxy gateway for TrendAnkara mobile app API",
  "main": "index.js",
  "engines": {
    "node": "18"
  },
  "scripts": {
    "start": "functions-framework --target=proxyRequest --signature-type=http",
    "deploy": "gcloud functions deploy trendankara-proxy --runtime nodejs18 --trigger-http --allow-unauthenticated --entry-point proxyRequest --region us-central1 --memory 256MB --timeout 60s"
  },
  "dependencies": {
    "@google-cloud/functions-framework": "^3.3.0",
    "axios": "^1.6.0",
    "express": "^4.18.2"
  }
}
```

#### 2.2 Create `index.js` - The Main Proxy Function

```javascript
const functions = require('@google-cloud/functions-framework');
const axios = require('axios');

// Target backend API
const TARGET_API_BASE = 'https://trendankara.com';

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Platform, X-App-Version, X-Device-ID, Accept',
  'Access-Control-Max-Age': '3600'
};

// Proxy request handler
functions.http('proxyRequest', async (req, res) => {
  // Set CORS headers for all responses
  Object.keys(CORS_HEADERS).forEach(header => {
    res.set(header, CORS_HEADERS[header]);
  });

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Construct the target URL
    const targetPath = req.path;
    const targetUrl = `${TARGET_API_BASE}${targetPath}`;

    console.log(`Proxying ${req.method} request to: ${targetUrl}`);

    // Prepare headers for the backend request
    const proxyHeaders = {
      ...req.headers,
      host: undefined, // Remove host header
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
      'x-forwarded-proto': 'https',
      'x-original-host': req.headers.host
    };

    // Remove Google Cloud Function specific headers
    delete proxyHeaders['x-appengine-api-ticket'];
    delete proxyHeaders['x-appengine-city'];
    delete proxyHeaders['x-appengine-citylatlong'];
    delete proxyHeaders['x-appengine-country'];
    delete proxyHeaders['x-appengine-default-version-hostname'];
    delete proxyHeaders['x-appengine-https'];
    delete proxyHeaders['x-appengine-region'];
    delete proxyHeaders['x-appengine-request-log-id'];
    delete proxyHeaders['x-appengine-timeout-ms'];
    delete proxyHeaders['x-appengine-user-ip'];
    delete proxyHeaders['x-cloud-trace-context'];
    delete proxyHeaders['x-forwarded-for'];
    delete proxyHeaders['x-forwarded-proto'];
    delete proxyHeaders['traceparent'];
    delete proxyHeaders['function-execution-id'];

    // Configure axios request
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: proxyHeaders,
      params: req.query,
      timeout: 30000, // 30 second timeout
      validateStatus: () => true, // Don't throw on any status
      maxRedirects: 5,
      // Disable SSL verification if needed (NOT recommended for production)
      // httpsAgent: new https.Agent({ rejectUnauthorized: false })
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      axiosConfig.data = req.body;
    }

    // Make the proxy request
    const response = await axios(axiosConfig);

    // Log response status for monitoring
    console.log(`Response status: ${response.status}`);

    // Forward response headers (excluding some)
    const responseHeaders = response.headers;
    const headersToExclude = ['content-encoding', 'content-length', 'transfer-encoding'];

    Object.keys(responseHeaders).forEach(header => {
      if (!headersToExclude.includes(header.toLowerCase())) {
        res.set(header, responseHeaders[header]);
      }
    });

    // Ensure CORS headers are always set
    Object.keys(CORS_HEADERS).forEach(header => {
      res.set(header, CORS_HEADERS[header]);
    });

    // Send response
    res.status(response.status).send(response.data);

  } catch (error) {
    console.error('Proxy error:', error.message);

    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The backend server took too long to respond'
      });
    } else if (error.code === 'ENOTFOUND') {
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Could not reach the backend server'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while processing the request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});
```

#### 2.3 Create `.gcloudignore` (Optional)

```
# This file specifies files that are *not* uploaded to Google Cloud
node_modules/
.git
.gitignore
*.md
.env
.env.*
npm-debug.log
yarn-error.log
```

### Step 3: Test Locally

```bash
# Install dependencies
npm install

# Run locally
npm start

# In another terminal, test the proxy
curl http://localhost:8080/api/mobile/v1/radio
```

### Step 4: Deploy to Google Cloud Functions

```bash
# Deploy the function
gcloud functions deploy trendankara-proxy \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point proxyRequest \
  --region us-central1 \
  --memory 256MB \
  --timeout 60s \
  --set-env-vars NODE_ENV=production

# Note the function URL that's displayed after deployment
# It will look like: https://us-central1-trendankara-proxy.cloudfunctions.net/trendankara-proxy
```

### Step 5: Update React Native App Configuration

Update your React Native app's API configuration:

```javascript
// constants/api.ts or config/api.js

const API_CONFIG = {
  // Old configuration (commented out)
  // BASE_URL: 'https://trendankara.com/api/mobile/v1',

  // New configuration using Google Cloud Function proxy
  BASE_URL: 'https://us-central1-trendankara-proxy.cloudfunctions.net/trendankara-proxy/api/mobile/v1',

  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': DeviceInfo.getVersion(),
    'X-Device-ID': DeviceInfo.getUniqueId(),
  }
};

// Example API client update
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  config => {
    console.log(`Making request to: ${config.url}`);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Advanced Configuration

### Environment Variables

Create a `.env` file for local development:

```env
TARGET_API_BASE=https://trendankara.com
NODE_ENV=development
MAX_TIMEOUT=30000
ALLOWED_ORIGINS=*
```

Update the function to use environment variables:

```javascript
const TARGET_API_BASE = process.env.TARGET_API_BASE || 'https://trendankara.com';
const MAX_TIMEOUT = parseInt(process.env.MAX_TIMEOUT || '30000');
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
```

Deploy with environment variables:

```bash
gcloud functions deploy trendankara-proxy \
  --set-env-vars TARGET_API_BASE=https://trendankara.com,NODE_ENV=production,MAX_TIMEOUT=30000
```

### Caching Support

Add caching to reduce backend load and improve response times:

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

// In the proxy function, before making the request
const cacheKey = `${req.method}:${targetUrl}:${JSON.stringify(req.query)}`;
const cachedResponse = cache.get(cacheKey);

if (cachedResponse && req.method === 'GET') {
  console.log('Serving from cache');
  res.status(200).send(cachedResponse);
  return;
}

// After successful response
if (req.method === 'GET' && response.status === 200) {
  cache.set(cacheKey, response.data);
}
```

### Request Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Apply to the function
functions.http('proxyRequest', limiter, async (req, res) => {
  // ... rest of the proxy code
});
```

## Monitoring and Logging

### View Function Logs

```bash
# View real-time logs
gcloud functions logs read trendankara-proxy --tail

# View logs for specific time range
gcloud functions logs read trendankara-proxy --start-time="2025-01-15T00:00:00Z"
```

### Set Up Monitoring Alerts

```bash
# Create an alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate Alert" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

## API Endpoint Mappings

All your existing endpoints will work through the proxy:

| Original Endpoint | Proxy Endpoint |
|------------------|----------------|
| `https://trendankara.com/api/mobile/v1/radio` | `https://[FUNCTION_URL]/api/mobile/v1/radio` |
| `https://trendankara.com/api/mobile/v1/content/cards` | `https://[FUNCTION_URL]/api/mobile/v1/content/cards` |
| `https://trendankara.com/api/mobile/v1/polls/current` | `https://[FUNCTION_URL]/api/mobile/v1/polls/current` |
| `https://trendankara.com/api/mobile/v1/news` | `https://[FUNCTION_URL]/api/mobile/v1/news` |
| `https://trendankara.com/api/admin/mobile/settings` | `https://[FUNCTION_URL]/api/admin/mobile/settings` |

## Testing the Proxy

### Test Script

Create `test-proxy.js`:

```javascript
const axios = require('axios');

const PROXY_BASE = 'https://us-central1-trendankara-proxy.cloudfunctions.net/trendankara-proxy';

async function testEndpoints() {
  const endpoints = [
    '/api/mobile/v1/radio',
    '/api/admin/mobile/settings',
    '/api/mobile/v1/content/cards',
    '/api/mobile/v1/polls/current'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${PROXY_BASE}${endpoint}`);
      console.log(`✓ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.error(`✗ ${endpoint} - Error: ${error.message}`);
    }
  }
}

testEndpoints();
```

Run the test:

```bash
node test-proxy.js
```

## Cost Estimation

Google Cloud Functions pricing (as of 2025):

- **Invocations**: First 2 million free per month
- **Compute Time**: First 400,000 GB-seconds free per month
- **Networking**: First 5 GB egress free per month

For a typical mobile app with moderate usage:
- **Estimated Monthly Invocations**: 500,000
- **Estimated Compute Time**: 50,000 GB-seconds
- **Estimated Network**: 2 GB

**Total Estimated Cost**: $0 (within free tier)

## Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**
   - Ensure CORS headers are set correctly in the function
   - Check that OPTIONS requests return 204 status

2. **Timeout Errors**
   - Increase function timeout: `--timeout 120s`
   - Optimize backend response times

3. **Authentication Issues**
   - Ensure auth headers are properly forwarded
   - Check that sensitive headers aren't filtered

4. **SSL Certificate Errors**
   - The proxy handles SSL/TLS, but ensure the backend cert is valid
   - For testing only, you can disable SSL verification (not recommended for production)

5. **Function Not Accessible**
   - Verify `--allow-unauthenticated` flag is set
   - Check IAM permissions

### Debug Mode

Add debug logging to the function:

```javascript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  console.log('Target URL:', targetUrl);
}
```

Deploy with debug enabled:

```bash
gcloud functions deploy trendankara-proxy --set-env-vars DEBUG=true
```

## Security Considerations

1. **API Key Protection**: If your backend requires API keys, store them as environment variables
2. **IP Whitelisting**: Configure Cloud Functions to accept requests only from specific IPs if needed
3. **Request Validation**: Add input validation to prevent injection attacks
4. **Rate Limiting**: Implement to prevent DDoS attacks
5. **Monitoring**: Set up alerts for unusual traffic patterns

## Rollback and Migration

### Rollback to Previous Version

```bash
# List function versions
gcloud functions versions list trendankara-proxy

# Rollback to specific version
gcloud functions deploy trendankara-proxy --source=gs://gcf-sources-[PROJECT_ID]/[VERSION]
```

### Migration Back to Direct Connection

Once SSL issues are resolved:

1. Test direct connection thoroughly
2. Update `API_CONFIG.BASE_URL` back to original
3. Deploy app update
4. Monitor for issues
5. Delete Cloud Function after confirmation

## Conclusion

This Google Cloud Functions proxy solution provides an immediate, cost-effective workaround for SSL certificate issues while maintaining security and performance. The implementation requires minimal changes to your React Native app and can be deployed within hours.

## Resources

- [Google Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Functions Framework for Node.js](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)
- [Google Cloud Console](https://console.cloud.google.com)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Cloud Functions Best Practices](https://cloud.google.com/functions/docs/bestpractices)

---

**Document Version**: 1.0.0
**Last Updated**: January 2025
**Author**: TrendAnkara Development Team