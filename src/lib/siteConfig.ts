import { prisma } from "@/lib/db";

// Returns the value for a given config key.
// Falls back to `defaultValue` if the table or row doesn't exist yet
// (safe during the migration window).
export async function getSiteConfig(key: string, defaultValue: string): Promise<string> {
  try {
    const row = await (prisma as any).siteConfig.findUnique({ where: { key } });
    return row?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSiteConfig(key: string, value: string): Promise<void> {
  await (prisma as any).siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
