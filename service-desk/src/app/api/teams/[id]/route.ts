// Design Ref: §7 — 팀 PUT (이름 수정) + DELETE (멤버 없을 때)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

const updateTeamSchema = z.object({
  name: z.string().min(1, '팀 이름을 입력해 주세요.').max(100),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const body = updateTeamSchema.parse(await request.json());

    const team = await prisma.team.update({ where: { id }, data: body });
    return NextResponse.json({ data: team });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) return errorResponse('NOT_FOUND', '팀을 찾을 수 없습니다.', 404);

    const memberCount = await prisma.user.count({ where: { teamId: id } });
    if (memberCount > 0) {
      return errorResponse('HAS_MEMBERS', `멤버 ${memberCount}명이 있는 팀은 삭제할 수 없습니다. 먼저 멤버를 제거해 주세요.`, 409);
    }

    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  });
}
