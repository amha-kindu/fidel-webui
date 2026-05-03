import RequireAuth from "@/components/auth/RequireAuth";
import Sidebar from "@/components/Sidebar";

export default function Layout({ children }) {
  return (
    <RequireAuth>
      <div className="brand-shell flex h-full min-h-0 min-w-0">
        <Sidebar />
        <div className="flex min-w-0 flex-1 pt-16 md:pt-0">{children}</div>
      </div>
    </RequireAuth>
  );
}
