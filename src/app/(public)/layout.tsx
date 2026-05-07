import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/lib/siteConfig";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const lojaAtiva = (await getSiteConfig("lojaAtiva", "true")) === "true";

  return (
    <>
      <Header showLoja={lojaAtiva} />
      <div className="pt-[70px]">{children}</div>
      <Footer />
    </>
  );
}
