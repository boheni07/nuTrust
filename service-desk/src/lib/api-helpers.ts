import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { auth } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

/**
 * Parse and validate request body with Zod schema.
 */
export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Standard error response.
 */
export function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

/**
 * Handle Zod validation errors.
 */
export function handleValidationError(error: ZodError) {
  return errorResponse(
    'VALIDATION_ERROR',
    '입력값이 올바르지 않습니다.',
    400,
    { fieldErrors: error.flatten().fieldErrors }
  );
}

/**
 * Authenticate and authorize request. Returns session or error response.
 */
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    return { error: errorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401) };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: errorResponse('FORBIDDEN', '접근 권한이 없습니다.', 403) };
  }

  return { session };
}

/**
 * Wrap API handler with error handling.
 */
export async function withErrorHandler(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    console.error('API Error:', error);
    return errorResponse('INTERNAL_ERROR', '서버 오류가 발생했습니다.', 500);
  }
}
