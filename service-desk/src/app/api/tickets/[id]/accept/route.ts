// Design Ref: §4.1 — 티켓 접수 (처리계획 + 완료예정일)
// 접수(ACCEPT) + 처리시작(START)을 한 번에 수행

import { NextResponse } from 'next/server';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { acceptTicketSchema } from '@/lib/validations/ticket';
import { transitionTicket } from '@/lib/services/ticket-transition';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['AGENT', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const body = await parseBody(request, acceptTicketSchema);

    // Step 1: ACCEPT
    const acceptResult = await transitionTicket(id, 'ACCEPT', session!.user.id, {
      actionPlan: body.actionPlan,
      plannedDueDate: body.plannedDueDate,
    });

    if (!acceptResult.success) {
      return errorResponse(acceptResult.error!.code, acceptResult.error!.message, 400);
    }

    // Step 2: Auto-start (ACCEPTED → IN_PROGRESS)
    await transitionTicket(id, 'START', session!.user.id);

    return NextResponse.json({ data: { success: true } });
  });
}
