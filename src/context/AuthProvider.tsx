import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/api/auth-token";
import {
  AuthContext,
  type AuthStatus,
  type SigninArgs,
  type SignupArgs,
} from "@/context/auth-context";
import { useCurrentUser, useSigninMutation, useSignupMutation } from "@/hooks/auth";
import type { CurrentUser } from "@/types/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  // User set directly after a fresh sign-in/sign-up (no /me round-trip needed).
  // On a cold boot this stays null and the profile is restored via the /me query.
  const [freshUser, setFreshUser] = useState<CurrentUser | null>(null);

  const hasToken = Boolean(getAccessToken());
  const meQuery = useCurrentUser(hasToken);
  const signinMutation = useSigninMutation();
  const signupMutation = useSignupMutation();

  const persistSession = useCallback((token: string, profile: CurrentUser) => {
    setAccessToken(token);
    setFreshUser(profile);
  }, []);

  const signin = useCallback(
    async (args: SigninArgs) => {
      const res = await signinMutation.mutateAsync(args);
      persistSession(res.token, res.user);
    },
    [signinMutation, persistSession],
  );

  const signup = useCallback(
    async (args: SignupArgs) => {
      const res = await signupMutation.mutateAsync(args);
      persistSession(res.token, res.user);
    },
    [signupMutation, persistSession],
  );

  const signout = useCallback(() => {
    clearAccessToken();
    setFreshUser(null);
  }, []);

  const { status, user } = useMemo<{ status: AuthStatus; user: CurrentUser | null }>(() => {
    if (freshUser) return { status: "authenticated", user: freshUser };
    if (!hasToken) return { status: "unauthenticated", user: null };
    if (meQuery.isLoading) return { status: "loading", user: null };
    if (meQuery.isError) return { status: "unauthenticated", user: null };
    if (meQuery.isSuccess) return { status: "authenticated", user: meQuery.data.user };
    return { status: "loading", user: null };
  }, [freshUser, hasToken, meQuery.isLoading, meQuery.isError, meQuery.isSuccess, meQuery.data]);

  const value = useMemo(
    () => ({ status, user, signin, signup, signout }),
    [status, user, signin, signup, signout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
