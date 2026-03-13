import { prisma } from "@/lib/db";
import { ProductManager } from "@/components/admin/ProductManager";

export default async function AdminLojaPage() {
  const raw = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const products = raw.map((p) => ({ ...p, price: p.price.toNumber() }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Admin</span>
      </div>
      <h1 className="text-3xl font-light text-primary mb-2">Loja</h1>
      <p className="text-sm text-muted mb-10">Gerencie os produtos disponíveis na loja do evento.</p>

      <ProductManager initial={products} />
    </div>
  );
}
