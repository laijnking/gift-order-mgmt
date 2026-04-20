import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type ExportArtifactProvider = 'local' | 's3';

const EXPORT_ARTIFACT_ROOT = path.resolve(
  process.env.EXPORT_ARTIFACT_DIR || path.join(process.cwd(), 'data', 'exports')
);
const EXPORT_ARTIFACT_PROVIDER: ExportArtifactProvider =
  process.env.EXPORT_ARTIFACT_PROVIDER === 's3' || process.env.EXPORT_ARTIFACT_S3_BUCKET
    ? 's3'
    : 'local';
const EXPORT_ARTIFACT_S3_BUCKET = process.env.EXPORT_ARTIFACT_S3_BUCKET;
const EXPORT_ARTIFACT_SIGNED_URL_TTL = Number(process.env.EXPORT_ARTIFACT_SIGNED_URL_TTL || '900');

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface SavedExportArtifact {
  absolutePath: string;
  relativePath: string;
  downloadPath: string;
  fileName: string;
  provider: ExportArtifactProvider;
}

export interface ExportArtifactDownloadTarget {
  type: 'redirect' | 'proxy';
  url?: string;
}

function createS3Client() {
  return new S3Client({
    region: process.env.EXPORT_ARTIFACT_S3_REGION || 'auto',
    endpoint: process.env.EXPORT_ARTIFACT_S3_ENDPOINT || undefined,
    forcePathStyle: process.env.EXPORT_ARTIFACT_S3_FORCE_PATH_STYLE === 'true',
    credentials:
      process.env.EXPORT_ARTIFACT_S3_ACCESS_KEY_ID && process.env.EXPORT_ARTIFACT_S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.EXPORT_ARTIFACT_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.EXPORT_ARTIFACT_S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

function requireS3Bucket() {
  if (!EXPORT_ARTIFACT_S3_BUCKET) {
    throw new Error('未配置 EXPORT_ARTIFACT_S3_BUCKET，无法写入对象存储');
  }
  return EXPORT_ARTIFACT_S3_BUCKET;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function getExportArtifactDownloadTarget(
  relativePath: string,
  provider: ExportArtifactProvider,
  fileName: string,
  contentType: string
): Promise<ExportArtifactDownloadTarget> {
  if (provider !== 's3') {
    return { type: 'proxy' };
  }

  const bucket = requireS3Bucket();
  const client = createS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: relativePath,
    ResponseContentType: contentType,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  const signedUrl = await getSignedUrl(client as never, command as never, {
    expiresIn: Number.isFinite(EXPORT_ARTIFACT_SIGNED_URL_TTL) ? EXPORT_ARTIFACT_SIGNED_URL_TTL : 900,
  });

  return { type: 'redirect', url: signedUrl };
}

export async function saveExportArtifact(
  recordId: string,
  fileName: string,
  content: Buffer
): Promise<SavedExportArtifact> {
  if (EXPORT_ARTIFACT_PROVIDER === 's3') {
    const bucket = requireS3Bucket();
    const safeRecordId = sanitizeSegment(recordId);
    const safeFileName = sanitizeSegment(fileName);
    const key = `${safeRecordId}/${safeFileName}`;
    const client = createS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: 'application/zip',
      })
    );

    return {
      absolutePath: '',
      relativePath: key,
      downloadPath: `/api/export-records/${recordId}/download`,
      fileName,
      provider: 's3',
    };
  }

  const safeRecordId = sanitizeSegment(recordId);
  const safeFileName = sanitizeSegment(fileName);
  const directory = path.join(EXPORT_ARTIFACT_ROOT, safeRecordId);
  await mkdir(directory, { recursive: true });

  const absolutePath = path.join(directory, safeFileName);
  await writeFile(absolutePath, content);

  return {
    absolutePath,
    relativePath: path.relative(process.cwd(), absolutePath),
    downloadPath: `/api/export-records/${recordId}/download`,
    fileName,
    provider: 'local',
  };
}

export async function readExportArtifact(
  relativePath: string,
  provider: ExportArtifactProvider = EXPORT_ARTIFACT_PROVIDER
): Promise<Buffer> {
  if (provider === 's3') {
    const bucket = requireS3Bucket();
    const client = createS3Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: relativePath,
      })
    );

    if (!response.Body) {
      throw new Error('对象存储中的导出文件不存在');
    }

    return streamToBuffer(response.Body as NodeJS.ReadableStream);
  }

  const normalizedPath = path.resolve(process.cwd(), relativePath);
  const rootPath = path.resolve(EXPORT_ARTIFACT_ROOT);
  if (!normalizedPath.startsWith(rootPath)) {
    throw new Error('非法导出文件路径');
  }
  return readFile(normalizedPath);
}
