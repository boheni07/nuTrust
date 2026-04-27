// Design Ref: §4.1 — 댓글 (공개 댓글 / 내부 메모 분리)
// Plan FR-40, FR-41, FR-42

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { commentSchema } from '@/lib/validations/ticket';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id: ticketId } = await params;
    const isInternalUser = session!.user.role !== 'CUSTOMER';

    const comments = await prisma.comment.findMany({
      where: {
        ticketId,
        // Customers can only see PUBLIC comments
        ...(isInternalUser ? {} : { type: 'PUBLIC' }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, role: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ data: comments });
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { id: ticketId } = await params;
    const body = await parseBody(request, commentSchema);

    // Customers can only create PUBLIC comments
    const type = session!.user.role === 'CUSTOMER' ? 'PUBLIC' : body.type;

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          ticketId,
          authorId: session!.user.id,
          type,
          content: body.content,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });

      // Link attachments
      if (body.attachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: { id: { in: body.attachmentIds } },
          data: { commentId: created.id },
        });
      }

      return created;
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  });
}
