# Error Handling Guide

## Overview
This guide provides comprehensive error handling strategies for the TrendAnkara mobile API. All errors follow a consistent format with Turkish localization and appropriate HTTP status codes.

## Error Response Format

All API errors follow this standard structure:

```json
{
  "success": false,
  "data": null,
  "error": "Error message in Turkish",
  "errorCode": "SPECIFIC_ERROR_CODE",
  "details": {
    "field": "Additional error context if available"
  }
}
```

## HTTP Status Codes

### Success Codes (2xx)
| Code | Meaning | Usage |
|------|---------|--------|
| 200 | OK | Successful GET, PUT, DELETE requests |
| 201 | Created | Successful POST creating new resource |
| 204 | No Content | Successful DELETE with no response body |

### Redirection Codes (3xx)
| Code | Meaning | Usage |
|------|---------|--------|
| 304 | Not Modified | ETag matches, use cached version |

### Client Error Codes (4xx)
| Code | Meaning | Usage |
|------|---------|--------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Access denied to resource |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Request conflicts with current state |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)
| Code | Meaning | Usage |
|------|---------|--------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream server error |
| 503 | Service Unavailable | Server temporarily unavailable |

## Common Error Scenarios

### 1. Validation Errors (400)
```json
{
  "success": false,
  "data": null,
  "error": "Geçersiz istek parametreleri",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "itemId": "Bu alan zorunludur",
    "deviceId": "Geçersiz cihaz kimliği formatı"
  }
}
```

### 2. Already Voted (409)
```json
{
  "success": false,
  "data": null,
  "error": "Bu ankette zaten oy kullandınız",
  "errorCode": "ALREADY_VOTED"
}
```

### 3. Poll Not Found (404)
```json
{
  "success": false,
  "data": null,
  "error": "Anket bulunamadı",
  "errorCode": "POLL_NOT_FOUND"
}
```

### 4. Rate Limit Exceeded (429)
```json
{
  "success": false,
  "data": null,
  "error": "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

Response Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1695825000
Retry-After: 60
```

### 5. Server Error (500)
```json
{
  "success": false,
  "data": null,
  "error": "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
  "errorCode": "INTERNAL_ERROR"
}
```

## React Native Error Handler

### Global Error Handler
```javascript
// utils/errorHandler.js
export class APIError extends Error {
  constructor(message, code, status, details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const handleAPIError = (error) => {
  // Network error
  if (!error.response) {
    return {
      message: 'İnternet bağlantınızı kontrol edin',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
      shouldRetry: true
    };
  }

  const { status, data } = error.response;

  // Parse error response
  const errorInfo = {
    message: data?.error || 'Bir hata oluştu',
    code: data?.errorCode || 'UNKNOWN_ERROR',
    status,
    details: data?.details,
    isNetworkError: false,
    shouldRetry: false
  };

  // Determine if error is retryable
  switch (status) {
    case 429: // Rate limited
      errorInfo.shouldRetry = true;
      errorInfo.retryAfter = data?.retryAfter || 60;
      break;
    case 500:
    case 502:
    case 503:
      errorInfo.shouldRetry = true;
      break;
    case 401:
      errorInfo.requiresAuth = true;
      break;
  }

  return errorInfo;
};

export const getErrorMessage = (errorCode) => {
  const messages = {
    'NETWORK_ERROR': 'İnternet bağlantınızı kontrol edin',
    'VALIDATION_ERROR': 'Girdiğiniz bilgileri kontrol edin',
    'ALREADY_VOTED': 'Bu ankette zaten oy kullandınız',
    'POLL_NOT_FOUND': 'Anket bulunamadı',
    'NEWS_NOT_FOUND': 'Haber bulunamadı',
    'RATE_LIMIT_EXCEEDED': 'Çok fazla istek. Lütfen bekleyin',
    'MAINTENANCE_MODE': 'Sistem bakımda',
    'UPDATE_REQUIRED': 'Güncelleme gerekli',
    'INTERNAL_ERROR': 'Bir hata oluştu. Lütfen tekrar deneyin'
  };

  return messages[errorCode] || 'Bilinmeyen bir hata oluştu';
};
```

