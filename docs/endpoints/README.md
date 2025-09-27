# TrendAnkara Mobile API Documentation 📱

## Overview

This documentation provides complete information about all API endpoints available for the TrendAnkara mobile application. All endpoints are RESTful and return JSON responses.

## Base Configuration

### Production Server
```javascript
const BASE_URL = 'https://trendankara.com';
const API_BASE = `${BASE_URL}/api/mobile/v1`;
```

### Development Server
```javascript
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/mobile/v1`;
```

## Table of Contents

1. [Authentication & Headers](./01-authentication.md)
2. [Polls API](./02-polls-api.md)
3. [News API](./03-news-api.md)
4. [Cards API](./04-cards-api.md)
5. [Configuration API](./05-config-api.md)
6. [Radio API](./06-radio-api.md)
7. [Error Handling](./07-error-handling.md)
8. [React Native Implementation Guide](./08-react-native-guide.md)
9. [Cache Strategy](./09-cache-strategy.md)
10. [Types & Interfaces](./10-types.md)

## Quick Start

### Installation

```bash
npm install axios react-native-async-storage
# or
yarn add axios react-native-async-storage
```

### Basic Setup

```javascript
// api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://trendankara.com/api/mobile/v1',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Request interceptor for auth
apiClient.interceptors.request.use(
  async (config) => {
    const deviceId = await AsyncStorage.getItem('deviceId');
    if (deviceId) {
      config.headers['X-Device-ID'] = deviceId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for caching
apiClient.interceptors.response.use(
  (response) => {
    // Handle ETag caching
    if (response.headers.etag) {
      AsyncStorage.setItem(
        `etag_${response.config.url}`,
        response.headers.etag
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "cache": {
    "etag": "\"hash\"",
    "maxAge": 60
  },
  "meta": {
    // Optional metadata
  }
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": "Error message in Turkish"
}
```

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 304 | Not Modified | Cache is still valid |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **429 Response:** Includes `Retry-After` header

## Support

For API issues or questions, contact: dev@trendankara.com

## Version

Current API Version: **v1**
Last Updated: **September 2025**