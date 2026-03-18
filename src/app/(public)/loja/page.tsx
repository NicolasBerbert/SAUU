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
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Loja</span>
        </div>
        <h1 className="text-4xl font-light text-primary mb-3">Loja SAUU</h1>
        <p className="text-sm text-muted max-w-lg">
          Produtos exclusivos do evento. Retirada feita presencialmente durante a semana.
          Adicione ao carrinho e finalize o pagamento junto com sua inscrição ou separadamente.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="border border-border py-20 text-center">
          <div className="w-10 h-px bg-border mx-auto mb-6" />
          <p className="text-sm text-muted mb-2">Produtos em breve</p>
          <p className="text-xs text-muted/60">A loja será aberta em breve. Fique de olho!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price.toNumber()}
              stock={product.stock}
              imageUrl={product.imageUrl}
            />
          ))}
        </div>
      )}

      <div className="mt-10 mb-24 border border-border px-6 py-4">
        <p className="text-xs text-muted">
          Retirada presencial durante o evento · Sem frete · Pagamento via Mercado Pago
        </p>
      </div>

      {/* Barra do carrinho — aparece quando há itens */}
      <CartBar precoInscricao={Number(process.env.EVENT_REGISTRATION_PRICE ?? 50)} />
    </main>
  );
}
