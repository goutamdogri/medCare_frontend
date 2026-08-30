import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  HeartPulse,
  Package
} from "lucide-react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/auth-context";
import { useToasts } from "@/context/toast-context";

type Mode = "signin" | "signup";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(mode: Mode, fields: Fields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (mode === "signup" && fields.name.trim().length < 2) {
    errors.name = "Please enter your full name";
  }
  if (!EMAIL_REGEX.test(fields.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  if (mode === "signup" && fields.password !== fields.confirm) {
    errors.confirm = "Passwords do not match";
  }
  return errors;
}

function messageFor(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

interface Fields {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

const INITIAL: Fields = { name: "", email: "", password: "", confirm: "" };

import AnimatedBackground from "./AnimatedBackground";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [workspace, setWorkspace] = useState("MedCare");
  
  const navigate = useNavigate();
  const { success, error } = useToasts();
  const { signin, signup } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "signin") {
        await signin({ email: fields.email.trim(), password: fields.password });
      } else {
        await signup({
          name: fields.name.trim(),
          email: fields.email.trim(),
          password: fields.password,
          confirmPassword: fields.confirm,
        });
      }
    },
  });

  const errors = useMemo(() => validate(mode, fields), [mode, fields]);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      error(Object.values(errors)[0]);
      return;
    }
    mutation.mutate(undefined, {
      onSuccess: () => {
        success(mode === "signin" ? "Welcome back" : "Account created — welcome");
        if (workspace === "MedCare") {
            navigate("/", { replace: true });
        } else {
            window.location.href = import.meta.env.VITE_E1_FRONTEND_URL || "http://localhost:5173";
        }
      },
      onError: (err) => error(messageFor(err, "Something went wrong")),
    });
  };

  const isLogin = mode === "signin";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-app lg:flex-row">
      <BrandPanel />
      
      {/* Right Side */}
      <section className="flex flex-1 items-center justify-center overflow-hidden bg-white px-6 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isLogin
                ? "Sign in to manage your control tower."
                : "Start managing your supply chain smarter."}
            </p>
          </div>

          {/* Workspace Toggle */}
          <div className="mb-4 flex rounded-2xl bg-gray-50/50 p-1 border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <button
              type="button"
              onClick={() => setWorkspace("MedCare")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl p-2 transition-all duration-300 ${
                workspace === "MedCare"
                  ? "bg-[#5B5EFE] text-white shadow-md shadow-indigo-200"
                  : "hover:bg-white text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${workspace === 'MedCare' ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                <HeartPulse className="h-4 w-4" />
              </div>
              <div className="text-left leading-tight overflow-hidden">
                <p className={`text-xs md:text-sm font-bold whitespace-nowrap truncate ${workspace === 'MedCare' ? 'text-white' : 'text-gray-900'}`}>Planning Manager</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setWorkspace("E1");
                window.location.href = import.meta.env.VITE_E1_FRONTEND_URL || "http://localhost:5173";
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl p-2 transition-all duration-300 ${
                workspace === "E1"
                  ? "bg-[#5B5EFE] text-white shadow-md shadow-indigo-200"
                  : "hover:bg-white text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${workspace === 'E1' ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                <Package className="h-4 w-4" />
              </div>
              <div className="text-left leading-tight overflow-hidden">
                <p className={`text-xs md:text-sm font-bold whitespace-nowrap truncate ${workspace === 'E1' ? 'text-white' : 'text-gray-900'}`}>Inventory Manager</p>
              </div>
            </button>
          </div>
          
          <p className="mb-4 text-xs text-gray-500">Choose the workspace you want to open after signing in.</p>

          {mutation.isError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
              {messageFor(mutation.error, "Something went wrong")}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-3.5">
            {/* Name - Signup only */}
            {!isLogin && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={fields.name}
                  onChange={set("name")}
                  required={!isLogin}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={fields.email}
                onChange={set("email")}
                required
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-800">
                  Password
                </label>

                {isLogin && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                value={fields.password}
                onChange={set("password")}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Confirm Password - Signup only */}
            {!isLogin && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={fields.confirm}
                  onChange={set("confirm")}
                  required={!isLogin}
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            )}

            {/* Remember me */}
            {isLogin && (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-gray-300 accent-indigo-600"
                />
                <span className="text-xs text-gray-500">
                  Keep me signed in for 30 days
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {mutation.isPending ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            <span className="font-bold">G</span>
            Continue with Google
          </button>

          {/* Bottom toggle */}
          <p className="mt-5 text-center text-xs text-gray-500">
            {isLogin
              ? "Don't have a MedCare account?"
              : "Already have a MedCare account?"}
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? "signup" : "signin");
                setFields(INITIAL);
              }}
              className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>

          {/* Security */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <span className="text-green-500">✓</span>
            Your data is encrypted and secure
          </div>
        </div>
      </section>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden w-[46%] max-w-[560px] overflow-hidden bg-indigo-600 lg:block">
      <div className="relative h-full overflow-hidden bg-[#4c3df5]">
        <AnimatedBackground />

        {/* Hero Content Layer */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Header */}
          <div className="flex items-center gap-3 text-white">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <HeartPulse className="size-6" />
            </span>
            <div className="leading-tight">
              <p className="text-2xl font-extrabold tracking-tight">MedCare</p>
              <p className="text-sm font-semibold tracking-wider text-white/70 uppercase">
                Control Tower
              </p>
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-semibold text-white/85 backdrop-blur-sm">
              Demand sensing · Expiry-aware planning
            </div>
            <h1 className="text-5xl leading-[1.15] font-extrabold tracking-tight text-white">
              Pharmacy supply chain,
              <br />
              reimagined.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/80">
              A single control tower that senses demand, prevents shortages and
              rescues expiring stock — in real time.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm font-medium text-white/60">
            © {new Date().getFullYear()} MedCare Pharma Supply Chain · Control Tower
          </p>
        </div>
      </div>
    </aside>
  );
}
