import { z } from "zod";
import { UserType } from "@prisma/client";

// ─────────────────────────────────────────────
// Cadastro
// ─────────────────────────────────────────────

const baseRegisterSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .max(15, "Telefone inválido")
    .regex(/^[\d\s\(\)\-\+]+$/, "Telefone inválido"),
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .regex(/[0-9]/, "Senha deve conter ao menos um número"),
  confirmPassword: z.string(),
  institution: z.string().min(2, "Informe a instituição"),
});

export const unifilRegisterSchema = baseRegisterSchema
  .extend({
    type: z.literal(UserType.UNIFIL),
    email: z
      .string()
      .email("E-mail inválido")
      .refine((v) => v.endsWith("@edu.unifil.br"), {
        message: "E-mail deve ser @edu.unifil.br",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

export const externoRegisterSchema = baseRegisterSchema
  .extend({
    type: z.literal("EXTERNO" as const),
    ra: z.string().optional().or(z.literal("")), // Registro Acadêmico — formato a definir
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

export const graduateRegisterSchema = baseRegisterSchema
  .extend({
    type: z.literal(UserType.FORMADO),
    graduationYear: z
      .number()
      .min(1990)
      .max(new Date().getFullYear()),
    graduationInstitution: z.string().min(2, "Informe a instituição de formação"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

// ─────────────────────────────────────────────
// Produtos (admin)
// ─────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser positivo"),
  stock: z.number().int().min(0, "Estoque não pode ser negativo"),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

// ─────────────────────────────────────────────
// Palestras (admin)
// ─────────────────────────────────────────────

export const presentationSchema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  speaker: z.string().min(3, "Nome do palestrante obrigatório"),
  bio: z.string().optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  day: z.number().int().min(1).max(5),
  slot: z.string().min(1, "Horário obrigatório"),
  duration: z.number().int().positive("Duração deve ser positiva"),
  maxCapacity: z.number().int().positive("Vagas deve ser positivo"),
});

// Alias for backwards compatibility with existing references to "uel"
export const uelRegisterSchema = externoRegisterSchema;

export type UnifliRegisterInput = z.infer<typeof unifilRegisterSchema>;
export type ExternoRegisterInput = z.infer<typeof externoRegisterSchema>;
export type GraduateRegisterInput = z.infer<typeof graduateRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PresentationInput = z.infer<typeof presentationSchema>;
