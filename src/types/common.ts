/**
 * Cross-module shared types.
 * Centralizes types that appear in multiple parts of the codebase
 * to prevent duplication and ensure consistency.
 */

export type DataScope = 'all' | 'department' | 'self';

/** Human-readable label for each DataScope value. */
export const DATA_SCOPE_LABELS: Record<DataScope, string> = {
  all: '全部',
  department: '本部门',
  self: '仅本人',
} as const;

/** API response envelope used throughout the codebase. */
export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

/** Common pagination parameters. */
export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

/** Parsed pagination result with metadata. */
export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
