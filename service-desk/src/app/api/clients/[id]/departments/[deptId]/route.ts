// Design Ref: §3.1 — 부서 DELETE (담당자 있으면 차단)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { deptId } = await params;

    const contactCount = await prisma.contact.count({ where: { departmentId: deptId } });
    if (contactCount > 0) {
      return errorResponse('HAS_CONTACTS', `담당자 ${contactCount}명이 있는 부서는 삭제할 수 없습니다.`, 409);
    }

    await prisma.department.delete({ where: { id: deptId } });
    return NextResponse.json({ data: { success: true } });
  });
}
