import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

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
            <div key={product.id} className="bg-surface flex flex-col group">
              {/* Image */}
              <div className="aspect-square bg-surface-2 overflow-hidden relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-muted">Esgotado</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex-1">
                  <p className="text-sm text-primary mb-1">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-muted line-clamp-2">{product.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-base text-accent">{formatCurrency(product.price)}</span>
                  {product.stock > 0 ? (
                    <span className="text-[10px] uppercase tracking-widest text-muted">
                      {product.stock} disponíveis
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-danger">Esgotado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 border border-border px-6 py-4">
        <p className="text-xs text-muted">
          Retirada presencial durante o evento · Sem frete · Pagamento via Mercado Pago
        </p>
      </div>
    </main>
  );
}
