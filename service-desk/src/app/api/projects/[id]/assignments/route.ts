// Design Ref: §4.1 — Project Assignment (프로젝트별 지원팀/담당자 사전 배정)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { createAssignmentSchema } from '@/lib/validations/project';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id: projectId } = await params;
    const body = await parseBody(request, createAssignmentSchema);

    const assignment = await prisma.projectAssignment.create({
      data: { projectId, ...body },
      include: { agent: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ data: assignment }, { status: 201 });
  });
}
