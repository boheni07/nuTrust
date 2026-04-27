// Design Ref: §4.1 — 완료 반려 (COMPLETION_REQUESTED → IN_PROGRESS, 사유 필수)
// Plan FR-37

import { NextResponse } from 'next/server';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { rejectTicketSchema } from '@/lib/validations/ticket';
import { transitionTicket } from '@/lib/services/ticket-transition';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['CUSTOMER']);
    if (error) return error;

    const { id } = await params;
    const body = await parseBody(request, rejectTicketSchema);

    const result = await transitionTicket(id, 'REJECT', session!.user.id, {
      reason: body.reason,
    });

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
