import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
      {/* Art side */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden px-16 py-20 md:flex"
        style={{ background: "var(--red)", color: "var(--bg)" }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute right-[-20%] top-[-10%]"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(140,150,115,0.45) 0%, transparent 65%)",
            filter: "blur(20px)",
          }}
        />

        <div className="relative">
          <div
            className="mb-6 text-[11px] uppercase tracking-[0.26em]"
            style={{ color: "rgba(227,226,222,0.7)" }}
          >
            CLBB · Comissão Lina Bo Bardi
          </div>
          <h1
            className="font-display leading-[0.95] max-w-[480px]"
            style={{ fontSize: "64px" }}
          >
            Semana
            <br />
            <em style={{ color: "var(--paper-2)" }}>acadêmica</em>
            <br />
            2026
          </h1>
          <div
            className="relative mt-16 overflow-hidden"
            style={{
              width: "200px",
              aspectRatio: "320/240",
              filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.3))",
            }}
          >
            <Image
              src="/lina-portrait.png"
              alt="Lina Bo Bardi"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div
          className="relative flex items-end justify-between gap-6 text-[11px] uppercase tracking-[0.26em]"
          style={{ opacity: 0.85 }}
        >
          <span>CLBB 2026 · 15 a 19 de setembro · Unifil Londrina</span>
          <span className="font-display text-2xl" style={{ textTransform: "none", letterSpacing: 0 }}>
            CLBB
          </span>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-8 py-16" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-[440px]">
          {/* Mobile-only brand */}
          <Link href="/" className="mb-10 flex items-center gap-2.5 md:hidden">
            <span
              className="grid h-7 w-7 place-items-center rounded-full font-display text-xs text-background"
              style={{ background: "var(--red)" }}
            >
              C
            </span>
            <span className="font-display text-base font-normal" style={{ color: "var(--red)" }}>
              CLBB
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
