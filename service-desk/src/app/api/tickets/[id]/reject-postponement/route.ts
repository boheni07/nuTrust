// Design Ref: §4.1 — 연기 반려 (기존 완료예정일 유지 → IN_PROGRESS)

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

    const postponement = await prisma.postponementRequest.findUnique({
      where: { ticketId: id },
    });

    if (!postponement || postponement.status !== 'PENDING') {
      return errorResponse('NO_PENDING_POSTPONEMENT', '대기 중인 연기 요청이 없습니다.', 400);
    }

    await prisma.postponementRequest.update({
      where: { ticketId: id },
      data: {
        status: 'REJECTED',
        respondedById: session!.user.id,
        respondedAt: new Date(),
      },
    });

    const result = await transitionTicket(id, 'REJECT_POSTPONEMENT', session!.user.id);

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
