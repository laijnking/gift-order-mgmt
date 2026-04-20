import { readFile } from 'fs/promises';
import path from 'path';
import {
  buildExportRecordDownloadPath,
  getDownloadStrategy,
  isPersistedArtifact,
  isPersistedDownloadPath,
  isPersistedRecordUrl,
  type ExportArtifactMeta,
} from '@/lib/export-download';

interface RecordFixture {
  file_url?: string;
  metadata?: {
    artifact?: ExportArtifactMeta;
  };
}

interface DetailFixture {
  fileName?: string;
  fileUrl?: string;
  artifact?: ExportArtifactMeta;
}

interface FixtureCase {
  name: string;
  recordId: string;
  record: RecordFixture;
  details: DetailFixture[];
  expected: {
    recordPersisted: boolean;
    recordStrategy: '本地下载' | '直链下载' | '按需重生成';
    detailPersisted: boolean[];
    detailStrategies: Array<'本地下载' | '直链下载' | '按需重生成'>;
    recordDownloadPath?: string;
    detailDownloadPaths?: Array<string | null>;
  };
}

interface FixtureFile {
  cases: FixtureCase[];
}

async function main() {
  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'export-records', 'export-records-basic.json');
  const raw = await readFile(fixturePath, 'utf8');
  const fixture = JSON.parse(raw) as FixtureFile;

  let failed = 0;

  for (const testCase of fixture.cases) {
    const actualRecordPersisted = isPersistedRecordUrl(testCase.record.file_url);
    const actualDetailPersisted = testCase.details.map((detail) => isPersistedArtifact(detail.artifact));
    const actualRecordStrategy = getDownloadStrategy(
      testCase.record.metadata?.artifact?.provider,
      isPersistedArtifact(testCase.record.metadata?.artifact)
    );
    const actualDetailStrategies = testCase.details.map((detail) =>
      getDownloadStrategy(detail.artifact?.provider, isPersistedArtifact(detail.artifact))
    );
    const actualRecordDownloadPath = isPersistedDownloadPath(testCase.recordId, testCase.record.file_url)
      ? buildExportRecordDownloadPath(testCase.recordId)
      : null;
    const actualDetailDownloadPaths = testCase.details.map((detail, detailIndex) =>
      isPersistedDownloadPath(testCase.recordId, detail.fileUrl, detailIndex)
        ? buildExportRecordDownloadPath(testCase.recordId, detailIndex)
        : null
    );

    const recordMatched = actualRecordPersisted === testCase.expected.recordPersisted;
    const recordStrategyMatched = actualRecordStrategy === testCase.expected.recordStrategy;
    const detailMatched =
      actualDetailPersisted.length === testCase.expected.detailPersisted.length &&
      actualDetailPersisted.every((value, index) => value === testCase.expected.detailPersisted[index]);
    const detailStrategyMatched =
      actualDetailStrategies.length === testCase.expected.detailStrategies.length &&
      actualDetailStrategies.every((value, index) => value === testCase.expected.detailStrategies[index]);
    const recordDownloadPathMatched =
      testCase.expected.recordDownloadPath === undefined ||
      actualRecordDownloadPath === testCase.expected.recordDownloadPath;
    const detailDownloadPathMatched =
      testCase.expected.detailDownloadPaths === undefined ||
      (actualDetailDownloadPaths.length === testCase.expected.detailDownloadPaths.length &&
        actualDetailDownloadPaths.every((value, index) => value === testCase.expected.detailDownloadPaths?.[index]));

    if (!recordMatched || !recordStrategyMatched || !detailMatched || !detailStrategyMatched || !recordDownloadPathMatched || !detailDownloadPathMatched) {
      failed += 1;
      console.error(`FAIL ${testCase.name}`);
      console.error(`  expected recordPersisted=${testCase.expected.recordPersisted}, got ${actualRecordPersisted}`);
      console.error(`  expected recordStrategy=${testCase.expected.recordStrategy}, got ${actualRecordStrategy}`);
      console.error(`  expected detailPersisted=${JSON.stringify(testCase.expected.detailPersisted)}, got ${JSON.stringify(actualDetailPersisted)}`);
      console.error(`  expected detailStrategies=${JSON.stringify(testCase.expected.detailStrategies)}, got ${JSON.stringify(actualDetailStrategies)}`);
      if (testCase.expected.recordDownloadPath !== undefined) {
        console.error(`  expected recordDownloadPath=${testCase.expected.recordDownloadPath}, got ${actualRecordDownloadPath}`);
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

  console.log(`All ${fixture.cases.length} export-record fixture cases passed.`);
}

void main();
