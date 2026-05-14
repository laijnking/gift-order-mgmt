import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type ExportArtifactProvider = 'local' | 's3';

const DEFAULT_EXPORTS_SUBDIR_FALLBACK = path.join('data', 'exports');

export interface ExportConfig {
  provider?: 'local' | 's3';
  localPath?: string;
}

function getExportArtifactRoot(config?: ExportConfig): string {
  // 优先级：数据库配置 > 环境变量 > 默认值
  if (config?.localPath) return config.localPath;
  const configured = process.env.EXPORT_ARTIFACT_DIR;
  if (configured) return configured;
  const cwd = process.cwd();
  if (cwd !== '/app') return path.join(cwd, DEFAULT_EXPORTS_SUBDIR_FALLBACK);
  return path.join('/app', DEFAULT_EXPORTS_SUBDIR_FALLBACK);
}

function getExportArtifactProvider(config?: ExportConfig): ExportArtifactProvider {
  // 优先级：数据库配置 > 环境变量
  if (config?.provider) {
    // 如果数据库配置为 s3，但环境变量没有配置 S3 bucket，则降级为 local
    if (config.provider === 's3' && !process.env.EXPORT_ARTIFACT_S3_BUCKET) {
      console.warn('数据库配置为 S3，但未配置 EXPORT_ARTIFACT_S3_BUCKET，自动降级为 local');
      return 'local';
    }
    return config.provider;
  }
  return process.env.EXPORT_ARTIFACT_PROVIDER === 's3' || process.env.EXPORT_ARTIFACT_S3_BUCKET
    ? 's3'
    : 'local';
}

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
  if (!process.env.EXPORT_ARTIFACT_S3_BUCKET) {
    throw new Error('未配置 EXPORT_ARTIFACT_S3_BUCKET，无法写入对象存储');
  }
  return process.env.EXPORT_ARTIFACT_S3_BUCKET;
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
  content: Buffer,
  config?: ExportConfig,
  tenantCode?: string
): Promise<SavedExportArtifact> {
  if (getExportArtifactProvider(config) === 's3') {
    const bucket = requireS3Bucket();
    const safeTenantCode = tenantCode ? sanitizeSegment(tenantCode) : 'default';
    const safeRecordId = sanitizeSegment(recordId);
    const safeFileName = sanitizeSegment(fileName);
    const key = `${safeTenantCode}/${safeRecordId}/${safeFileName}`;
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

  const safeTenantCode = tenantCode ? sanitizeSegment(tenantCode) : 'default';
  const safeRecordId = sanitizeSegment(recordId);
  const safeFileName = sanitizeSegment(fileName);
  const artifactRoot = getExportArtifactRoot(config);
  const directory = path.join(artifactRoot, safeTenantCode, safeRecordId);

  try {
    await mkdir(directory, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EACCES') {
      throw new Error(
        `无写入权限: 无法在 ${artifactRoot} 创建导出目录。` +
        `请设置 EXPORT_ARTIFACT_DIR 环境变量指向有写权限的路径，并确保目录已创建且可写。`
      );
    }
    throw err;
  }

  const absolutePath = path.join(directory, safeFileName);
  await writeFile(absolutePath, content);

  return {
    absolutePath,
    relativePath: path.relative(artifactRoot, absolutePath),
    downloadPath: `/api/export-records/${recordId}/download`,
    fileName,
    provider: 'local',
  };
}

export async function readExportArtifact(
  relativePath: string,
  providerOrConfig?: ExportArtifactProvider | ExportConfig
): Promise<Buffer> {
  const provider = typeof providerOrConfig === 'string' ? providerOrConfig : getExportArtifactProvider(providerOrConfig);
  const config = typeof providerOrConfig === 'object' ? providerOrConfig : undefined;
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

  const rootPath = path.resolve(getExportArtifactRoot(config));
  const normalizedPath = path.isAbsolute(relativePath)
    ? path.resolve(relativePath)
    : path.resolve(rootPath, relativePath);
  if (!normalizedPath.startsWith(rootPath)) {
    throw new Error('非法导出文件路径');
  }
  return readFile(normalizedPath);
}
