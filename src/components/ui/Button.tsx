"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "link";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2.5 text-[11px] uppercase tracking-[0.24em] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none whitespace-nowrap",
          variant === "primary" &&
            "bg-accent text-background px-[22px] py-[14px] border border-transparent hover:bg-accent-dark hover:-translate-y-px",
          variant === "secondary" &&
            "bg-transparent text-primary px-[22px] py-[14px] border border-border hover:border-accent hover:text-accent",
          variant === "ghost" &&
            "bg-transparent text-primary px-[22px] py-[14px] border border-border hover:border-accent hover:text-accent",
          variant === "link" &&
            "p-0 border-0 border-b border-current pb-1 text-[12px] tracking-[0.2em] hover:text-accent",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
