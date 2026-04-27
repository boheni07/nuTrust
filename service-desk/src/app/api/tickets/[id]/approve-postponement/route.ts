// Design Ref: §4.1 — 연기 승인 (새 완료예정일 적용 → IN_PROGRESS)
// Plan FR-34

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

    // Get the postponement request to apply new due date
    const postponement = await prisma.postponementRequest.findUnique({
      where: { ticketId: id },
    });

    if (!postponement || postponement.status !== 'PENDING') {
      return errorResponse('NO_PENDING_POSTPONEMENT', '대기 중인 연기 요청이 없습니다.', 400);
    }

    // Approve postponement record
    await prisma.postponementRequest.update({
      where: { ticketId: id },
      data: {
        status: 'APPROVED',
        respondedById: session!.user.id,
        respondedAt: new Date(),
      },
    });

    // Transition with new due date
    const result = await transitionTicket(id, 'APPROVE_POSTPONEMENT', session!.user.id, {
      newDueDate: postponement.requestedDueDate,
    });

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
