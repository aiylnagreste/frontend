import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 240,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          maxWidth: "calc(100vw - 240px)",
        }}
      >
        {/* <Topbar /> */}
        <main
          style={{
            flex: 1,
            padding: "24px 28px",
            background: "var(--color-canvas)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
