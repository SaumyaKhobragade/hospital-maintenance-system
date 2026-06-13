import { DashboardLayout } from "../../components/DashboardLayout";
import { SseProvider } from "../../lib/SseContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SseProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SseProvider>
  );
}
