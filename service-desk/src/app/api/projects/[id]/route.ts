import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { updateProjectSchema } from '@/lib/validations/project';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        assignments: {
          include: { agent: { select: { id: true, name: true, email: true, role: true } } },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!project) {
      return errorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404);
    }

    return NextResponse.json({ data: project });
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const body = await parseBody(request, updateProjectSchema);

    const project = await prisma.project.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: project });
  });
}

// Plan SC: SC-3 — 프로젝트 삭제 (티켓 있으면 차단)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return errorResponse('NOT_FOUND', '프로젝트를 찾을 수 없습니다.', 404);

    const ticketCount = await prisma.ticket.count({ where: { projectId: id } });
    if (ticketCount > 0) {
      return errorResponse('HAS_TICKETS', `연결된 티켓 ${ticketCount}개가 있어 삭제할 수 없습니다.`, 409);
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  });
}
