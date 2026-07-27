-- Suporte a múltiplos palestrantes por palestra (roda de conversa / mesa redonda).

-- 1) Tabela de junção N:N
CREATE TABLE "PresentationSpeaker" (
    "presentationId" TEXT NOT NULL,
    "palestranteId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PresentationSpeaker_pkey" PRIMARY KEY ("presentationId","palestranteId")
);

CREATE INDEX "PresentationSpeaker_palestranteId_idx" ON "PresentationSpeaker"("palestranteId");

ALTER TABLE "PresentationSpeaker"
    ADD CONSTRAINT "PresentationSpeaker_presentationId_fkey"
    FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PresentationSpeaker"
    ADD CONSTRAINT "PresentationSpeaker_palestranteId_fkey"
    FOREIGN KEY ("palestranteId") REFERENCES "Palestrante"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Preserva os vínculos existentes (relação 1:1 antiga → junção)
INSERT INTO "PresentationSpeaker" ("presentationId","palestranteId","order")
SELECT "id","palestranteId", 0
FROM "Presentation"
WHERE "palestranteId" IS NOT NULL;

-- 3) Remove a antiga relação de palestrante único
ALTER TABLE "Presentation" DROP CONSTRAINT IF EXISTS "Presentation_palestranteId_fkey";
DROP INDEX IF EXISTS "Presentation_palestranteId_idx";
ALTER TABLE "Presentation" DROP COLUMN "palestranteId";
