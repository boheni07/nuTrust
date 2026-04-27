// Design Ref: §4.1 — 완료 승인 (COMPLETION_REQUESTED → APPROVED)
// Plan FR-36

import { NextResponse } from 'next/server';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { transitionTicket } from '@/lib/services/ticket-transition';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['CUSTOMER']);
    if (error) return error;

    const { id } = await params;
    const result = await transitionTicket(id, 'APPROVE', session!.user.id);

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
