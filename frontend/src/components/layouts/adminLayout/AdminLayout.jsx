import AdminNavbar from "./AdminNavbar";
import { Outlet } from "react-router-dom";
import AdminSideBar from "./AdminSideBar";
import { useState } from "react";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <AdminSideBar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main
        className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-19" : "ml-55"
        }`}
      >
        <AdminNavbar isCollapsed={isCollapsed} />

        <div className="pt-18">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
