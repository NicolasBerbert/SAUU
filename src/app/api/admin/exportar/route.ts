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

const TYPE_LABEL: Record<string, string> = {
  UNIFIL: "Unifil",
  EXTERNO: "Externo",
  FORMADO: "Formado",
};

// GET /api/admin/exportar — exporta inscritos em .xlsx
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { active: true, type: { not: "ADMIN" } },
      include: {
        eventRegistration: { select: { paymentStatus: true, amount: true } },
        presentationSlots: {
          include: {
            presentation: { select: { title: true, day: true, slot: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "SAUU Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Inscritos");

    ws.columns = [
      { header: "Nome", key: "nome", width: 32 },
      { header: "E-mail", key: "email", width: 36 },
      { header: "CPF", key: "cpf", width: 18 },
      { header: "Telefone", key: "telefone", width: 16 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Instituição", key: "instituicao", width: 28 },
      { header: "RA", key: "ra", width: 18 },
      { header: "E-mail verificado", key: "emailVerificado", width: 18 },
      { header: "Status Pagamento", key: "statusPagamento", width: 20 },
      { header: "Valor Pago (R$)", key: "valorPago", width: 16 },
      { header: "Palestras", key: "palestras", width: 60 },
    ];

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD0C8C0" },
    };
    headerRow.alignment = { vertical: "middle" };
    headerRow.height = 20;

    for (const u of users) {
      const presentations = u.presentationSlots
        .map((s) => `Dia ${s.presentation.day} ${s.presentation.slot}: ${s.presentation.title}`)
        .join(" | ");

      const row = ws.addRow({
        nome: u.name,
        email: u.email,
        cpf: (u as Record<string, unknown>).cpf ?? "",
        telefone: u.phone,
        tipo: TYPE_LABEL[u.type] ?? u.type,
        instituicao: u.institution ?? "",
        ra: (u as Record<string, unknown>).ra ?? "",
        emailVerificado: u.emailVerified ? "Sim" : "Não",
        statusPagamento: STATUS_LABEL[u.eventRegistration?.paymentStatus ?? ""] ?? "Sem inscrição",
        valorPago: u.eventRegistration ? Number(u.eventRegistration.amount) : 0,
        palestras: presentations,
      });

      // Alternate row shading
      if (row.number % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F4F2" },
        };
      }

      // Highlight unpaid rows
      if (!u.eventRegistration || u.eventRegistration.paymentStatus !== "APPROVED") {
        const cell = row.getCell("statusPagamento");
        cell.font = { color: { argb: "FFC0392B" } };
      }
    }

    // Freeze header
    ws.views = [{ state: "frozen", ySplit: 1 }];

    // Auto-filter
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columns.length },
    };

    const buffer = new Uint8Array(await wb.xlsx.writeBuffer() as ArrayBuffer);
    const filename = `inscritos_sauu_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/admin/exportar", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
