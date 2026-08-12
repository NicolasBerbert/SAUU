import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

// GET /api/admin/exportar/pedidos — exporta os pedidos da loja em .xlsx.
// Uma linha por item (produto/tamanho) para facilitar filtro e contagem.
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "SAUU Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Pedidos");

    ws.columns = [
      { header: "Data", key: "data", width: 18 },
      { header: "Comprador", key: "comprador", width: 30 },
      { header: "E-mail", key: "email", width: 34 },
      { header: "Telefone", key: "telefone", width: 16 },
      { header: "Produto", key: "produto", width: 30 },
      { header: "Tamanho", key: "tamanho", width: 10 },
      { header: "Qtd", key: "qtd", width: 8 },
      { header: "Preço unit. (R$)", key: "precoUnit", width: 16 },
      { header: "Subtotal (R$)", key: "subtotal", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD0C8C0" } };
    headerRow.alignment = { vertical: "middle" };
    headerRow.height = 20;

    for (const order of orders) {
      const data = new Date(order.createdAt).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const item of order.items) {
        const preco = Number(item.price);
        const row = ws.addRow({
          data,
          comprador: order.user.name,
          email: order.user.email,
          telefone: order.user.phone,
          produto: item.product.name,
          tamanho: item.size ?? "—",
          qtd: item.quantity,
          precoUnit: preco,
          subtotal: preco * item.quantity,
          status: STATUS_LABEL[order.status] ?? order.status,
        });

        if (row.number % 2 === 0) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F4F2" } };
        }
        if (order.status !== "APPROVED") {
          row.getCell("status").font = { color: { argb: "FFC0392B" } };
        }
      }
    }

    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

    const buffer = new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
    const filename = `pedidos_sauu_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/admin/exportar/pedidos", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
