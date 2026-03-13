"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-surface-2 border px-4 py-3 text-sm text-primary placeholder:text-muted",
          "outline-none transition-colors duration-150",
          "border-border focus:border-accent",
          error && "border-danger focus:border-danger",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
