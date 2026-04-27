// Design Ref: §4.1 — 티켓 배정/재배정 (FR-23, FR-24)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { assignTicketSchema } from '@/lib/validations/ticket';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['AGENT', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const body = await parseBody(request, assignTicketSchema);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, assigneeId: true, projectId: true },
    });

    if (!ticket) {
      return errorResponse('NOT_FOUND', '티켓을 찾을 수 없습니다.', 404);
    }

    // Verify assignee is assigned to the project
    const assignment = await prisma.projectAssignment.findUnique({
      where: { projectId_agentId: { projectId: ticket.projectId, agentId: body.assigneeId } },
    });

    if (!assignment) {
      return errorResponse(
        'INVALID_ASSIGNMENT',
        '해당 담당자는 이 프로젝트에 배정되어 있지 않습니다.',
        400
      );
    }

    const previousAssignee = ticket.assigneeId;

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: { assigneeId: body.assigneeId },
      }),
      prisma.ticketStatusHistory.create({
        data: {
          ticketId: id,
          fromStatus: null,
          toStatus: 'REGISTERED', // placeholder — this is an assignment, not a status change
          changedBy: session!.user.id,
          reason: previousAssignee
            ? `재배정: ${previousAssignee} → ${body.assigneeId}`
            : `배정: ${body.assigneeId}`,
        },
      }),
    ]);

    return NextResponse.json({ data: { success: true } });
  });
}
