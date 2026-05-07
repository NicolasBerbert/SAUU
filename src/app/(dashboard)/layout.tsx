import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getSiteConfig } from "@/lib/siteConfig";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const lojaAtiva = (await getSiteConfig("lojaAtiva", "true")) === "true";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header showLoja={lojaAtiva} />
      <main className="mx-auto max-w-[1320px] px-8 pt-[70px] py-12">{children}</main>
    </div>
  );
}
