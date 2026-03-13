/**
 * API service layer for the VERI‑AI EDGE dashboard.
 *
 * - Uses a single Axios instance with a configurable base URL.
 * - Provides helper functions for the three backend endpoints:
 *   • uploadVideo()   – POST /analyze/video
 *   • analyzeText()  – POST /analyze/text
 *   • checkHealth()  – GET  /health
 *
 * Features
 * --------
 * • Centralised error handling – all functions throw a typed `ApiError`
 *   containing `status`, `message` and the original `error` object.
 * • Timeout protection – the Axios instance is configured with a 15 s
 *   timeout.  Requests that exceed the timeout are aborted and reported
 *   as a `timeout` error.
 * • Cancel token support – callers can abort a request by passing a
 *   `CancelTokenSource` (useful for UI components that unmount early).
 *
 * The module is deliberately lightweight and has no external UI‑specific
 * dependencies, making it safe for low‑power edge devices such as a
 * Raspberry Pi.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  CancelTokenSource,
} from 'axios';

/* -------------------------------------------------------------------------- */
/* Axios instance configuration                                               */
/* -------------------------------------------------------------------------- */
const api: AxiosInstance = axios.create({
  // Base URL can be overridden via NEXT_PUBLIC_API_URL env var.
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 15000, // 15 seconds timeout for all requests
  headers: {
    Accept: 'application/json',
  },
});

/* -------------------------------------------------------------------------- */
/* Types                                                                     */
/* -------------------------------------------------------------------------- */
export interface ApiError extends Error {
  /** HTTP status code (if available) */
  status?: number;
  /** Original Axios error */
  originalError: AxiosError;
}

/**
 * Response shape for the health endpoint.
 */
export interface HealthResponse {
  status: string; // e.g. "ok" or "error"
  edgeMode: string;
  inferenceDevice: string;
  latency: number;
}

/* -------------------------------------------------------------------------- */
/* Helper – create a typed ApiError                                           */
/* -------------------------------------------------------------------------- */
function createApiError(message: string, err: AxiosError): ApiError {
  const apiError = new Error(message) as ApiError;
  apiError.status = err.response?.status;
  apiError.originalError = err;
  return apiError;
}

/* -------------------------------------------------------------------------- */
/* uploadVideo – POST /analyze/video                                         */
/* -------------------------------------------------------------------------- */
export async function uploadVideo(
  file: File,
  cancelSource?: CancelTokenSource
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/analyze/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      cancelToken: cancelSource?.token,
    });
    return response.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axios.isCancel(axiosErr)) {
      throw createApiError('Video upload cancelled', axiosErr);
    }
    if (axiosErr.code === 'ECONNABORTED') {
      throw createApiError('Video upload timed out', axiosErr);
    }
    throw createApiError('Failed to upload video', axiosErr);
  }
}

/* -------------------------------------------------------------------------- */
/* analyzeText – POST /analyze/text                                          */
/* -------------------------------------------------------------------------- */
export async function analyzeText(
  file: File,
  cancelSource?: CancelTokenSource
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/analyze/text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      cancelToken: cancelSource?.token,
    });
    return response.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axios.isCancel(axiosErr)) {
      throw createApiError('Text analysis cancelled', axiosErr);
    }
    if (axiosErr.code === 'ECONNABORTED') {
      throw createApiError('Text analysis timed out', axiosErr);
    }
    throw createApiError('Failed to analyze text', axiosErr);
  }
}

/* -------------------------------------------------------------------------- */
/* checkHealth – GET /health                                                 */
/* -------------------------------------------------------------------------- */
export async function checkHealth(
  cancelSource?: CancelTokenSource
): Promise<HealthResponse> {
  try {
    const response = await api.get<HealthResponse>('/health', {
      cancelToken: cancelSource?.token,
    });
    return response.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axios.isCancel(axiosErr)) {
      throw createApiError('Health check cancelled', axiosErr);
    }
    if (axiosErr.code === 'ECONNABORTED') {
      throw createApiError('Health check timed out', axiosErr);
    }
    throw createApiError('Failed to fetch health status', axiosErr);
  }
}

/* -------------------------------------------------------------------------- */
/* Export the Axios instance for advanced use cases (optional)               */
/* -------------------------------------------------------------------------- */
export default api;
