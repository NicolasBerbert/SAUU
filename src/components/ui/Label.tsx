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
        "block text-xs font-medium uppercase tracking-widest text-muted mb-2",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
