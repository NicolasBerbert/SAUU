import { prisma } from "@/lib/db";
import { joinNames } from "@/lib/utils";

// Resolve os palestrantes selecionados (na ordem informada), montando a linha
// de exibição (denormalizada em Presentation.speaker) e os vínculos da tabela
// de junção PresentationSpeaker.
export async function resolveSpeakers(palestranteIds: string[]) {
  const found = await prisma.palestrante.findMany({
    where: { id: { in: palestranteIds } },
    select: { id: true, name: true },
  });
  const ordered = palestranteIds
    .map((id) => found.find((p) => p.id === id))
    .filter((p): p is { id: string; name: string } => Boolean(p));

  if (ordered.length !== palestranteIds.length) {
    throw new Error("PALESTRANTE_NOT_FOUND");
  }

  return {
    speaker: joinNames(ordered.map((p) => p.name)),
    create: ordered.map((p, i) => ({ palestranteId: p.id, order: i })),
  };
}
