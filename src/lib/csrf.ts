// Proteção CSRF básica: verifica que o Origin ou Referer da requisição
// bate com a URL base da aplicação. Aplicar em todas as rotas POST/PUT/DELETE
// que alteram estado, exceto o webhook do MP (que vem de servidor externo).

export function verifyCsrf(req: Request): boolean {
  // Em desenvolvimento sem NEXTAUTH_URL configurado, não bloquear
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl || process.env.NODE_ENV === "development") return true;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const check = origin ?? referer;

  if (!check) return false;

  try {
    const checkUrl = new URL(check);
    const base = new URL(baseUrl);
    return checkUrl.origin === base.origin;
  } catch {
    return false;
  }
}
