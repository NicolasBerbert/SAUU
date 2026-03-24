import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  slotId: z.string().cuid(),
  presente: z.boolean(),
});

// PUT /api/admin/presenca — marca ou desmarca presença em uma palestra
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { slotId, presente } = schema.parse(await req.json());

  await prisma.presentationSlot.update({
    where: { id: slotId },
    data: { attendedAt: presente ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
