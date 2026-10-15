import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { getProducts } from "@/lib/catalog";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage the DPC Gadget Hub catalogue.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/admin");
  if (!auth.isAdmin) redirect("/");

  const products = await getProducts({ limit: 200, sort: "newest" });

  return (
    <div className="container-page py-10">
      <AdminDashboard initialProducts={products} />
    </div>
  );
}
