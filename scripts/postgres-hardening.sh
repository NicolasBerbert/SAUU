#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SAUU — Hardening do PostgreSQL (Ubuntu 24.04)
# Executar como root APÓS instalar o PostgreSQL e ANTES do deploy.
#
# O que este script faz:
#   1. Vincula o PostgreSQL apenas ao localhost (sem expor na rede)
#   2. Cria usuário dedicado com privilégios mínimos (sem SUPERUSER)
#   3. Revoga privilégios desnecessários do usuário público
#   4. Configura autenticação md5/scram-sha-256 apenas para o app user
#   5. Configura log de conexões e queries lentas para observabilidade
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_USER="sauu_app"
APP_DB="sauu_db"
# Defina a senha via variável de ambiente ou será gerada automaticamente
APP_PASSWORD="${SAUU_DB_PASSWORD:-$(openssl rand -base64 32)}"

# Detecta versão e diretório do PostgreSQL
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_CONF_DIR="/etc/postgresql/${PG_VERSION}/main"
PG_HBA="${PG_CONF_DIR}/pg_hba.conf"
PG_CONF="${PG_CONF_DIR}/postgresql.conf"

echo "=== PostgreSQL ${PG_VERSION} detectado em ${PG_CONF_DIR} ==="

# ─── [1] Bind apenas ao localhost ────────────────────────────────────────────
echo "=== [1/5] Vinculando PostgreSQL ao localhost ==="
# Garante que listen_addresses está apenas em localhost
sed -i "s/^#*listen_addresses\s*=.*/listen_addresses = 'localhost'/" "$PG_CONF"
# Confirma (adiciona se não existia)
grep -q "^listen_addresses" "$PG_CONF" || echo "listen_addresses = 'localhost'" >> "$PG_CONF"

# ─── [2] Configurações de log e segurança ────────────────────────────────────
echo "=== [2/5] Configurando log de segurança ==="
cat >> "$PG_CONF" << 'EOF'

# ─── Configurações de segurança SAUU ───────────────────────────────────────
log_connections = on              # loga cada nova conexão
log_disconnections = on           # loga desconexões
log_failed_authentications = on   # loga falhas de autenticação (detecta brute force)
log_min_duration_statement = 2000 # loga queries > 2s (detecta problemas de performance)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_duration = off
EOF

# ─── [3] Criar banco e usuário dedicado ──────────────────────────────────────
echo "=== [3/5] Criando banco '${APP_DB}' e usuário '${APP_USER}' ==="
sudo -u postgres psql << SQL
-- Cria banco se não existir
SELECT 'CREATE DATABASE ${APP_DB}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${APP_DB}')\gexec

-- Cria usuário sem SUPERUSER, CREATEDB, CREATEROLE
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${APP_USER}') THEN
    CREATE USER ${APP_USER} WITH
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      LOGIN
      PASSWORD '${APP_PASSWORD}';
  ELSE
    ALTER USER ${APP_USER} WITH PASSWORD '${APP_PASSWORD}';
  END IF;
END
\$\$;

-- Revoga privilégios padrão perigosos do PUBLIC no schema public
REVOKE ALL ON DATABASE ${APP_DB} FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Concede apenas o necessário ao usuário do app
GRANT CONNECT ON DATABASE ${APP_DB} TO ${APP_USER};
GRANT USAGE ON SCHEMA public TO ${APP_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};

-- Garante que futuras tabelas criadas pela migration também têm permissão
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER};
SQL

echo "Usuário '${APP_USER}' criado com senha: ${APP_PASSWORD}"
echo "IMPORTANTE: Salve essa senha no .env: DATABASE_URL=\"postgresql://${APP_USER}:SENHA@127.0.0.1:5432/${APP_DB}\""

# ─── [4] Hardening do pg_hba.conf ────────────────────────────────────────────
echo "=== [4/5] Configurando pg_hba.conf ==="
cp "$PG_HBA" "${PG_HBA}.backup.$(date +%Y%m%d)"

# Substitui o arquivo — permite apenas:
# - postgres via peer local (para administração)
# - sauu_app via scram-sha-256 em localhost
cat > "$PG_HBA" << EOF
# TYPE  DATABASE    USER        ADDRESS        METHOD
# Administração local via socket Unix (apenas usuário postgres do SO)
local   all         postgres                   peer
# Rejeita todas conexões locais de outros usuários via socket
local   all         all                        reject
# App SAUU — apenas localhost, autenticação forte
host    ${APP_DB}   ${APP_USER} 127.0.0.1/32  scram-sha-256
# Bloqueia tudo mais
host    all         all         0.0.0.0/0     reject
host    all         all         ::/0          reject
EOF

# ─── [5] Reinicia e valida ───────────────────────────────────────────────────
echo "=== [5/5] Reiniciando PostgreSQL ==="
systemctl restart postgresql

echo ""
echo "✅ Hardening do PostgreSQL concluído."
echo ""
echo "Verificação — conectar como app user:"
echo "  psql postgresql://${APP_USER}:SENHA@127.0.0.1:5432/${APP_DB}"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "  1. Atualizar DATABASE_URL no .env do servidor com o novo usuário e senha"
echo "  2. Rodar 'npx prisma migrate deploy' (como usuário do SO, não como postgres)"
echo "  3. Verificar com: sudo -u postgres psql -c '\\du' (lista usuários)"
echo "  4. UFW já bloqueia porta 5432 externamente — confirmar com: ufw status"
