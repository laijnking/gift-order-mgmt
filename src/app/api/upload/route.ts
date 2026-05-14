import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: '请选择文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: '仅支持 PNG、JPEG、WebP 格式' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: '文件大小不能超过 2MB' }, { status: 400 });
    }

    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/logos/${filename}`;

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error('Logo upload failed:', error);
    return NextResponse.json(
      { success: false, error: '上传失败' },
      { status: 500 },
    );
  }
}
