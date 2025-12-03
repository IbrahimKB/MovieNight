import { NextResponse } from "next/server";

/**
 * Standard API Response Envelope
 * All API responses should follow this format for consistency
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Success response (200 OK, 201 Created, etc)
 */
export function ok<T>(
  data: T,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Created response (201)
 */
export function created<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

/**
 * Bad Request - validation errors
 */
export function badRequest(
  error: string,
  validationErrors?: ValidationError[],
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(validationErrors && { validationErrors }),
    },
    { status: 400 },
  );
}

/**
 * Unauthorized - no valid session/token
 */
export function unauthorized(
  error: string = "Unauthorized",
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

/**
 * Forbidden - authenticated but not authorized for this action
 */
export function forbidden(
  error: string = "Forbidden",
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

/**
 * Not Found
 */
export function notFound(
  error: string = "Not Found",
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

/**
 * Conflict - resource already exists, duplicate, etc
 */
export function conflict(
  error: string = "Conflict",
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error }, { status: 409 });
}

/**
 * Internal Server Error
 */
export function serverError(
  error: string = "Internal Server Error",
  details?: string,
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { success: false, error };
  // Only include details in development
  if (process.env.NODE_ENV === "development" && details) {
    (response as any).details = details;
  }
  return NextResponse.json(response, { status: 500 });
}

/**
 * Convert Zod validation errors to standard format
 */
export function formatZodErrors(
  zodErrors: Record<string, { _errors: string[] }>,
): ValidationError[] {
  return Object.entries(zodErrors).map(([field, error]) => ({
    field,
    message: error._errors[0] || "Invalid value",
  }));
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ApiResponse,
): response is ApiErrorResponse {
  return !response.success;
}
