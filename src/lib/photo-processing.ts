import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import sharp from 'sharp';

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 400;

/**
 * Processes an uploaded image by validating, resizing, and saving it with a unique name.
 * @param file The image file to process.
 * @param entityId The ID of the entity (e.g., group) the image belongs to.
 * @returns The public path of the saved image.
 */
export async function processImage(file: File, entityId: number): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('No file provided.');
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error('Invalid file format. Only JPG, PNG, and WebP are allowed.');
  }

  const extension = file.type.split('/')[1];
  const filename = `${entityId}.${Date.now()}.${extension}`;
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const filepath = path.join(uploadsDir, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await sharp(buffer)
    .resize({ width: MAX_WIDTH })
    .toFile(filepath);

  return `/uploads/${filename}`;
}

/**
 * Deletes a file from the public/uploads directory.
 * @param publicPath The public path of the file to delete (e.g., /uploads/image.jpg).
 */
export async function deleteImage(publicPath: string): Promise<void> {
  if (!publicPath) return;

  try {
    const filename = path.basename(publicPath);
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await unlink(filepath);
  } catch (error) {
    // It's okay if the file doesn't exist, so we can ignore errors like ENOENT.
    console.error(`Failed to delete image: ${publicPath}`, error);
  }
}
