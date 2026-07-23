"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { externoRegisterSchema, type ExternoRegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

export function CadastroUELForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExternoRegisterInput>({
    resolver: zodResolver(externoRegisterSchema),
    defaultValues: { type: "EXTERNO" as const, institution: "", ra: "" },
  });

  async function onSubmit(data: ExternoRegisterInput) {
    setServerError("");
    const res = await fetch("/api/auth/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error ?? "Erro ao criar conta. Tente novamente.");
      return;
    }

    router.push("/verificar-email");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Nome */}
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          error={!!errors.name}
          {...register("name")}
        />
        <FormError message={errors.name?.message} />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seunome@exemplo.com"
          error={!!errors.email}
          {...register("email")}
        />
        <FormError message={errors.email?.message} />
      </div>

      {/* Telefone */}
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(43) 99999-9999"
          error={!!errors.phone}
          {...register("phone")}
        />
        <FormError message={errors.phone?.message} />
      </div>

      {/* CPF */}
      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          placeholder="000.000.000-00"
          error={!!errors.cpf}
          {...register("cpf")}
        />
        <FormError message={errors.cpf?.message} />
      </div>

      {/* Instituição */}
      <div>
        <Label htmlFor="institution">Instituição de origem</Label>
        <Input
          id="institution"
          placeholder="Nome da sua faculdade ou universidade"
          error={!!errors.institution}
          {...register("institution")}
        />
        <FormError message={errors.institution?.message} />
      </div>

      {/* RA */}
      <div>
        <Label htmlFor="ra">Registro Acadêmico (RA) <span className="text-muted font-normal">(opcional)</span></Label>
        <Input
          id="ra"
          placeholder="Seu Registro Acadêmico"
          error={!!errors.ra}
          {...register("ra")}
        />
        <FormError message={errors.ra?.message} />
      </div>

      {/* Senha */}
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          error={!!errors.password}
          {...register("password")}
        />
        <FormError message={errors.password?.message} />
      </div>

      {/* Confirmar senha */}
      <div>
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          error={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        <FormError message={errors.confirmPassword?.message} />
      </div>

      {serverError && (
        <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
          {serverError}
        </p>
      )}

      <Button type="submit" loading={isSubmitting} className="mt-2 py-4 text-xs tracking-widest uppercase">
        Criar conta
      </Button>
    </form>
  );
}
