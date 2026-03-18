#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SAUU — Hardening do VM Oracle (Ubuntu 24.04 ARM Ampere A1)
# Executar como root no novo VM, ANTES de qualquer deploy.
# Incidente de referência: Kinsing via rpcbind (porta 111 exposta), 18/03/2026.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

USUARIO_APP="sauu"          # usuário dedicado sem sudo para rodar o app
DIR_APP="/var/www/sauu"
EMAIL_ADMIN="nickberbert10@gmail.com"

echo "=== [1/10] Atualizando pacotes ==="
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl git ufw fail2ban \
  rkhunter chkrootkit \
  unattended-upgrades apt-listchanges \
  logwatch

# ─── Desabilitar serviços desnecessários (vetor do incidente Kinsing) ────────
echo "=== [2/10] Desabilitando serviços desnecessários ==="
# rpcbind (porta 111) — foi a entrada do malware Kinsing
systemctl disable --now rpcbind rpcbind.socket 2>/dev/null || true
# Outros serviços dispensáveis em servidor de aplicação
for svc in snapd bluetooth avahi-daemon cups; do
  systemctl disable --now "$svc" 2>/dev/null || true
done

# ─── UFW — Firewall ──────────────────────────────────────────────────────────
echo "=== [3/10] Configurando UFW ==="
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment "SSH"
ufw allow 80/tcp comment "HTTP (redirect para HTTPS pelo Nginx)"
ufw allow 443/tcp comment "HTTPS"
# Bloqueia explicitamente portas sensíveis mesmo se abertas por padrão no Oracle
ufw deny 111/tcp comment "rpcbind — bloqueado explicitamente (vetor Kinsing)"
ufw deny 111/udp comment "rpcbind UDP"
ufw deny 2049/tcp comment "NFS"
ufw deny 6379/tcp comment "Redis (não usado, mas blindado)"
ufw --force enable
ufw status verbose

# ─── SSH Hardening ───────────────────────────────────────────────────────────
echo "=== [4/10] Hardening do SSH ==="
SSHD_CONF="/etc/ssh/sshd_config"
cp "$SSHD_CONF" "${SSHD_CONF}.backup.$(date +%Y%m%d)"

# Desabilitar login por senha — apenas chaves SSH
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONF"
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' "$SSHD_CONF"
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD_CONF"
sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 3/' "$SSHD_CONF"
sed -i 's/^#*LoginGraceTime.*/LoginGraceTime 30/' "$SSHD_CONF"

# Porta padrão 22 — mudar para porta não padrão é opcional mas reduz ruído
# Para mudar: sed -i 's/^#*Port.*/Port 2222/' "$SSHD_CONF"
# E adicionar: ufw allow 2222/tcp

systemctl restart ssh

# ─── Usuário dedicado para o app (sem sudo) ───────────────────────────────────
echo "=== [5/10] Criando usuário dedicado '$USUARIO_APP' ==="
if ! id "$USUARIO_APP" &>/dev/null; then
  useradd -r -m -d "$DIR_APP" -s /bin/bash "$USUARIO_APP"
  echo "Usuário '$USUARIO_APP' criado."
else
  echo "Usuário '$USUARIO_APP' já existe."
fi
# Garante que não tem sudo
gpasswd -d "$USUARIO_APP" sudo 2>/dev/null || true

# ─── Fail2ban ────────────────────────────────────────────────────────────────
echo "=== [6/10] Configurando fail2ban ==="
# Configura jail SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
destemail = nickberbert10@gmail.com
action = %(action_mwl)s

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
maxretry = 3
bantime  = 86400

[sauu-api]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/access.log
filter   = sauu-api
maxretry = 20
findtime = 300
bantime  = 3600
EOF

# Copia filtro customizado (criado em scripts/fail2ban-sauu.conf)
if [ -f "$(dirname "$0")/fail2ban-sauu.conf" ]; then
  cp "$(dirname "$0")/fail2ban-sauu.conf" /etc/fail2ban/filter.d/sauu-api.conf
fi

systemctl enable --now fail2ban
fail2ban-client reload 2>/dev/null || true

