// Design Ref: §3.1 — 담당자 DELETE

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { contactId } = await params;

    await prisma.contact.delete({ where: { id: contactId } });
    return NextResponse.json({ data: { success: true } });
  });
}
