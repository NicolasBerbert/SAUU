import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { buscarPagamento } from "@/lib/mercadopago";
import { formatCurrency } from "@/lib/utils";
import { PixPoller } from "@/components/checkout/PixPoller";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ pid?: string }>;
}

export default async function PixPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { pid } = await searchParams;
  if (!pid) redirect("/minhas-palestras");

  const pagamento = await buscarPagamento(pid);
  if (!pagamento) redirect("/minhas-palestras");

  const tx = pagamento.point_of_interaction?.transaction_data;
  const jaAprovado = pagamento.status === "approved";
  const qrBase64 = tx?.qr_code_base64;
  const copiaECola = tx?.qr_code ?? "";

  return (
    <main
      className="flex min-h-[80vh] items-center justify-center px-8 py-16"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Pagamento via PIX</span>
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
        </div>

        <div
          className="p-8"
          style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
        >
          <div className="mb-1 font-display text-[32px] leading-none text-primary">
            {formatCurrency(pagamento.transaction_amount)}
          </div>
          <p className="mb-6 text-[13px] text-muted">
            Abra o app do seu banco, escolha <strong>PIX</strong> e escaneie o QR
            code — ou use o copia e cola abaixo.
          </p>

          {!jaAprovado && qrBase64 && (
            <div className="mx-auto mb-2 w-fit bg-white p-4">
              {/* QR gerado pelo Mercado Pago (data URI) — next/image não se aplica. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR code PIX"
                width={220}
                height={220}
              />
            </div>
          )}

          <PixPoller pid={pid} qrCode={copiaECola} initialApproved={jaAprovado} />
        </div>

        <p className="mt-6 text-[12px] text-muted">
          Qualquer banco funciona — não é preciso ter conta no Mercado Pago.
        </p>
      </div>
    </main>
  );
}
