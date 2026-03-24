import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function toCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

function formatHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// GET /api/admin/exportar/horas — exporta horas assistidas por usuário em CSV
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

    const tipoLabel: Record<string, string> = {
      UNIFIL: "Unifil",
      EXTERNO: "Externo",
      FORMADO: "Formado",
    };

    const header = [
      "Nome",
      "E-mail",
      "Telefone",
      "Tipo",
      "Instituição",
      "Palestras Assistidas",
      "Total de Horas",
    ];

    const rows = usuarios.map((u) => {
      const totalMinutos = u.presentationSlots.reduce(
        (sum, s) => sum + s.presentation.duration,
        0
      );
      const palestras = u.presentationSlots
        .map((s) => `Dia ${s.presentation.day} ${s.presentation.slot}: ${s.presentation.title}`)
        .join(" | ");

      return [
        u.name,
        u.email,
        u.phone,
        tipoLabel[u.type] ?? u.type,
        u.institution,
        String(u.presentationSlots.length),
        totalMinutos > 0 ? formatHoras(totalMinutos) : "0h",
      ];
    });

    const csv = toCSV([header, ...rows]);
    const filename = `horas_sauu_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/admin/exportar/horas", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
