import { PrismaClient, UserType, SlotTime } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando banco de dados...");

  // Deletar na ordem certa para respeitar FKs
  await prisma.presentationSlot.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.user.deleteMany();
  await prisma.presentation.deleteMany();
  await prisma.product.deleteMany();

  console.log("Banco limpo.");

  // ─────────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("sauu@2025", 10);
  await prisma.user.create({
    data: {
      name: "Rafaela Maria",
      email: "rafaela.maria@edu.unifil.br",
      phone: "(43) 99999-9999",
      password: adminPassword,
      institution: "Unifil",
      type: UserType.ADMIN,
      emailVerified: true,
    },
  });

  console.log("Admin criado: rafaela.maria@edu.unifil.br / sauu@2025");

  // ─────────────────────────────────────────────
  // Palestras placeholder
  // ─────────────────────────────────────────────
  const presentations = [
    { day: 1, slot: SlotTime.SLOT_19H00, title: "PLACEHOLDER - Palestra Dia 1 - 19h", speaker: "PLACEHOLDER" },
    { day: 1, slot: SlotTime.SLOT_20H45, title: "PLACEHOLDER - Palestra Dia 1 - 20h45", speaker: "PLACEHOLDER" },
    { day: 2, slot: SlotTime.SLOT_19H00, title: "PLACEHOLDER - Palestra Dia 2 - 19h", speaker: "PLACEHOLDER" },
    { day: 2, slot: SlotTime.SLOT_20H45, title: "PLACEHOLDER - Palestra Dia 2 - 20h45", speaker: "PLACEHOLDER" },
    { day: 3, slot: SlotTime.SLOT_19H00, title: "PLACEHOLDER - Palestra Dia 3 - 19h", speaker: "PLACEHOLDER" },
    { day: 3, slot: SlotTime.SLOT_20H45, title: "PLACEHOLDER - Palestra Dia 3 - 20h45", speaker: "PLACEHOLDER" },
    { day: 4, slot: SlotTime.SLOT_19H00, title: "PLACEHOLDER - Palestra Dia 4 - 19h", speaker: "PLACEHOLDER" },
    { day: 4, slot: SlotTime.SLOT_20H45, title: "PLACEHOLDER - Palestra Dia 4 - 20h45", speaker: "PLACEHOLDER" },
    { day: 5, slot: SlotTime.SLOT_19H00, title: "PLACEHOLDER - Palestra Dia 5 - 19h", speaker: "PLACEHOLDER" },
    { day: 5, slot: SlotTime.SLOT_20H45, title: "PLACEHOLDER - Palestra Dia 5 - 20h45", speaker: "PLACEHOLDER" },
  ];

  for (const p of presentations) {
    await prisma.presentation.create({
      data: { ...p, maxCapacity: 100 },
    });
  }

  console.log("10 palestras placeholder criadas.");

  // ─────────────────────────────────────────────
  // Produtos placeholder
  // ─────────────────────────────────────────────
  const products = [
    {
      name: "Camiseta SAUU",
      description: "Camiseta oficial da Semana de Arquitetura Unifil. 100% algodão. Tamanhos: P, M, G, GG.",
      price: 45.00,
      stock: 50,
      imageUrl: "/tshirt.png",
      active: true,
    },
    {
      name: "Caneca SAUU",
      description: "Caneca de cerâmica 300ml com a identidade visual do evento.",
      price: 35.00,
      stock: 30,
      imageUrl: "/mug.png",
      active: true,
    },
    {
      name: "Ecobag SAUU",
      description: "Sacola ecológica de algodão cru com estampa exclusiva do SAUU.",
      price: 25.00,
      stock: 40,
      imageUrl: "/ecobag.png",
      active: true,
    },
    {
      name: "Boné SAUU",
      description: "Boné unissex com bordado da logomarca SAUU.",
      price: 40.00,
      stock: 20,
      imageUrl: "/cap.png",
      active: true,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log("4 produtos placeholder criados.");
  console.log("\nSeed concluído.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
