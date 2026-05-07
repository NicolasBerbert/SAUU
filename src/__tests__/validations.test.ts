import { describe, it, expect, vi } from "vitest";

// Mock do @prisma/client para não depender de banco em testes unitários
vi.mock("@prisma/client", () => ({
  UserType: {
    UNIFIL: "UNIFIL",
    UEL: "UEL",
    FORMADO: "FORMADO",
    ADMIN: "ADMIN",
  },
}));

import {
  unifilRegisterSchema,
  uelRegisterSchema,
  graduateRegisterSchema,
  loginSchema,
  productSchema,
  presentationSchema,
} from "@/lib/validations";

// ─── Dados base válidos ───────────────────────────────────────────────────

const baseValido = {
  name: "Fulano de Tal",
  phone: "(43) 99999-9999",
  password: "senha123",
  confirmPassword: "senha123",
  institution: "Unifil",
};

// ─── UNIFIL ───────────────────────────────────────────────────────────────

describe("unifilRegisterSchema", () => {
  const dadosValidos = {
    ...baseValido,
    type: "UNIFIL" as const,
    email: "fulano@edu.unifil.br",
  };

  it("aceita dados válidos", () => {
    expect(() => unifilRegisterSchema.parse(dadosValidos)).not.toThrow();
  });

  it("rejeita email fora do domínio @edu.unifil.br", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      email: "fulano@gmail.com",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita email de subdomínio parecido", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      email: "fulano@edu.unifil.br.atacante.com",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita senha sem número", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      password: "semalfanum",
      confirmPassword: "semalfanum",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      password: "abc1",
      confirmPassword: "abc1",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita quando senhas não coincidem", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      password: "senha123",
      confirmPassword: "senha456",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome com menos de 3 caracteres", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      name: "Ab",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita telefone muito curto", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      phone: "123",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita telefone com letras", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...dadosValidos,
      phone: "ABCDE-FGHI",
    });
    expect(resultado.success).toBe(false);
  });
});

// ─── UEL ─────────────────────────────────────────────────────────────────

describe("uelRegisterSchema", () => {
  const dadosValidos = {
    ...baseValido,
    type: "EXTERNO" as const,
    email: "aluno@uel.br",
    ra: "12345",
  };

  it("aceita qualquer email válido", () => {
    expect(() => uelRegisterSchema.parse(dadosValidos)).not.toThrow();
  });

  it("aceita email gmail (instituição externa não exige domínio específico)", () => {
    expect(() =>
      uelRegisterSchema.parse({ ...dadosValidos, email: "aluno@gmail.com" })
    ).not.toThrow();
  });

  it("aceita RA curto (formato a ser definido)", () => {
    const resultado = uelRegisterSchema.safeParse({ ...dadosValidos, ra: "123" });
    expect(resultado.success).toBe(true);
  });

  it("aceita sem RA (campo opcional)", () => {
    const resultado = uelRegisterSchema.safeParse({ ...dadosValidos, ra: "" });
    expect(resultado.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const resultado = uelRegisterSchema.safeParse({
      ...dadosValidos,
      email: "nao-e-email",
    });
    expect(resultado.success).toBe(false);
  });
});

// ─── FORMADO ──────────────────────────────────────────────────────────────

describe("graduateRegisterSchema", () => {
  const anoAtual = new Date().getFullYear();
  const dadosValidos = {
    ...baseValido,
    type: "FORMADO" as const,
    email: "formado@gmail.com",
    graduationYear: 2020,
    graduationInstitution: "UEL",
  };

  it("aceita dados válidos", () => {
    expect(() => graduateRegisterSchema.parse(dadosValidos)).not.toThrow();
  });

  it("aceita ano de formatura igual ao ano atual", () => {
    expect(() =>
      graduateRegisterSchema.parse({ ...dadosValidos, graduationYear: anoAtual })
    ).not.toThrow();
  });

  it("rejeita ano de formatura no futuro", () => {
    const resultado = graduateRegisterSchema.safeParse({
      ...dadosValidos,
      graduationYear: anoAtual + 1,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita ano de formatura antes de 1990", () => {
    const resultado = graduateRegisterSchema.safeParse({
      ...dadosValidos,
      graduationYear: 1989,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita instituição de graduação vazia", () => {
    const resultado = graduateRegisterSchema.safeParse({
      ...dadosValidos,
      graduationInstitution: "A",
    });
    expect(resultado.success).toBe(false);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("aceita credenciais válidas", () => {
    expect(() =>
      loginSchema.parse({ email: "user@example.com", password: "qualquercoisa" })
    ).not.toThrow();
  });

  it("rejeita email inválido", () => {
    expect(
      loginSchema.safeParse({ email: "invalido", password: "123" }).success
    ).toBe(false);
  });

  it("rejeita senha vazia", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "" }).success
    ).toBe(false);
  });
});

// ─── Produto ──────────────────────────────────────────────────────────────

describe("productSchema", () => {
  const produtoValido = {
    name: "Camiseta SAUU",
    price: 49.9,
    stock: 100,
    active: true,
  };

  it("aceita produto válido", () => {
    expect(() => productSchema.parse(produtoValido)).not.toThrow();
  });

  it("aceita produto com imageUrl vazia (string vazia permitida)", () => {
    expect(() =>
      productSchema.parse({ ...produtoValido, imageUrl: "" })
    ).not.toThrow();
  });

  it("rejeita preço zero", () => {
    expect(productSchema.safeParse({ ...produtoValido, price: 0 }).success).toBe(false);
  });

  it("rejeita preço negativo", () => {
    expect(productSchema.safeParse({ ...produtoValido, price: -10 }).success).toBe(false);
  });

  it("rejeita estoque negativo", () => {
    expect(productSchema.safeParse({ ...produtoValido, stock: -1 }).success).toBe(false);
  });

  it("aceita estoque zero", () => {
    expect(() => productSchema.parse({ ...produtoValido, stock: 0 })).not.toThrow();
  });

  it("rejeita imageUrl inválida (não é URL nem string vazia)", () => {
    expect(
      productSchema.safeParse({ ...produtoValido, imageUrl: "nao-e-url" }).success
    ).toBe(false);
  });
});

// ─── Palestra ─────────────────────────────────────────────────────────────

describe("presentationSchema", () => {
  const palestraValida = {
    title: "Arquitetura Bioclimática",
    speaker: "Ana Souza",
    day: 1,
    slot: "SLOT_19H00" as const,
    maxCapacity: 50,
  };

  it("aceita palestra válida", () => {
    expect(() => presentationSchema.parse(palestraValida)).not.toThrow();
  });

  it("aceita dia 4 (último dia)", () => {
    expect(() =>
      presentationSchema.parse({ ...palestraValida, day: 4 })
    ).not.toThrow();
  });

  it("rejeita dia 0", () => {
    expect(presentationSchema.safeParse({ ...palestraValida, day: 0 }).success).toBe(false);
  });

  it("rejeita dia 5", () => {
    expect(presentationSchema.safeParse({ ...palestraValida, day: 5 }).success).toBe(false);
  });

  it("rejeita slot inválido", () => {
    expect(
      presentationSchema.safeParse({ ...palestraValida, slot: "SLOT_18H00" }).success
    ).toBe(false);
  });

  it("aceita SLOT_20H45", () => {
    expect(() =>
      presentationSchema.parse({ ...palestraValida, slot: "SLOT_20H45" })
    ).not.toThrow();
  });

  it("rejeita capacidade zero", () => {
    expect(
      presentationSchema.safeParse({ ...palestraValida, maxCapacity: 0 }).success
    ).toBe(false);
  });
});
