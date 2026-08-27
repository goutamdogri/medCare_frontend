import { mockAcknowledge, mockGet } from "@/api/mockData";

const BASE = import.meta.env.VITE_API_BASE ?? "";

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
    const body = (await response.json()) as { error?: string; message?: string };
    return new ApiError(response.status, body.message ?? body.error ?? response.statusText);
  } catch {
    return new ApiError(response.status, response.statusText);
  }
}

/** JSON body helpers that optionally attach the Bearer session token. */
function headers(withAuth: boolean, extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (withAuth) {
    const token = getAccessToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }
  return h;
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
  const response = await fetch(buildUrl(path, params), {
    signal,
    headers: headers(true),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { auth?: boolean },
): Promise<T> {
  const response = await fetch(BASE + path, {
    method: "POST",
    headers: headers(options?.auth ?? true),
    body: JSON.stringify(body),
  });
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
    headers: headers(true),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(BASE + path, {
    method: "DELETE",
    headers: headers(true),
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}
