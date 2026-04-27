import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다.'),
});

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = changePasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return errorResponse('NO_PASSWORD', '비밀번호가 설정되지 않은 계정입니다.', 400);
    }

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      return errorResponse('WRONG_PASSWORD', '현재 비밀번호가 일치하지 않습니다.', 400);
    }

    const newHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({
      where: { id: session!.user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ data: { success: true } });
  });
}
