-- ============================================================================
-- Remoção de usuários de teste (pagamentos de teste do Stripe) e seus dados.
-- Rode no Supabase → SQL Editor.
-- Está tudo em UMA transação (BEGIN/COMMIT): se qualquer passo falhar, nada é
-- apagado (ROLLBACK automático). Nomes de tabela/coluna usam aspas porque o
-- Prisma cria os identificadores em PascalCase (case-sensitive no Postgres).
-- ============================================================================

BEGIN;

-- Lista dos IDs uma única vez (tabela temporária, some no fim da sessão).
CREATE TEMP TABLE _test_users (id text) ON COMMIT DROP;
INSERT INTO _test_users (id) VALUES
  ('cmp1v5wsa0000fo2ogtlunzef'),
  ('cmrxl3k9000004yt2xm57b349'),
  ('cms7w3qv80000me9xxig260d6'),
  ('cms99tozm0000e0z314apaxfz');

-- --------------------------------------------------------------------------
-- (Opcional) CONFERÊNCIA antes de apagar: rode estas linhas isoladamente,
-- ANTES do restante, para ver o que será removido.
--   SELECT "id","name","email" FROM "User" WHERE "id" IN (SELECT id FROM _test_users);
--   SELECT COUNT(*) FROM "PresentationSlot"   WHERE "userId" IN (SELECT id FROM _test_users);
--   SELECT COUNT(*) FROM "EventRegistration"  WHERE "userId" IN (SELECT id FROM _test_users);
--   SELECT COUNT(*) FROM "Order"              WHERE "userId" IN (SELECT id FROM _test_users);
-- --------------------------------------------------------------------------

-- 1) Inscrições nas PALESTRAS (feitas como teste)
DELETE FROM "PresentationSlot"
WHERE "userId" IN (SELECT id FROM _test_users);

-- 2) Inscrição no EVENTO (o que aparece nos relatórios)
DELETE FROM "EventRegistration"
WHERE "userId" IN (SELECT id FROM _test_users);

-- 3) Pedidos da loja: itens primeiro, depois o pedido
DELETE FROM "OrderItem"
WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "userId" IN (SELECT id FROM _test_users));

DELETE FROM "Order"
WHERE "userId" IN (SELECT id FROM _test_users);

-- 4) Certificados
DELETE FROM "Certificate"
WHERE "userId" IN (SELECT id FROM _test_users);

-- 5) Tokens de verificação de e-mail
DELETE FROM "EmailVerificationToken"
WHERE "userId" IN (SELECT id FROM _test_users);

-- 6) Logs de auditoria: preserva o histórico, apenas desvincula o autor
--    (a coluna actorId é opcional). Se preferir APAGAR os logs desses usuários,
--    troque este UPDATE por:
--      DELETE FROM "AuditLog" WHERE "actorId" IN (SELECT id FROM _test_users);
UPDATE "AuditLog"
SET "actorId" = NULL
WHERE "actorId" IN (SELECT id FROM _test_users);

-- 7) Finalmente, os próprios usuários
DELETE FROM "User"
WHERE "id" IN (SELECT id FROM _test_users);

COMMIT;
