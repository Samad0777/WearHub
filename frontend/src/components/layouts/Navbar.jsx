import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Search, Heart, Handbag, User, Menu, X } from "lucide-react";

const mobileLinks = [
  { label: "Home", to: "/home" },
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/categories" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Account", to: "/account" },
  { label: "Orders", to: "/orders" },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="hidden md:flex justify-between items-center px-20 py-4 bg-white shadow-md">
        <div className="flex gap-8 items-center text-sm">
          <Link to="/home" className="text-xl font-instrumentSerif">
            WearHub
          </Link>
          <NavLink
            className={({ isActive }) =>
              `hover:text-text-secondary transition-colors ${isActive ? "text-text-secondary" : "text-foreground"}`
            }
            to="/home"
          >
            HOME
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `hover:text-text-secondary transition-colors ${isActive ? "text-text-secondary" : "text-foreground"}`
            }
            to="/shop"
          >
            SHOP
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `hover:text-text-secondary transition-colors ${isActive ? "text-text-secondary" : "text-foreground"}`
            }
            to="/categories"
          >
            CATEGORIES
          </NavLink>
        </div>
        <div className="flex gap-6 items-center">
          <div className="hover:bg-[#F0EFEB] p-2 cursor-pointer">
            <Search strokeWidth={1.4} size={20} />
          </div>
          <div className="hover:bg-[#F0EFEB] p-2 cursor-pointer">
            <Handbag strokeWidth={1.4} size={20} />
          </div>
          <div className="hover:bg-[#F0EFEB] p-2 cursor-pointer">
            <Heart strokeWidth={1.4} size={20} />
          </div>
          <div className="hover:bg-[#F0EFEB] p-2 cursor-pointer">
            <User strokeWidth={1.4} size={20} />
          </div>
        </div>
      </nav>

      <nav className="md:hidden flex justify-between items-center px-4 py-4 bg-white shadow-md">
        <Link to="/home" className="text-xl font-instrumentSerif">
          WearHub
        </Link>
        <div className="flex gap-4 items-center">
          <div className="hover:bg-[#F0EFEB] p-2 cursor-pointer">
            <Search strokeWidth={1.4} size={20} />
          </div>
          <div className="hover:bg-[#F0EFEB] p-2 cursor-pointer">
            <Handbag strokeWidth={1.4} size={20} />
          </div>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="hover:bg-[#F0EFEB] p-2 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu strokeWidth={1.4} size={20} />
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-black/45 cursor-default"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-90 flex-col bg-[#f2f1ee] px-5 pb-6 pt-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <p className="text-xl font-instrumentSerif leading-none">
                WearHub
              </p>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="p-2 text-black"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X strokeWidth={1.4} size={20} />
              </button>
            </div>

            <nav className="mt-4 flex-1">
              <ul className="space-y-2">
                {mobileLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `block border-b border-black/10 py-4 font-medium leading-none tracking-[-0.02em] transition-colors ${
                          isActive
                            ? "text-text-secondary bg-[#F0EFEB]"
                            : "text-foreground"
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
