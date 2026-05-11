import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ADMIN com 2FA pendente → redireciona para a página de código TOTP
    if ((token?.type as string) === "TOTP_PENDING") {
      if (!pathname.startsWith("/login/2fa")) {
        return NextResponse.redirect(new URL("/login/2fa", req.url));
      }
      return NextResponse.next();
    }

    // ADMIN sem 2FA configurado → força setup obrigatório
    if ((token?.type as string) === "TOTP_SETUP_REQUIRED") {
      if (!pathname.startsWith("/admin/2fa/setup")) {
        return NextResponse.redirect(new URL("/admin/2fa/setup", req.url));
      }
      return NextResponse.next();
    }

    // Protege rotas admin - apenas ADMIN pode acessar
    if (pathname.startsWith("/admin") && token?.type !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?erro=acesso_negado", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/minhas-palestras/:path*",
    "/inscricao/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/perfil/:path*",
    "/login/2fa",
    "/admin/2fa/:path*",
  ],
};
