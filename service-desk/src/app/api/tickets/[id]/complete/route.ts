// Design Ref: §4.1 — 완료요청 (IN_PROGRESS/DELAYED → COMPLETION_REQUESTED)

import { NextResponse } from 'next/server';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { transitionTicket } from '@/lib/services/ticket-transition';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['AGENT', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const result = await transitionTicket(id, 'REQUEST_COMPLETION', session!.user.id);

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
