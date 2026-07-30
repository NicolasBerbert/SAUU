-- Trava de confirmação das palestras: após confirmar, o usuário não pode mais
-- alterar a seleção de palestras.
ALTER TABLE "EventRegistration" ADD COLUMN "presentationsConfirmedAt" TIMESTAMP(3);
