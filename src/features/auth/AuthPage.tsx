import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Lock,
} from "lucide-react";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { useToasts } from "@/context/toast-context";
import { cn } from "@/lib/cn";

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

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
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

  const set = (key: keyof Fields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      error("Please fix the highlighted fields");
      return;
    }
    mutation.mutate(undefined, {
      onSuccess: () => {
        success(mode === "signin" ? "Welcome back" : "Account created — welcome");
        navigate("/", { replace: true });
      },
      onError: (err) => error(messageFor(err, "Something went wrong")),
    });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setFields(INITIAL);
    mutation.reset();
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-app lg:flex-row">
      <BrandPanel />
      <div className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLockup />
          </div>

          <div className="rounded-3xl border border-line bg-card/80 p-6 shadow-card backdrop-blur-xl sm:p-9">
            <div className="mb-8 flex rounded-2xl bg-app p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                    mode === m
                      ? "bg-card text-ink shadow-sm"
                      : "text-sub hover:text-ink",
                  )}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              {mode === "signin" ? "Welcome back" : "Join the control tower"}
            </h2>
            <p className="mt-1.5 text-sm text-sub">
              {mode === "signin"
                ? "Sign in to your workspace to continue."
                : "Create an account to start planning your supply chain."}
            </p>

            <form onSubmit={submit} noValidate className="mt-8 space-y-5">
              {mode === "signup" && (
                <Field
                  label="Full name"
                  icon={<UserIcon className="size-[18px]" />}
                  value={fields.name}
                  error={errors.name}
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  onChange={set("name")}
                />
              )}

              <Field
                label="Email"
                type="email"
                icon={<Mail className="size-[18px]" />}
                value={fields.email}
                error={errors.email}
                autoComplete="email"
                placeholder="you@company.com"
                onChange={set("email")}
              />

              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={<Lock className="size-[18px]" />}
                value={fields.password}
                error={errors.password}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder={mode === "signin" ? "••••••••" : "8+ characters"}
                onChange={set("password")}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-sub transition-colors hover:text-ink"
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                }
              />

              {mode === "signup" && (
                <Field
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  icon={<Lock className="size-[18px]" />}
                  value={fields.confirm}
                  error={errors.confirm}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  onChange={set("confirm")}
                />
              )}

              <Button
                type="submit"
                className="w-full py-3 text-[15px]"
                loading={mutation.isPending}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
                {!mutation.isPending && <ArrowRight className="size-4" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-sub">
              {mode === "signin" ? "New to MedCare?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                className="font-semibold text-primary hover:text-primary-strong"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-sub">
            <ShieldCheck className="size-3.5 text-accent" />
            Protected with encrypted credentials
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  error,
  trailing,
  className,
  ...rest
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  trailing?: React.ReactNode;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const hasError = Boolean(error);
  const id = useMemo(() => `field-${label.toLowerCase().replace(/\W+/g, "-")}`, [label]);
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block pl-1 text-xs font-semibold tracking-wide uppercase",
          hasError ? "text-danger" : "text-sub",
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border bg-card-subtle px-4 transition-all",
          "focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10",
          hasError
            ? "border-danger/70 focus-within:border-danger focus-within:ring-danger/10"
            : "border-line",
        )}
      >
        <span className={cn("text-sub", hasError && "text-danger")}>{icon}</span>
        <input
          {...rest}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent text-sm font-medium text-ink placeholder:font-normal placeholder:text-sub/70 focus:outline-none"
        />
        {trailing}
      </div>
      {hasError && (
        <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-xs font-medium text-danger">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_20px_-6px_rgb(79_70_229/0.55)]">
        <HeartPulse className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="text-lg font-extrabold tracking-tight text-ink">MedCare</p>
        <p className="text-[11px] font-semibold tracking-wider text-sub uppercase">
          Control Tower
        </p>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden w-[46%] max-w-[560px] overflow-hidden lg:block">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-strong to-secondary" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgb(255 255 255 / 0.35) 0%, transparent 40%), radial-gradient(circle at 80% 30%, rgb(139 92 246 / 0.7) 0%, transparent 45%), radial-gradient(circle at 50% 90%, rgb(20 184 166 / 0.5) 0%, transparent 40%)",
        }}
      />
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-black/20 blur-2xl" />

      <div className="relative flex h-full flex-col justify-between p-12">
        <div className="flex items-center gap-3 text-white">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <HeartPulse className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight">MedCare</p>
            <p className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">
              Control Tower
            </p>
          </div>
        </div>

        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Demand sensing · Expiry-aware planning
          </div>
          <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight text-white">
            Pharmacy supply chain,
            <br />
            reimagined.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">
            A single control tower that senses demand, prevents shortages and
            rescues expiring stock — in real time.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Real-time shortage & expiry watchlists",
              "Probabilistic demand forecasting",
              "Expiry-aware stock transfers",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/90">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
                  <ShieldCheck className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs font-medium text-white/60">
          © {new Date().getFullYear()} MedCare Pharma Supply Chain · Control Tower
        </p>
      </div>
    </aside>
  );
}
