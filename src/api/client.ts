import { mockAcknowledge, mockGet } from "@/api/mockData";

const BASE = import.meta.env.VITE_API_BASE ?? "";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type QueryParam = string | number | boolean | null | undefined;

export function buildUrl(
  path: string,
  params?: Record<string, QueryParam>,
): string {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  // Relative through the Vite proxy unless an absolute base is configured.
  return BASE ? url.toString().replace(window.location.origin, BASE) : url.pathname + url.search;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { error?: string };
    return new ApiError(response.status, body.error ?? response.statusText);
  } catch {
    return new ApiError(response.status, response.statusText);
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryParam>,
  signal?: AbortSignal,
): Promise<T> {
  if (USE_MOCK_API) {
    if (signal?.aborted) throw new DOMException("The request was aborted", "AbortError");
    return mockGet(path, params) as T;
  }
  const response = await fetch(buildUrl(path, params), { signal });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  if (USE_MOCK_API && path.startsWith("/api/alerts/") && path.endsWith("/acknowledge")) {
    const id = Number(path.split("/")[3]);
    const user = typeof body === "object" && body !== null && "user" in body
      ? String((body as { user: unknown }).user)
      : "mock-user";
    return mockAcknowledge(id, user) as T;
  }
  const response = await fetch(BASE + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}
