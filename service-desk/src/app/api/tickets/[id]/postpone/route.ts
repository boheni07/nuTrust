// Design Ref: §4.1 — 연기요청 (3중 가드: 1회 제한 + 지연중 불가 + 완료예정일 전만)
// Plan SC: SC-3, FR-32, FR-33

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { postponeTicketSchema } from '@/lib/validations/ticket';
import { transitionTicket } from '@/lib/services/ticket-transition';
import { getPostponementRejectionReason } from '@/domain/ticket-machine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['AGENT', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const body = await parseBody(request, postponeTicketSchema);

    // Pre-check for detailed error messages
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true, postponementCount: true, plannedDueDate: true },
    });

    if (!ticket) {
      return errorResponse('NOT_FOUND', '티켓을 찾을 수 없습니다.', 404);
    }

    // Detailed guard check for user-friendly errors
    if (ticket.postponementCount >= 1) {
      return errorResponse('POSTPONEMENT_LIMIT_EXCEEDED', '연기 요청은 1회만 가능합니다.', 400, {
        currentCount: ticket.postponementCount,
        maxCount: 1,
      });
    }
    if (ticket.status === 'POSTPONEMENT_REQUESTED') {
      return errorResponse('POSTPONEMENT_LIMIT_EXCEEDED', '이미 연기 요청 중인 티켓입니다.', 400);
    }
    if (ticket.status === 'DELAYED') {
      return errorResponse('POSTPONEMENT_DELAYED_NOT_ALLOWED', '지연 상태에서는 연기 요청이 불가합니다.', 400);
    }
    if (ticket.plannedDueDate && new Date() >= ticket.plannedDueDate) {
      return errorResponse('POSTPONEMENT_PAST_DUE', '완료예정일이 지난 후에는 연기 요청이 불가합니다.', 400);
    }

    // Create postponement request record
    await prisma.postponementRequest.create({
      data: {
        ticketId: id,
        requestedById: session!.user.id,
        currentDueDate: ticket.plannedDueDate!,
        requestedDueDate: body.requestedDueDate,
        reason: body.reason,
      },
    });

    // Transition state
    const result = await transitionTicket(id, 'REQUEST_POSTPONEMENT', session!.user.id, {
      reason: body.reason,
    });

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
