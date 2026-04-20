import { readFile } from 'fs/promises';
import path from 'path';
import {
  buildExportRecordDownloadPath,
  isPersistedArtifact,
  isPersistedDownloadPath,
  isPersistedRecordUrl,
  type ExportArtifactMeta,
} from '@/lib/export-download';

interface ExportResultDetailFixture {
  fileName?: string;
  fileUrl?: string;
  templateSource?: string;
  artifact?: ExportArtifactMeta;
}

interface ExportResultFixture {
  zipFileName?: string;
  zipFileUrl?: string;
  templateSource?: string;
  artifact?: ExportArtifactMeta;
  details?: ExportResultDetailFixture[];
}

interface FixtureCase {
  name: string;
  recordId: string;
  response: ExportResultFixture;
  expected: {
    hasZip: boolean;
    hasPersistedArtifact: boolean;
    detailCount: number;
    persistedDetailCount: number;
    templateSource?: string;
    zipDownloadPath?: string | null;
    detailDownloadPaths?: Array<string | null>;
  };
}

interface FixtureFile {
  cases: FixtureCase[];
}

async function main() {
  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'export-results', 'export-results-basic.json');
  const raw = await readFile(fixturePath, 'utf8');
  const fixture = JSON.parse(raw) as FixtureFile;

  let failed = 0;

  for (const testCase of fixture.cases) {
    const actualHasZip =
      Boolean(testCase.response.zipFileName) &&
      isPersistedRecordUrl(testCase.response.zipFileUrl);
    const actualHasPersistedArtifact = isPersistedArtifact(testCase.response.artifact);
    const actualDetailCount = testCase.response.details?.length || 0;
    const actualPersistedDetailCount =
      testCase.response.details?.filter((detail) => isPersistedArtifact(detail.artifact)).length || 0;
    const actualZipDownloadPath = isPersistedDownloadPath(testCase.recordId, testCase.response.zipFileUrl)
      ? buildExportRecordDownloadPath(testCase.recordId)
      : null;
    const actualDetailDownloadPaths =
      testCase.response.details?.map((detail, detailIndex) =>
        isPersistedDownloadPath(testCase.recordId, detail.fileUrl, detailIndex)
          ? buildExportRecordDownloadPath(testCase.recordId, detailIndex)
          : null
      ) || [];

    const matched =
      actualHasZip === testCase.expected.hasZip &&
      actualHasPersistedArtifact === testCase.expected.hasPersistedArtifact &&
      actualDetailCount === testCase.expected.detailCount &&
      actualPersistedDetailCount === testCase.expected.persistedDetailCount &&
      (testCase.expected.templateSource === undefined || testCase.response.templateSource === testCase.expected.templateSource) &&
      (testCase.expected.zipDownloadPath === undefined || actualZipDownloadPath === testCase.expected.zipDownloadPath) &&
      (testCase.expected.detailDownloadPaths === undefined ||
        (actualDetailDownloadPaths.length === testCase.expected.detailDownloadPaths.length &&
          actualDetailDownloadPaths.every((value, index) => value === testCase.expected.detailDownloadPaths?.[index])));

    if (!matched) {
      failed += 1;
      console.error(`FAIL ${testCase.name}`);
      console.error(`  expected hasZip=${testCase.expected.hasZip}, got ${actualHasZip}`);
      console.error(`  expected hasPersistedArtifact=${testCase.expected.hasPersistedArtifact}, got ${actualHasPersistedArtifact}`);
      console.error(`  expected detailCount=${testCase.expected.detailCount}, got ${actualDetailCount}`);
      console.error(`  expected persistedDetailCount=${testCase.expected.persistedDetailCount}, got ${actualPersistedDetailCount}`);
      if (testCase.expected.templateSource !== undefined) {
        console.error(`  expected templateSource=${testCase.expected.templateSource}, got ${testCase.response.templateSource}`);
      }
      if (testCase.expected.zipDownloadPath !== undefined) {
        console.error(`  expected zipDownloadPath=${testCase.expected.zipDownloadPath}, got ${actualZipDownloadPath}`);
      }
      if (testCase.expected.detailDownloadPaths !== undefined) {
        console.error(`  expected detailDownloadPaths=${JSON.stringify(testCase.expected.detailDownloadPaths)}, got ${JSON.stringify(actualDetailDownloadPaths)}`);
      }
      continue;
    }

    console.log(`PASS ${testCase.name}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All ${fixture.cases.length} export-result fixture cases passed.`);
}

void main();
