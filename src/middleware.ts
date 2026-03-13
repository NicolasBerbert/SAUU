import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

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
  ],
};
