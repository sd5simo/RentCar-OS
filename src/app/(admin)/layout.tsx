import AuthGuard from "@/components/layout/AuthGuard";
import SidebarLayout from "@/components/layout/SidebarLayout";
import DataLoader from "@/components/layout/DataLoader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DataLoader>
        <SidebarLayout>{children}</SidebarLayout>
      </DataLoader>
    </AuthGuard>
  );
}
