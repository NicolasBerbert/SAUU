# SAUU — Semana de Arquitetura Unifil

Site oficial do evento de arquitetura da Unifil. Inscrições, grade de palestras, loja de produtos e painel administrativo.

## Stack

- **Next.js 15** (App Router, full-stack)
- **PostgreSQL** (self-hosted / Docker para dev)
- **Prisma** (ORM + migrations)
- **NextAuth.js** (autenticação JWT — e-mail + senha)
- **Mercado Pago** (pagamentos — inscrição + loja)
- **Nodemailer** (e-mails de confirmação)
- **Tailwind CSS** (tema dark minimalista)
- **Zod + React Hook Form** (validação)
- **PM2 + Nginx** (produção na Oracle VM)

## Tipos de usuário

| Tipo | Acesso | Observação |
|------|--------|------------|
| `UNIFIL` | Aluno Unifil | E-mail obrigatório `@edu.unifil.br` |
| `UEL` | Aluno UEL | Campo RA obrigatório; recebe certificado |
| `FORMADO` | Profissional formado | Campos de ano e instituição de formação |
| `ADMIN` | Administrador | Acesso ao painel `/admin` |

## Regras de negócio

- Inscrição no evento é **paga** (valor definido em `EVENT_REGISTRATION_PRICE`)
- Seleção de palestras é gratuita, mas exige inscrição paga
- 5 dias de evento, 2 palestras por dia: **19h00** e **20h45**
- Loja com produtos físicos — retirada presencial no evento, sem frete
- Certificados disponíveis apenas para alunos UEL

---

## Pré-requisitos

- Node.js 20+
- Docker (para PostgreSQL local) **ou** uma instância PostgreSQL acessível
- npm

---

## Como rodar em desenvolvimento

### 1. Clone e instale as dependências

```bash
git clone <repo>
cd sauu
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com seus valores. Para desenvolvimento, os valores do banco já funcionam com o Docker abaixo.

### 3. Suba o PostgreSQL com Docker

```bash
docker-compose up -d
```

Isso cria um container PostgreSQL na porta **5433** (para não conflitar com uma instalação local na 5432).
A `DATABASE_URL` no `.env` deve apontar para `127.0.0.1:5433`.

```env
DATABASE_URL="postgresql://sauu:sauu_dev_password@127.0.0.1:5433/sauu_db"
```

### 4. Rode as migrations e o seed

```bash
npm run db:generate   # gera o Prisma Client
npm run db:migrate    # aplica as migrations
npm run db:seed       # cria usuário admin + grade de palestras placeholder
```

O seed cria:
- Usuário admin: `admin@sauu.com` / senha `admin123`
- 10 palestras placeholder (5 dias × 2 horários)

### 5. Inicie o servidor

```bash
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Next.js) |
| `npm run build` | Build de produção |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera o Prisma Client após mudanças no schema |
| `npm run db:migrate` | Cria e aplica nova migration (dev) |
| `npm run db:migrate:prod` | Aplica migrations em produção (sem criar arquivos) |
| `npm run db:studio` | Abre o Prisma Studio (GUI do banco) |
| `npm run db:seed` | Popula o banco com dados iniciais |

---

## Estrutura de rotas

```
/                        → Landing page pública
/programacao             → Grade de palestras (público)
/loja                    → Loja de produtos (público)
/login                   → Login
/cadastro                → Seleção de tipo de usuário
/cadastro/unifil         → Cadastro aluno Unifil
/cadastro/uel            → Cadastro aluno UEL
/cadastro/formado        → Cadastro profissional formado
/checkout                → Confirmação de inscrição (requer login)
/checkout/sucesso        → Pós-pagamento
/inscricao               → Seleção de palestras (requer inscrição paga)
/minhas-palestras        → Área do participante
/admin                   → Painel admin (requer ADMIN)
/admin/palestras         → CRUD de palestras
/admin/usuarios          → Lista de participantes
/admin/loja              → CRUD de produtos
/admin/pedidos           → Pedidos da loja
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `NEXTAUTH_URL` | URL base da aplicação |
| `NEXTAUTH_SECRET` | Secret JWT (gerar com `openssl rand -base64 32`) |
| `MP_ACCESS_TOKEN` | Token de acesso Mercado Pago |
| `MP_PUBLIC_KEY` | Chave pública Mercado Pago |
| `MP_WEBHOOK_SECRET` | Secret para validar webhooks do MP |
| `NEXT_PUBLIC_BASE_URL` | URL pública (usada no webhook) |
| `EMAIL_HOST` | Servidor SMTP |
| `EMAIL_PORT` | Porta SMTP (ex: 587) |
| `EMAIL_SECURE` | `true` para porta 465, `false` para 587 |
| `EMAIL_USER` | Usuário SMTP |
| `EMAIL_PASS` | Senha do e-mail (usar App Password no Gmail) |
| `EMAIL_FROM` | Remetente dos e-mails |
| `EVENT_REGISTRATION_PRICE` | Valor da inscrição em reais (ex: `50.00`) |

---

## Deploy em produção (Oracle VM)

### Requisitos no servidor
- Node.js 20+, PM2, Nginx, PostgreSQL

### Passos

```bash
# 1. Clone o repo e instale dependências
npm ci --omit=dev

# 2. Configure o .env de produção

# 3. Aplique as migrations (sem criar arquivos novos)
npm run db:migrate:prod

# 4. Build
npm run build

# 5. Inicie com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

O `ecosystem.config.js` inicia **2 instâncias** em modo cluster.
O `nginx.conf` inclui a configuração de proxy reverso (seção SSL comentada — descomentar após configurar certificado Let's Encrypt).

### Atualizar após mudanças

```bash
git pull
npm ci --omit=dev
npm run db:migrate:prod
npm run build
pm2 reload sauu
```

---

## Pagamento (Mercado Pago)

O fluxo de pagamento real usa o SDK `mercadopago` (backend only).
Durante o desenvolvimento, a rota `/api/pagamento/simular` aprova a inscrição diretamente sem passar pelo Mercado Pago — remover ou proteger antes de ir a produção.

Para configurar o webhook em produção, registre a URL `https://seu-dominio.com/api/pagamento/webhook` no painel do Mercado Pago.
