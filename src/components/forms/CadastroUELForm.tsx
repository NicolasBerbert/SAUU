"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { uelRegisterSchema, type UELRegisterInput } from "@/lib/validations";
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
  } = useForm<UELRegisterInput>({
    resolver: zodResolver(uelRegisterSchema),
    defaultValues: { type: "UEL", institution: "UEL" },
  });

  async function onSubmit(data: UELRegisterInput) {
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

    router.push("/login?cadastro=sucesso");
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
          placeholder="seunome@uel.br"
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

      {/* RA */}
      <div>
        <Label htmlFor="ra">Registro Acadêmico (RA)</Label>
        <Input
          id="ra"
          placeholder="Seu RA da UEL"
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
          placeholder="Mínimo 6 caracteres"
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
