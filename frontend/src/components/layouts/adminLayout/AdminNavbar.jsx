import React from "react";

const AdminNavbar = ({isCollapsed}) => {
  return (
    <nav
      className={`fixed top-0 right-0 z-40  h-18 items-center justify-end bg-white px-10 shadow-md transition-all duration-300 md:flex ${
        isCollapsed ? "left-19" : "left-55"
      }`}
    >
      <div className="flex items-center justify-end gap-2 py-2">
        <h2>Admin</h2>

        <p className="bg-black px-3 py-1 text-white">A</p>
      </div>
    </nav>
  );
};

export default AdminNavbar;
