import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id: projectId, agentId } = await params;

    const existing = await prisma.projectAssignment.findUnique({
      where: { projectId_agentId: { projectId, agentId } },
    });

    if (!existing) {
      return errorResponse('NOT_FOUND', '배정 정보를 찾을 수 없습니다.', 404);
    }

    await prisma.projectAssignment.delete({
      where: { projectId_agentId: { projectId, agentId } },
    });

    return NextResponse.json({ data: { success: true } });
  });
}
