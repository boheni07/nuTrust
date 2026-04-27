import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { createContactSchema } from '@/lib/validations/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth();
    if (error) return error;

    const { id: clientId } = await params;
    const contacts = await prisma.contact.findMany({
      where: { clientId },
      include: { department: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: contacts });
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id: clientId } = await params;
    const body = await parseBody(request, createContactSchema);

    const contact = await prisma.contact.create({
      data: { ...body, clientId },
    });

    return NextResponse.json({ data: contact }, { status: 201 });
  });
}
