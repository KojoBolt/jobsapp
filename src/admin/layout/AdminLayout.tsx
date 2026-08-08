import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar, { SIDEBAR_W, SIDEBAR_W_COLLAPSED } from "./AdminSidebar";
import AdminBottomNav from "./AdminBottomNav";
import { useSidebar } from "../context/SidebarContext";
import { AdminActionsProvider } from "../context/AdminActionsContext";

const AdminLayout = () => {
  const { isExpanded, isHovered } = useSidebar();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Width comes from the sidebar module so the two can never disagree.
  const sidebarWidth = isExpanded || isHovered ? SIDEBAR_W : SIDEBAR_W_COLLAPSED;

  return (
    <AdminActionsProvider>
      <div className="min-h-screen bg-[#F4F4F2] dark:bg-[#0D0D0D]">
        <AdminSidebar />

        <div
          className="transition-all duration-300"
          style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
        >
          <AdminHeader />
          {/* pb-24 below lg clears the fixed bottom nav. */}
          <main className="p-4 pb-24 sm:p-5 lg:pb-5">
            <Outlet />
          </main>
          <AdminBottomNav />
        </div>
      </div>
    </AdminActionsProvider>
  );
};

export default AdminLayout;