import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      return errorResponse('NOT_FOUND', '파일을 찾을 수 없습니다.', 404);
    }

    // Dev mode: no S3 configured
    if (!process.env.S3_ACCESS_KEY_ID) {
      return NextResponse.json({
        data: {
          fileName: attachment.fileName,
          downloadUrl: '#',
          message: 'S3 미설정 (개발 모드)',
        },
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: attachment.storageKey,
    });
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ data: { fileName: attachment.fileName, downloadUrl } });
  });
}
