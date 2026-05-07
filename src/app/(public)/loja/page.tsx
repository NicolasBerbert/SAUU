import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/loja/ProductCard";
import { CartBar } from "@/components/loja/CartBar";

export const dynamic = "force-dynamic";

export default async function LojaPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-[1320px] px-8 py-[140px]">
      {/* Header */}
      <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="mb-4 flex items-center gap-3.5">
            <span className="h-px w-8" style={{ background: "var(--red)" }} />
            <span className="eyebrow">Loja</span>
          </div>
          <h1
            className="font-display leading-[0.96] text-primary"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}
          >
            Loja
            <br />
            <em style={{ color: "var(--red)" }}>CLBB</em>
          </h1>
        </div>
        <p className="self-end text-[17px] leading-[1.65] text-primary">
          Produtos exclusivos do evento. Retirada feita presencialmente durante a
          semana. Pagamento via Mercado Pago, com a inscrição ou separadamente.
        </p>
      </div>

      {products.length === 0 ? (
        <div
          className="py-20 text-center"
          style={{ border: "1px dashed var(--line)" }}
        >
          <div
            className="mx-auto mb-6 h-px w-10"
            style={{ background: "var(--line)" }}
          />
          <p className="mb-1 text-[14px] text-muted">Produtos em breve</p>
          <p className="text-[12px]" style={{ color: "rgba(124,122,118,0.6)" }}>
            A loja será aberta em breve. Fique de olho!
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price.toNumber()}
              stock={product.stock}
              imageUrl={product.imageUrl}
              sizes={(product as Record<string, unknown>).sizes as string | null}
            />
          ))}
        </div>
      )}

      <div
        className="mb-24 mt-10 px-6 py-4"
        style={{ border: "1px solid var(--line)" }}
      >
        <p className="text-[12px] text-muted">
          Retirada presencial durante o evento · Sem frete · Pagamento via Mercado Pago
        </p>
      </div>

      <CartBar precoInscricao={Number(process.env.EVENT_REGISTRATION_PRICE ?? 50)} />
    </main>
  );
}
