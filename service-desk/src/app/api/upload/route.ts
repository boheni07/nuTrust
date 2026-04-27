// Design Ref: §4.1 — File upload via Presigned URL (FR-15, FR-42)
// Plan SC: SC-4 (파일 첨부 업로드/다운로드)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const presignSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, '파일 크기가 50MB를 초과합니다.'),
  mimeType: z.string().min(1),
});

const s3 = new S3Client({
  region: process.env.S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = presignSchema.parse(await request.json());

    const storageKey = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${body.fileName}`;

    // If S3 is not configured, return a mock response for development
    let presignedUrl: string;
    if (!process.env.S3_ACCESS_KEY_ID) {
      presignedUrl = `/api/upload/mock?key=${encodeURIComponent(storageKey)}`;
    } else {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        ContentType: body.mimeType,
        ContentLength: body.fileSize,
      });
      presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        fileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        storageKey,
        uploadedById: session!.user.id,
      },
    });

    return NextResponse.json({
      data: {
        attachmentId: attachment.id,
        presignedUrl,
        storageKey,
      },
    });
  });
}
