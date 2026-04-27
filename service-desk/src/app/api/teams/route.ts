import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1, '팀명을 입력해 주세요.'),
  leaderId: z.string().optional(),
});

export async function GET() {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['MANAGER', 'SYSTEM_ADMIN']);
    if (error) return error;

    const teams = await prisma.team.findMany({
      include: { members: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ data: teams });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const body = createTeamSchema.parse(await request.json());
    const team = await prisma.team.create({ data: body });
    return NextResponse.json({ data: team }, { status: 201 });
  });
}
