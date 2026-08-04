import Link from "next/link";
import { redirect } from "next/navigation";
import { ReenviarVerificacao } from "@/components/auth/ReenviarVerificacao";

interface Props {
  searchParams: Promise<{ sucesso?: string; erro?: string; token?: string; email?: string }>;
}

export default async function VerificarEmailPage({ searchParams }: Props) {
  const params = await searchParams;

  // Compatibilidade: links antigos apontavam para esta página com ?token=.
  // Encaminha para a rota da API que efetivamente valida o e-mail.
  if (params.token && !params.sucesso && !params.erro) {
    redirect(`/api/auth/verificar-email?token=${encodeURIComponent(params.token)}`);
  }

  if (params.sucesso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-8 bg-accent" />
            <span className="text-xs uppercase tracking-widest text-accent">E-mail confirmado</span>
            <div className="h-px w-8 bg-accent" />
          </div>
          <div className="w-12 h-12 rounded-full border border-accent flex items-center justify-center mx-auto mb-8">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-light tracking-wide text-foreground mb-4">
            E-mail verificado com sucesso
          </h1>
          <p className="text-sm text-muted mb-10">
            Sua conta está ativa. Agora você pode fazer login e realizar sua inscrição no evento.
          </p>
          <Link
            href="/login"
            className="text-xs uppercase tracking-widest border border-accent px-6 py-3 text-accent hover:bg-accent hover:text-background transition-colors"
          >
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  const errorMessages: Record<string, string> = {
    token_invalido: "O link de verificação é inválido ou já foi utilizado.",
    token_expirado: "O link de verificação expirou. Solicite um novo cadastro.",
    interno: "Ocorreu um erro. Tente novamente.",
  };

  const errorMsg = params.erro
    ? (errorMessages[params.erro] ?? "Link inválido.")
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs uppercase tracking-widest text-accent">Verificação de e-mail</span>
          <div className="h-px w-8 bg-accent" />
        </div>

        {errorMsg ? (
          <>
            <div className="w-12 h-12 rounded-full border border-danger flex items-center justify-center mx-auto mb-8">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-light tracking-wide text-foreground mb-4">
              Verificação falhou
            </h1>
            <p className="text-sm text-muted mb-10">{errorMsg}</p>
            <Link href="/cadastro" className="text-xs uppercase tracking-widest border border-accent px-6 py-3 text-accent hover:bg-accent hover:text-background transition-colors">
              Criar nova conta
            </Link>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mx-auto mb-8">
              <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-light tracking-wide text-foreground mb-4">
              Confirme seu e-mail
            </h1>
            <p className="text-sm text-muted mb-4">
              Enviamos um link de confirmação para o e-mail cadastrado.
            </p>
            <p className="text-sm text-muted">
              Verifique sua caixa de entrada (e o spam) e clique no link para ativar
              sua conta. O link expira em <strong className="text-foreground">24 horas</strong>.
            </p>
            <div className="mx-auto max-w-sm text-left">
              <ReenviarVerificacao defaultEmail={params.email ?? ""} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
