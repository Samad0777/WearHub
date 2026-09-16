
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  LayoutGrid,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Categories", path: "/admin/categories", icon: FolderTree },
  { label: "Users", path: "/admin/users", icon: Users },
  //   { label: "Coupons", path: "/admin/coupons", icon: TicketPercent },
  //   { label: "Reviews", path: "/admin/reviews", icon: Star },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminSideBar = ({ isCollapsed, setIsCollapsed }) => {

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between overflow-hidden bg-black text-white transition-all duration-300 ${
        isCollapsed ? "w-19" : "w-55"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-b-gray-700">
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
        >
          <h2 className="font-instrumentSerif text-lg text-white">WearHub</h2>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex h-8 w-8 items-center justify-center cursor-pointer rounded-md border border-white/10 bg-white/5 text-zinc-200 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-3 pt-2">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={label}
            to={path}
            type="button"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-300 ease-out ${
                isActive
                  ? "bg-[#1c1c1c] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
              <Icon size={15} strokeWidth={1.8} />
            </span>

            <span
              className={`overflow-hidden text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 ease-out ${
                isCollapsed ? "max-w-0 opacity-0" : "max-w-35 opacity-100"
              }`}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-t-gray-700 px-3 py-3">
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-zinc-300 transition-all duration-300 ease-out hover:bg-white/5 hover:text-white ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
        >
          <ShieldCheck size={15} strokeWidth={1.8} />
          <span
            className={`overflow-hidden text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 ease-out ${
              isCollapsed ? "max-w-0 opacity-0" : "max-w-30 opacity-100"
            }`}
          >
            Exit Admin
          </span>
        </button>

        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            className={`flex items-center justify-center rounded-md bg-white/5 p-2 text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white ${
              isCollapsed ? "w-full" : "w-full"
            }`}
            aria-label="Logout"
          >
            <LogOut size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSideBar;
