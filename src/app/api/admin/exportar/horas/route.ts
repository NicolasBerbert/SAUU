import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function formatHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const TYPE_LABEL: Record<string, string> = {
  UNIFIL: "Unifil",
  EXTERNO: "Externo",
  FORMADO: "Formado",
};

// GET /api/admin/exportar/horas — exporta horas assistidas por usuário em .xlsx
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const usuarios = await prisma.user.findMany({
      where: { type: { not: "ADMIN" }, active: true },
      include: {
        presentationSlots: {
          where: { attendedAt: { not: null } },
          include: {
            presentation: { select: { title: true, day: true, slot: true, duration: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "SAUU Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Horas por Usuário");

    ws.columns = [
      { header: "Nome", key: "nome", width: 32 },
      { header: "E-mail", key: "email", width: 36 },
      { header: "Telefone", key: "telefone", width: 16 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Instituição", key: "instituicao", width: 28 },
      { header: "RA", key: "ra", width: 18 },
      { header: "Palestras Assistidas", key: "palestrasAssistidas", width: 22 },
      { header: "Total de Horas", key: "totalHoras", width: 18 },
      { header: "Detalhamento", key: "detalhamento", width: 60 },
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

    for (const u of usuarios) {
      const totalMinutos = u.presentationSlots.reduce(
        (sum, s) => sum + s.presentation.duration,
        0
      );
      const palestras = u.presentationSlots
        .map((s) => `Dia ${s.presentation.day} ${s.presentation.slot}: ${s.presentation.title}`)
        .join(" | ");

      const row = ws.addRow({
        nome: u.name,
        email: u.email,
        telefone: u.phone,
        tipo: TYPE_LABEL[u.type] ?? u.type,
        instituicao: u.institution ?? "",
        ra: (u as Record<string, unknown>).ra ?? "",
        palestrasAssistidas: u.presentationSlots.length,
        totalHoras: totalMinutos > 0 ? formatHoras(totalMinutos) : "0h",
        detalhamento: palestras,
      });

      // Alternate row shading
      if (row.number % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F4F2" },
        };
      }

      // Highlight users with no attendance
      if (u.presentationSlots.length === 0) {
        const cell = row.getCell("palestrasAssistidas");
        cell.font = { color: { argb: "FF888888" } };
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
    const filename = `horas_sauu_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/admin/exportar/horas", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
