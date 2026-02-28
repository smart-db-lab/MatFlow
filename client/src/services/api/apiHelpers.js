/**
 * API Helper Functions
 * Shared utilities for API service files
 */

import { apiFetch } from '../../util/apiClient';

export const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000/api';

/**
 * Helper function to handle response parsing
 */
export const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return { error: 'Failed to parse response' };
    }
  }
  
  if (contentType.includes('image/')) {
    return response;
  }
  
  return response;
};

/**
 * Helper function to handle BaseViewSet response format
 */
export const extractData = (responseData) => {
  if (responseData.success && responseData.data) {
    return responseData.data;
  }
  if (Array.isArray(responseData)) {
    return responseData;
  }
  return responseData;
};

