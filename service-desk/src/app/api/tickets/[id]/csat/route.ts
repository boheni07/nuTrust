// Design Ref: §4.1 — CSAT 평가 제출 (APPROVED → CLOSED)
// Plan FR-50, SC-1

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { csatSchema } from '@/lib/validations/ticket';
import { transitionTicket } from '@/lib/services/ticket-transition';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['CUSTOMER']);
    if (error) return error;

    const { id } = await params;
    const body = await parseBody(request, csatSchema);

    // Verify ticket is in APPROVED state
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true, requesterId: true },
    });

    if (!ticket) {
      return errorResponse('NOT_FOUND', '티켓을 찾을 수 없습니다.', 404);
    }

    if (ticket.status !== 'APPROVED') {
      return errorResponse('TICKET_INVALID_TRANSITION', '승인된 티켓만 CSAT 평가가 가능합니다.', 400);
    }

    // Get contact for ratedBy
    const contact = await prisma.contact.findFirst({
      where: { userId: session!.user.id },
      select: { id: true },
    });

    if (!contact) {
      return errorResponse('NOT_FOUND', '연결된 담당자 정보가 없습니다.', 400);
    }

    // Create CSAT and transition to CLOSED
    await prisma.cSATRating.create({
      data: {
        ticketId: id,
        rating: body.rating,
        feedback: body.feedback,
        ratedById: contact.id,
      },
    });

    const result = await transitionTicket(id, 'SUBMIT_CSAT', session!.user.id);

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } }, { status: 201 });
  });
}
