import { HeartPulse } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }): ReactNode {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_20px_-6px_rgb(79_70_229/0.55)]">
        <HeartPulse className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold tracking-tight text-ink">MedCare</p>
        <p className="text-[11px] font-semibold tracking-wider text-sub uppercase">
          Control Tower
        </p>
      </div>
    </div>
  );
}
