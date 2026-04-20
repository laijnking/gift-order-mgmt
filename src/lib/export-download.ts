export type ExportArtifactProvider = 'local' | 's3';
export type ExportDownloadStrategy = '本地下载' | '直链下载' | '按需重生成';
export type ExportDownloadActionLabel = '下载' | '直链下载' | '重新生成下载';
export type ExportDownloadHint = '将直接下载已落盘文件' | '将跳转到对象存储下载链接' | string;

export interface ExportArtifactMeta {
  provider?: ExportArtifactProvider;
  relative_path?: string;
  file_name?: string;
}

export function buildExportRecordDownloadPath(recordId: string, detailIndex?: number) {
  const basePath = `/api/export-records/${recordId}/download`;
  if (detailIndex === undefined) {
    return basePath;
  }

  return `${basePath}?detailIndex=${detailIndex}`;
}

export function isPersistedArtifact(artifact?: ExportArtifactMeta | null) {
  return Boolean(artifact?.relative_path);
}

export function isPersistedRecordUrl(fileUrl?: string | null) {
  return Boolean(fileUrl?.startsWith('/api/export-records/'));
}

export function isPersistedDownloadPath(
  recordId: string,
  fileUrl?: string | null,
  detailIndex?: number
) {
  return fileUrl === buildExportRecordDownloadPath(recordId, detailIndex);
}

export function getDownloadStrategy(
  provider?: ExportArtifactProvider,
  hasArtifact?: boolean
): ExportDownloadStrategy {
  if (!hasArtifact) {
    return '按需重生成';
  }

  if (provider === 's3') {
    return '直链下载';
  }

  return '本地下载';
}

export function getStorageProviderLabel(provider?: ExportArtifactProvider) {
  switch (provider) {
    case 's3':
      return '对象存储';
    case 'local':
    default:
      return '本地磁盘';
  }
}

export function getDownloadActionLabel(
  provider?: ExportArtifactProvider,
  hasArtifact?: boolean
): ExportDownloadActionLabel {
  const strategy = getDownloadStrategy(provider, hasArtifact);

  switch (strategy) {
    case '直链下载':
      return '直链下载';
    case '按需重生成':
      return '重新生成下载';
    case '本地下载':
    default:
      return '下载';
  }
}

export function getDownloadHint(
  provider?: ExportArtifactProvider,
  hasArtifact?: boolean,
  regenerateHint = '当前会先重新生成再下载'
): ExportDownloadHint {
  const strategy = getDownloadStrategy(provider, hasArtifact);

  switch (strategy) {
    case '直链下载':
      return '将跳转到对象存储下载链接';
    case '按需重生成':
      return regenerateHint;
    case '本地下载':
    default:
      return '将直接下载已落盘文件';
  }
}
