import { createContext, useContext } from "react";
import type { CurrentUser } from "@/types/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface SigninArgs {
  email: string;
  password: string;
}

export interface SignupArgs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  signin: (args: SigninArgs) => Promise<void>;
  signup: (args: SignupArgs) => Promise<void>;
  signout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
