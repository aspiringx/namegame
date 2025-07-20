import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from 'process';

// This client is separate from the one in storage.ts to avoid circular dependencies
// and to be used specifically for the image proxy route.
const s3Client = new S3Client({
  region: env.DO_SPACES_REGION!,
  endpoint: env.DO_SPACES_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.DO_SPACES_KEY!,
    secretAccessKey: env.DO_SPACES_SECRET!,
  },
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    // If not authenticated, return a 401 Unauthorized response
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // The 'key' parameter might contain other query params if the original URL had them.
  // We only want the pathname part of the key.
  const keyParam = searchParams.get('key');
  const key = keyParam ? new URL(keyParam, 'http://localhost').pathname.replace(/^\//, '') : null;

  if (!key) {
    return new NextResponse('Missing image key', { status: 400 });
  }

  const command = new GetObjectCommand({
    Bucket: env.DO_SPACES_BUCKET!,
    Key: key,
  });

  try {
    const { Body, ContentType } = await s3Client.send(command);

    if (!Body) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // The Body from S3 is a ReadableStream. We can stream it directly.
    const response = new NextResponse(Body as any, {
      headers: {
        'Content-Type': ContentType || 'application/octet-stream',
        // Cache the image in the user's browser for 1 hour
        'Cache-Control': 'private, max-age=3600',
      },
    });

    return response;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return new NextResponse('Image not found', { status: 404 });
    }
    console.error('Error fetching image from S3:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