### API Client with Error Handling
```javascript
// api/client.js
import axios from 'axios';
import { handleAPIError, APIError } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://trendankara.com/api/mobile/v1',
      timeout: 10000
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const errorInfo = handleAPIError(error);

        // Auto retry for retryable errors
        if (errorInfo.shouldRetry && !error.config.__isRetryRequest) {
          error.config.__isRetryRequest = true;

          // Wait before retry for rate limit
          if (errorInfo.retryAfter) {
            await new Promise(resolve =>
              setTimeout(resolve, errorInfo.retryAfter * 1000)
            );
          }

          return this.client(error.config);
        }

        // Log error for debugging
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: errorInfo.status,
          code: errorInfo.code,
          message: errorInfo.message
        });

        // Throw custom error
        throw new APIError(
          errorInfo.message,
          errorInfo.code,
          errorInfo.status,
          errorInfo.details
        );
      }
    );
  }

  async get(endpoint, params = {}) {
    return this.client.get(endpoint, { params });
  }

  async post(endpoint, data = {}) {
    return this.client.post(endpoint, data);
  }
}

export default new APIClient();
```

### Component Error Handling
```javascript
// components/ErrorBoundary.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to crash reporting service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Bir şeyler yanlış gitti</Text>
          <Text style={styles.message}>
            Uygulama beklenmeyen bir hatayla karşılaştı.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
```

### Hook for Error Handling
```javascript
// hooks/useAPICall.js
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getErrorMessage } from '../utils/errorHandler';

export const useAPICall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      showErrorAlert = true,
      onError,
      onSuccess,
      retryCount = 0
    } = options;

    setLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await apiCall();
        setLoading(false);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        console.error(`API call failed (attempt ${attempt + 1}):`, err);

        if (attempt < retryCount) {
          // Wait before retry with exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }

        setError(err);
        setLoading(false);

        if (onError) {
          onError(err);
        }

        if (showErrorAlert) {
          const message = getErrorMessage(err.code);
          Alert.alert('Hata', message, [{ text: 'Tamam' }]);
        }

        throw err;
      }
    }
  }, []);

  return { loading, error, execute };
};
```

### Usage Example
```javascript
// screens/PollsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAPICall } from '../hooks/useAPICall';
import pollService from '../services/pollService';

const PollsScreen = () => {
  const [polls, setPolls] = useState(null);
  const { loading, error, execute } = useAPICall();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    await execute(
      () => pollService.getActivePolls(),
      {
        onSuccess: (data) => setPolls(data),
        onError: (err) => {
          if (err.code === 'NETWORK_ERROR') {
            // Show offline message
            showOfflineMessage();
          }
        },
        retryCount: 2
      }
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return (
      <ErrorView
        message={error.message}
        onRetry={fetchPolls}
      />
    );
  }

  return (
    <View>
      {/* Render polls */}
    </View>
  );
};
```

## Error Codes Reference

| Error Code | Description | User Action |
|------------|-------------|-------------|
| NETWORK_ERROR | No internet connection | Check connection |
| VALIDATION_ERROR | Invalid input data | Fix input fields |
| ALREADY_VOTED | User already voted | View results only |
| POLL_NOT_FOUND | Poll doesn't exist | Refresh list |
| NEWS_NOT_FOUND | News article not found | Go back to list |
| CARD_NOT_FOUND | Card doesn't exist | Refresh cards |
| RATE_LIMIT_EXCEEDED | Too many requests | Wait and retry |
| MAINTENANCE_MODE | Server maintenance | Wait for completion |
| UPDATE_REQUIRED | App update needed | Update app |
| INVALID_VERSION | Version not supported | Update app |
| INTERNAL_ERROR | Server error | Try again later |

## Best Practices

1. **Always handle network errors**: Check connectivity before API calls
2. **Implement retry logic**: Automatically retry failed requests with exponential backoff
3. **Cache error messages**: Store error messages for offline display
4. **Log errors properly**: Send error logs to analytics service
5. **Show user-friendly messages**: Display Turkish localized messages
6. **Provide recovery actions**: Always give users a way to retry or recover
7. **Handle rate limiting**: Respect rate limits and implement proper backoff
8. **Validate input client-side**: Prevent unnecessary API calls with client validation