export function normalizeExcelSheetRows(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return rows
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    // 过滤完全为空的行（避免 XLSX 残留的格式化工件行被当作数据行）
    .filter((row) => row.some((cell) => cell.length > 0));
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
