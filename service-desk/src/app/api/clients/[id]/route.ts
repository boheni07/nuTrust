import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { updateClientSchema } from '@/lib/validations/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        departments: { orderBy: { name: 'asc' } },
        contacts: { include: { department: true }, orderBy: { name: 'asc' } },
        projects: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!client) {
      return errorResponse('NOT_FOUND', '고객사를 찾을 수 없습니다.', 404);
    }

    return NextResponse.json({ data: client });
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
    const body = await parseBody(request, updateClientSchema);

    const client = await prisma.client.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: client });
  });
}

// Plan SC: SC-1 — 고객사 삭제 (프로젝트 있으면 차단)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return errorResponse('NOT_FOUND', '고객사를 찾을 수 없습니다.', 404);

    const projectCount = await prisma.project.count({ where: { clientId: id } });
    if (projectCount > 0) {
      return errorResponse('HAS_PROJECTS', `연결된 프로젝트 ${projectCount}개가 있어 삭제할 수 없습니다.`, 409);
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  });
}
