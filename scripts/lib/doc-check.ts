import { readFile } from 'fs/promises';

export async function verifyRequiredDocMarkers(docPath: string, markers: string[], label: string) {
  const content = await readFile(docPath, 'utf8');
  const missing = markers.filter((marker) => !content.includes(marker));

  if (missing.length > 0) {
    throw new Error(`${label}缺少必要章节: ${missing.join(', ')}`);
  }
}
