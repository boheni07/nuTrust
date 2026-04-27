import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        requester: { select: { id: true, name: true, email: true, department: { select: { name: true } } } },
        registeredBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
            attachments: true,
          },
        },
        attachments: { where: { commentId: null } },
        postponement: true,
        csatRating: true,
      },
    });

    if (!ticket) {
      return errorResponse('NOT_FOUND', '티켓을 찾을 수 없습니다.', 404);
    }

    return NextResponse.json({ data: ticket });
  });
}
