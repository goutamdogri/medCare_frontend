const TOKEN_KEY = "mc-access-token";

/** Read the persisted session token (empty string when signed out). */
export function getAccessToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAccessToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function clearAccessToken(): void {
  setAccessToken("");
}
