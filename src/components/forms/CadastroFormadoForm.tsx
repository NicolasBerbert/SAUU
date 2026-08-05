"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { graduateRegisterSchema, type GraduateRegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

export function CadastroFormadoForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GraduateRegisterInput>({
    resolver: zodResolver(graduateRegisterSchema),
    defaultValues: { type: "FORMADO" },
  });

  async function onSubmit(data: GraduateRegisterInput) {
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

    router.push(`/verificar-email?email=${encodeURIComponent(data.email)}`);
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
          placeholder="seunome@email.com"
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

      {/* Instituição de formação */}
      <div>
        <Label htmlFor="graduationInstitution">Instituição de formação</Label>
        <Input
          id="graduationInstitution"
          placeholder="Ex: UEL, UEM, Unifil..."
          error={!!errors.graduationInstitution}
          {...register("graduationInstitution")}
        />
        <FormError message={errors.graduationInstitution?.message} />
      </div>

      {/* Ano de formatura */}
      <div>
        <Label htmlFor="graduationYear">Ano de formatura</Label>
        <Input
          id="graduationYear"
          type="number"
          placeholder={String(new Date().getFullYear())}
          error={!!errors.graduationYear}
          {...register("graduationYear", { valueAsNumber: true })}
        />
        <FormError message={errors.graduationYear?.message} />
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
