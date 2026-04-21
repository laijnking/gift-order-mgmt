export function normalizeExcelSheetRows(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return rows.map((row) => row.map((cell) => String(cell ?? '')));
}

export function buildExcelPreviewRows(rows: string[][], limit = 20) {
  return rows.slice(0, limit);
}

export function resolveExcelParseSourceRows(allRows: string[][], previewRows: string[][]) {
  return allRows.length > 0 ? allRows : previewRows;
}

export function resolveExcelParsePayload(
  allRows: string[][],
  previewRows: string[][],
  headerRow: number
) {
  const sourceRows = resolveExcelParseSourceRows(allRows, previewRows);
  const safeHeaderRow = Math.max(0, headerRow);

  return {
    sourceRows,
    headers: sourceRows[safeHeaderRow] || [],
    dataRows: sourceRows.slice(safeHeaderRow + 1),
  };
}
