import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserType } from "@prisma/client";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyTotpCode, createPendingToken, verifyPendingToken } from "@/lib/totp";

// Tipo especial para sessão aguardando 2FA
const TOTP_PENDING = "TOTP_PENDING" as const;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:        { label: "Email",        type: "email"  },
        password:     { label: "Senha",        type: "password" },
        pendingToken: { label: "PendingToken", type: "text"   },
        totpCode:     { label: "Código 2FA",   type: "text"   },
      },
      async authorize(credentials) {
        // ── Caminho 2: completar 2FA (pendingToken + totpCode) ──────────────
        if (credentials?.pendingToken && credentials?.totpCode) {
          const payload = verifyPendingToken(credentials.pendingToken);
          if (!payload) return null; // token expirado ou adulterado

          const user = await prisma.user.findUnique({ where: { id: payload.userId } });
          if (!user || !user.active || user.type !== UserType.ADMIN) return null;
          if (!user.totpSecret) return null;
          if (!verifyTotpCode(credentials.totpCode, user.totpSecret)) return null;

          return { id: user.id, name: user.name, email: user.email, type: user.type } as any;
        }

        // ── Caminho 1: login normal (email + senha) ─────────────────────────
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit por e-mail: 5 por instância (10 efetivos com 2 instâncias PM2)
        const limit = checkRateLimit(`login:${credentials.email.toLowerCase()}`, {
          windowSec: 900,
          max: 5,
        });
        if (!limit.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.active) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        // ADMIN com 2FA ativo → retorna sessão pendente
        if (user.type === UserType.ADMIN && user.totpSecret) {
          const pendingToken = createPendingToken(user.id);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            type: TOTP_PENDING,
            pendingToken,
          } as any;
        }

        return { id: user.id, name: user.name, email: user.email, type: user.type } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = (user as any).type;
        if ((user as any).pendingToken) {
          token.pendingToken = (user as any).pendingToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as UserType;
        if (token.pendingToken) {
          (session as any).pendingToken = token.pendingToken;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },
};
