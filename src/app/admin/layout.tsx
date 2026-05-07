import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <AdminNav />
      <main className="flex-1 max-w-5xl px-10 py-10">{children}</main>
    </div>
  );
}
