import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const apiSuccess = (data: unknown, status: number = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

export const apiError = (message: string, status: number = 400, code?: string) => {
  logger.error('[API]', `Error ${status}: ${message}`);
  return NextResponse.json({ success: false, error: { message, code } }, { status });
};

export const apiValidationError = (message: string) => apiError(message, 422, 'VALIDATION_ERROR');
export const apiUnauthorized = (message: string = 'Unauthorized') => apiError(message, 401, 'UNAUTHORIZED');
export const apiForbidden = (message: string = 'Forbidden') => apiError(message, 403, 'FORBIDDEN');
export const apiNotFound = (message: string = 'Not Found') => apiError(message, 404, 'NOT_FOUND');
export const apiConflict = (message: string) => apiError(message, 409, 'CONFLICT');
export const apiServerError = (message: string = 'Internal Server Error') => apiError(message, 500, 'SERVER_ERROR');
export const apiRateLimit = (message: string = 'Too Many Requests') => apiError(message, 429, 'RATE_LIMIT');
