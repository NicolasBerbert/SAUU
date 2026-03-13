import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header minimalista */}
      <header className="border-b border-border px-6 py-5">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="h-5 w-px bg-accent" />
          <span className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors">
            SAUU
          </span>
        </Link>
      </header>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
