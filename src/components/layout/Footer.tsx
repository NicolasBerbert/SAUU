export function Footer() {
  return (
    <footer className="border-t border-border py-10 mt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-px bg-accent" />
            <span className="text-xs uppercase tracking-widest text-muted">
              SAUU — Semana de Arquitetura Unifil
            </span>
          </div>
          <span className="text-xs text-muted">
            Unifil &copy; {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
