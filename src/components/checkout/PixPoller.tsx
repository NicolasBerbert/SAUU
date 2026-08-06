"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function PixPoller({
  pid,
  qrCode,
  initialApproved,
}: {
  pid: string;
  qrCode: string;
  initialApproved: boolean;
}) {
  const [approved, setApproved] = useState(initialApproved);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (approved) return;
    let ativo = true;
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagamento/status?pid=${encodeURIComponent(pid)}`);
        const body = await res.json();
        if (ativo && body.approved) {
          setApproved(true);
          clearInterval(intervalo);
        }
      } catch {
        // ignora falha pontual de rede; tenta de novo no próximo ciclo
      }
    }, 4000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [pid, approved]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  if (approved) {
    return (
      <div className="mt-8 text-center">
        <div
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full font-display text-2xl"
          style={{ border: "1px solid var(--red)", color: "var(--red)" }}
        >
          ✓
        </div>
        <h2 className="mb-2 font-display text-[28px] leading-none text-primary">
          Pagamento confirmado
        </h2>
        <p className="mb-6 text-[14px] text-muted">
          Sua inscrição foi confirmada com sucesso.
        </p>
        <Link href="/minhas-palestras">
          <Button variant="primary" className="px-8 py-3.5">
            Ir para Minhas Palestras <span>→</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <label className="mb-1 block text-xs uppercase tracking-widest text-muted">
        PIX copia e cola
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={qrCode}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate bg-background border border-border px-3 py-2 text-xs text-primary focus:outline-none"
        />
        <button
          onClick={copiar}
          className="text-xs uppercase tracking-widest border border-accent px-5 py-2.5 text-accent transition-colors hover:bg-accent hover:text-background"
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--red)" }} />
        Aguardando pagamento… esta tela confirma sozinha assim que o PIX cair.
      </p>
    </div>
  );
}
