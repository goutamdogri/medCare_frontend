export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Build RFC-4180-ish CSV text from an array of row objects. */
export function toCsv(rows: Record<string, CsvCell>[], headers?: string[]): string {
  if (rows.length === 0) return "";
  const cols = headers ?? Object.keys(rows[0]);
  const head = cols.map(escapeCell).join(",");
  const body = rows.map((row) => cols.map((c) => escapeCell(row[c])).join(","));
  return [head, ...body].join("\n");
}

/** Trigger a client-side download of CSV text. */
export function downloadCsv(
  filename: string,
  rows: Record<string, CsvCell>[],
  headers?: string[],
): void {
  const blob = new Blob([`\uFEFF${toCsv(rows, headers)}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
