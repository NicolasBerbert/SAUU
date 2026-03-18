"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("E-mail ou senha incorretos.");
      return;
    }

    const session = await getSession();
    const type = session?.user?.type as string | undefined;

    if (type === "TOTP_PENDING") {
      router.push("/login/2fa");
      return;
    }

    if (type === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/minhas-palestras");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seunome@email.com"
          error={!!errors.email}
          autoComplete="email"
          {...register("email")}
        />
        <FormError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          error={!!errors.password}
          autoComplete="current-password"
          {...register("password")}
        />
        <FormError message={errors.password?.message} />
      </div>

      {serverError && (
        <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
          {serverError}
        </p>
      )}

      <Button type="submit" loading={isSubmitting} className="mt-2 py-4 text-xs tracking-widest uppercase">
        Entrar
      </Button>
    </form>
  );
}
