// Design Ref: §4.1 — 상태 변경 타임라인 이력 (FR-38)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth();
    if (error) return error;

    const { id: ticketId } = await params;
    const history = await prisma.ticketStatusHistory.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: history });
  });
}
