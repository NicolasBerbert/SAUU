"use client";

interface Props {
  href: string;
  label: string;
}

export function ExportButton({ href, label }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 text-[10px] uppercase tracking-widest px-4 py-2 border border-border text-muted hover:border-accent hover:text-accent transition-colors"
    >
      {label}
    </a>
  );
}
