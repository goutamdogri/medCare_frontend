import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/api/client";
import type { AuthResponse, CurrentUser, MeResponse } from "@/types/api";

export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me"],
    enabled,
    retry: false,
    staleTime: Infinity,
    queryFn: ({ signal }) => apiGet<MeResponse>("/api/auth/me", undefined, signal),
  });
}

export function useSigninMutation() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiPost<AuthResponse>("/api/auth/signin", input, { auth: false }),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => apiPost<AuthResponse>("/api/auth/signup", input, { auth: false }),
  });
}

/** Expected current-user shape used to satisfy callers before a token exists. */
export type { CurrentUser };
