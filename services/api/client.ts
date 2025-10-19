/**
 * API Client Configuration
 * Centralized HTTP client with retry logic and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type { ApiResponse } from '@/types/api';

// API Configuration
// Using Google Cloud Function proxy to bypass SSL issues
const API_CONFIG = {
  BASE_URL: 'https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy/api/mobile/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second base delay
  USE_MOCK: false,
};

if (__DEV__) {
  console.log('Initializing API Client with config:', {
    BASE_URL: API_CONFIG.BASE_URL,
    TIMEOUT: API_CONFIG.TIMEOUT,
    Platform: Platform.OS,
    AppVersion: Constants.expoConfig?.version || '1.0.0',
    DeviceName: Device.deviceName || 'unknown',
  });
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': Constants.expoConfig?.version || '1.0.0',
    'X-Device-ID': Device.deviceName || 'unknown',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    if (__DEV__) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log('API Request:', config.method?.toUpperCase(), fullUrl);
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      console.log('Base URL:', config.baseURL);
      console.log('Endpoint:', config.url);
      console.log('Timeout:', config.timeout + 'ms');
      if (config.params) {
        console.log('Params:', JSON.stringify(config.params, null, 2));
      }
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('API Request Setup Error:', error.message);
    console.error('Stack:', error.stack);
    return Promise.reject(error);
  }
);

// Extended config type for retry tracking
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: number;
}

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle network errors
    if (!error.response) {
      console.error('NETWORK ERROR DETAILS:');
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      console.error('URL Attempted:', `${originalRequest?.baseURL}${originalRequest?.url}`);
      console.error('Request Config:', {
        method: originalRequest?.method,
        baseURL: originalRequest?.baseURL,
        url: originalRequest?.url,
        timeout: originalRequest?.timeout,
      });

      if (error.code === 'ECONNABORTED') {
        console.error('Request timed out');
      } else if (error.code === 'ERR_NETWORK') {
        console.error('Network connection failed');
      } else if (error.message.includes('SSL')) {
        console.error('SSL/TLS error detected');
      }

      if (__DEV__) {
        console.error('Full Error Object:', JSON.stringify({
          message: error.message,
          code: error.code,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 5),
          config: {
            url: originalRequest?.url,
            baseURL: originalRequest?.baseURL,
            method: originalRequest?.method,
          }
        }, null, 2));
      }

      // Implement retry logic for network errors
      if (!originalRequest._retry || originalRequest._retry < API_CONFIG.RETRY_ATTEMPTS) {
        originalRequest._retry = (originalRequest._retry || 0) + 1;

        // Exponential backoff
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest._retry - 1);

        if (__DEV__) {
          console.log(`Retrying request (${originalRequest._retry}/${API_CONFIG.RETRY_ATTEMPTS}) after ${delay}ms`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient.request(originalRequest);
      }

      return Promise.reject({
        success: false,
        error: 'Network error. Please check your internet connection.',
        originalError: error,
      });
    }

    // Handle API errors (but not 404 for polls - that's expected)
    const isExpected404 = error.response.status === 404 && error.response.config.url?.includes('/polls');

    if (!isExpected404) {
      console.error(`API Error: ${error.response.status} ${error.response.config.url}`);
      console.error('Error Data:', error.response.data);
    }

    // Transform error response
    const errorData = error.response.data as any;
    const apiError: ApiResponse<null> = {
      success: false,
      error: errorData?.error || errorData?.message || 'An unexpected error occurred',
    };

    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Handle unauthorized
        apiError.error = 'Unauthorized access. Please login again.';
        break;
      case 403:
        // Handle forbidden
        apiError.error = 'You do not have permission to access this resource.';
        break;
      case 404:
        // Handle not found
        apiError.error = 'The requested resource was not found.';
        break;
      case 429:
        // Handle rate limiting
        apiError.error = 'Too many requests. Please try again later.';

        // Retry after delay if specified in headers
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter && !originalRequest._retry) {
          originalRequest._retry = 1;
          const delay = parseInt(retryAfter) * 1000;
          console.log(`Rate limited. Retrying after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return apiClient.request(originalRequest);
        }
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        // Handle server errors
        apiError.error = 'Server error. Please try again later.';

        // Retry server errors
        if (!originalRequest._retry || originalRequest._retry < API_CONFIG.RETRY_ATTEMPTS) {
          originalRequest._retry = (originalRequest._retry || 0) + 1;
          const delay = API_CONFIG.RETRY_DELAY * originalRequest._retry;
          console.log(`Server error. Retrying (${originalRequest._retry}/${API_CONFIG.RETRY_ATTEMPTS}) after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return apiClient.request(originalRequest);
        }
        break;
    }

    return Promise.reject(apiError);
  }
);

/**
 * Helper function to handle API responses
 */
export const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (!response.data.success) {
    throw new Error(response.data.error || 'API request failed');
  }
  if (!response.data.data) {
    throw new Error('No data received from API');
  }
  return response.data.data;
};

/**
 * Helper function to handle API errors
 */
export const handleApiError = (error: any): string => {
  if (error.error) {
    return error.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default apiClient;