# ─── rkhunter — detecção de rootkits (detecta Kinsing e similares) ──────────
echo "=== [7/10] Configurando rkhunter ==="
rkhunter --update || true
rkhunter --propupd || true
# Scan imediato — reporta mas não bloqueia (para não interromper setup)
rkhunter --check --sk --rwo 2>/dev/null || true

# Agendar scan diário
cat > /etc/cron.d/rkhunter-sauu << EOF
30 2 * * * root /usr/bin/rkhunter --check --sk --rwo 2>&1 | mail -s "[SAUU] rkhunter diário - \$(hostname)" $EMAIL_ADMIN
EOF

# ─── Atualizações automáticas de segurança ───────────────────────────────────
echo "=== [8/10] Configurando unattended-upgrades ==="
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Mail "nickberbert10@gmail.com";
Unattended-Upgrade::MailReport "on-change";
Unattended-Upgrade::Remove-Unused-Packages "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

# ─── PM2 + cron jobs do app ──────────────────────────────────────────────────
echo "=== [9/10] Configurando PM2 e crons do app ==="
npm install -g pm2 2>/dev/null || true
# Gerar token de serviço se não existir
if [ -z "${CLEANUP_SERVICE_TOKEN:-}" ]; then
  echo "⚠️  Lembre-se de definir CLEANUP_SERVICE_TOKEN no .env do servidor"
  echo "   Gere com: openssl rand -base64 32"
fi

# Cron para limpeza de pedidos PENDING a cada 2h
cat > /etc/cron.d/sauu-cleanup << 'EOF'
0 */2 * * * sauu curl -s -X POST http://localhost:3000/api/admin/limpar-pendentes \
  -H "x-service-token: ${CLEANUP_SERVICE_TOKEN}" >> /var/log/sauu-cleanup.log 2>&1
EOF

# Cron para monitoramento de segurança a cada 5min (UptimeRobot também monitora)
cat > /etc/cron.d/sauu-monitorar << 'EOF'
*/5 * * * * sauu curl -s "http://localhost:3000/api/admin/monitorar" \
  -H "x-service-token: ${CLEANUP_SERVICE_TOKEN}" >> /var/log/sauu-monitor.log 2>&1
EOF

# Backup do banco às 3h
cat > /etc/cron.d/sauu-backup << 'EOF'
0 3 * * * sauu /var/www/sauu/scripts/backup-db.sh >> /var/log/sauu-backup.log 2>&1
EOF

# ─── Permissões de arquivos ───────────────────────────────────────────────────
echo "=== [10/10] Ajustando permissões ==="
if [ -d "$DIR_APP" ]; then
  chown -R "$USUARIO_APP:$USUARIO_APP" "$DIR_APP"
  chmod 750 "$DIR_APP"
  # .env nunca legível por outros usuários
  if [ -f "$DIR_APP/.env" ]; then
    chmod 600 "$DIR_APP/.env"
    chown "$USUARIO_APP:$USUARIO_APP" "$DIR_APP/.env"
  fi
fi

echo ""
echo "✅ Hardening concluído."
echo ""
echo "PRÓXIMOS PASSOS MANUAIS:"
echo "  1. Adicionar chave SSH pública em ~/.ssh/authorized_keys do usuário ubuntu"
echo "  2. Testar login por chave antes de desabilitar senha"
echo "  3. Instalar Certbot e configurar SSL:"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d sauu.unifil.br"
echo "  4. Criar/editar /etc/nginx/sites-available/sauu com o nginx.conf fornecido"
echo "  5. Copiar .env para $DIR_APP/.env com credenciais NOVAS (todas as anteriores estão comprometidas)"
echo "  6. Rodar deploy: cd $DIR_APP && bash scripts/deploy.sh"
echo "  7. pm2 startup → pm2 save"
echo "  8. Configurar UptimeRobot para monitorar:"
echo "     - https://sauu.unifil.br/api/health (a cada 5 min)"
echo "     - https://sauu.unifil.br/api/admin/monitorar (a cada 5 min, com x-service-token)"
