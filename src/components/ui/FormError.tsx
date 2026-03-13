import { cn } from "@/lib/utils";

export function FormError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p className={cn("mt-1.5 text-xs text-danger", className)}>{message}</p>
  );
}
