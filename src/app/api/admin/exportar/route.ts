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

// GET /api/admin/exportar — exporta inscritos em CSV para uso no dia do evento
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { active: true },
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

    const header = [
      "Nome",
      "E-mail",
      "Telefone",
      "Tipo",
      "Instituição",
      "Status Pagamento",
      "Valor Pago",
      "Palestras",
    ];

    const rows = users.map((u) => {
      const presentations = u.presentationSlots
        .map((s) => `Dia ${s.presentation.day} ${s.presentation.slot}: ${s.presentation.title}`)
        .join(" | ");

      return [
        u.name,
        u.email,
        u.phone,
        u.type,
        u.institution,
        u.eventRegistration?.paymentStatus ?? "SEM_INSCRICAO",
        u.eventRegistration ? String(u.eventRegistration.amount) : "0",
        presentations,
      ];
    });

    const csv = toCSV([header, ...rows]);
    const filename = `inscritos_sauu_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/admin/exportar", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
