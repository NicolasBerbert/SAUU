-- ============================================================================
-- RESET PRÉ-LANÇAMENTO — zera TODOS os dados de teste (participantes,
-- inscrições, pagamentos, pedidos), mantendo a configuração do evento
-- (palestras, palestrantes, patrocinadores, comissão) e os ADMINs.
--
-- ⚠️  RODE ISTO SÓ SE NINGUÉM REAL AINDA SE CADASTROU. Ele apaga TODOS os
--     usuários que não são ADMIN. Depois de lançar, use o outro script
--     (delete-test-users.sql) para remover contas específicas.
--
-- Faça um backup/snapshot no Supabase antes (Database → Backups), por garantia.
-- Tudo em uma transação: se algo falhar, faz ROLLBACK e nada é apagado.
-- ============================================================================

BEGIN;

-- 1) Inscrições nas palestras
DELETE FROM "PresentationSlot";

-- 2) Pedidos da loja (itens antes do pedido)
DELETE FROM "OrderItem";
DELETE FROM "Order";

-- 3) Inscrições no evento (o que alimenta o relatório financeiro)
DELETE FROM "EventRegistration";

-- 4) Certificados e tokens de verificação de e-mail
DELETE FROM "Certificate";
DELETE FROM "EmailVerificationToken";

-- 5) Logs de auditoria (histórico de testes). Precisa vir antes de apagar os
--    usuários, pois AuditLog.actorId referencia User.
DELETE FROM "AuditLog";

-- 6) Eventos já processados do Stripe (idempotência) — limpa resíduo de teste
DELETE FROM "ProcessedStripeEvent";

-- 7) Todos os usuários que NÃO são ADMIN
DELETE FROM "User" WHERE "type" <> 'ADMIN';

-- 8) (Opcional) Produto de teste. Escolha UMA das opções:
--    a) Apagar um produto específico pelo nome:
-- DELETE FROM "Product" WHERE "name" = 'NOME DO PRODUTO DE TESTE';
--    b) Ou apagar TODOS os produtos (se todos forem de teste):
-- DELETE FROM "Product";

COMMIT;

-- Conferência depois de rodar (devem voltar 0, exceto usuários = seus admins):
--   SELECT COUNT(*) FROM "EventRegistration";
--   SELECT COUNT(*) FROM "PresentationSlot";
--   SELECT COUNT(*) FROM "Order";
--   SELECT "type", COUNT(*) FROM "User" GROUP BY "type";
