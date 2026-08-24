import { Settings2 } from "lucide-react";

/** Debug aid (docs/frontend-spec.md cross-cutting rules) — raw JSON per widget. */
export function RawJsonToggle({ data }: { data: unknown }) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-sub transition-colors hover:text-ink">
        <Settings2 className="size-3.5" />
        JSON
      </summary>
      <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-app p-3 text-left text-[11px] leading-relaxed text-sub">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
