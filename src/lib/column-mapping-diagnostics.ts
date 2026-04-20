export interface ColumnMappingDiagnostics {
  totalHeaderCount: number;
  nonEmptyHeaderCount: number;
  mappedColumnCount: number;
  ignoredColumnCount: number;
  extensionColumnCount: number;
  recognizedFieldCount: number;
  coverageRate: number;
  conflictFields: string[];
  unrecognizedHeaders: string[];
}

export function getColumnMappingDiagnostics(
  headers: string[],
  mapping: Record<string, string>
): ColumnMappingDiagnostics {
  const normalizedHeaders = headers.map((header) => String(header ?? '').trim());
  const effectiveEntries = Object.entries(mapping).filter(([, field]) => Boolean(field));

  const mappedEntries = effectiveEntries.filter(([, field]) => field !== 'ignore');
  const ignoredEntries = effectiveEntries.filter(([, field]) => field === 'ignore');
  const extensionEntries = effectiveEntries.filter(([, field]) => field.startsWith('ext_field_') || field === 'ext_keep');
  const recognizedEntries = effectiveEntries.filter(([, field]) => (
    field !== 'ignore' && field !== 'ext_keep' && !field.startsWith('ext_field_')
  ));

  const conflictFields = recognizedEntries.reduce<string[]>((duplicates, [, field], index, entries) => {
    const firstIndex = entries.findIndex(([, candidate]) => candidate === field);
    if (firstIndex !== index && !duplicates.includes(field)) {
      duplicates.push(field);
    }
    return duplicates;
  }, []);

  const unrecognizedHeaders = normalizedHeaders.filter((header, index) => {
    const field = mapping[String(index)];
    return Boolean(header) && (!field || field === 'ignore' || field === 'ext_keep' || field.startsWith('ext_field_'));
  });

  const nonEmptyHeaderCount = normalizedHeaders.filter(Boolean).length;
  const coverageRate = nonEmptyHeaderCount === 0
    ? 0
    : Math.round((recognizedEntries.length / nonEmptyHeaderCount) * 100);

  return {
    totalHeaderCount: normalizedHeaders.length,
    nonEmptyHeaderCount,
    mappedColumnCount: mappedEntries.length,
    ignoredColumnCount: ignoredEntries.length,
    extensionColumnCount: extensionEntries.length,
    recognizedFieldCount: recognizedEntries.length,
    coverageRate,
    conflictFields,
    unrecognizedHeaders,
  };
}
