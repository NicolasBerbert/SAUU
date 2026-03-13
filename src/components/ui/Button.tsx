"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none",
          variant === "primary" &&
            "bg-accent text-background hover:bg-accent-light active:bg-accent-dark",
          variant === "secondary" &&
            "border border-border text-primary hover:border-border-hover hover:text-accent",
          variant === "ghost" &&
            "text-muted hover:text-primary",
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
