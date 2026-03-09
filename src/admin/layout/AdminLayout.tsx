import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useSidebar } from "../context/SidebarContext";

const AdminLayout = () => {
  const { isExpanded, isHovered } = useSidebar();

  const sidebarWidth = isExpanded || isHovered ? 290 : 90;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      {/* Push content right to make room for the fixed sidebar */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <AdminHeader />
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;