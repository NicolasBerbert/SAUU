import { cn } from "@/lib/utils";
import { LabelHTMLAttributes } from "react";

export function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-[10.5px] uppercase tracking-[0.26em] text-muted mb-2",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
