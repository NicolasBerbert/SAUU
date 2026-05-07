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
          "w-full bg-transparent border-0 border-b px-0 py-[14px] text-[15px] text-primary placeholder:text-muted/60",
          "outline-none transition-colors duration-200",
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
