import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PalestrasConfirmadasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main
      className="flex min-h-[70vh] items-center justify-center px-8"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Confirmado</span>
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
        </div>

        <div
          className="mb-8 p-12"
          style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
        >
          <div
            className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full font-display text-2xl"
            style={{ border: "1px solid var(--red)", color: "var(--red)" }}
          >
            ✓
            <span
              className="absolute inset-[-6px] rounded-full"
              style={{
                border: "1px solid var(--red)",
                opacity: 0.25,
                animation: "pulseRing 2.4s ease-in-out infinite",
              }}
            />
          </div>
          <h1
            className="mb-3 font-display leading-none text-primary"
            style={{ fontSize: "36px" }}
          >
            Palestras confirmadas
          </h1>
          <p className="mb-8 text-[14px] text-muted">
            Suas palestras foram confirmadas com sucesso. Enviamos um e-mail com o
            resumo da sua seleção. A partir de agora a seleção não pode mais ser
            alterada.
          </p>
          <Link href="/minhas-palestras">
            <Button variant="primary" className="px-8 py-3.5">
              Ir para Minhas Palestras <span>→</span>
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
