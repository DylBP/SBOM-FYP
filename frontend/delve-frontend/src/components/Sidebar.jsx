import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Menu, LogOut, LayoutDashboard, FilePlus2, BarChart2 } from "lucide-react";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generate", label: "Generate SBOMs", icon: FilePlus2 },
  { to: "/statistics", label: "Statistics", icon: BarChart2 },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full transition-all duration-300 bg-gray-900 text-white shadow-xl ${collapsed ? "w-16" : "w-64"
        }`}
    >
      <div className="flex flex-col h-full p-3 space-y-6">

        {/* Sidebar Header: Branding + Collapse Toggle */}
        <div className="flex items-center justify-between px-2">
          {!collapsed && (
            <div>
              <h1 className="text-xl font-semibold leading-tight">Delve</h1>
              <p className="text-xs text-gray-400">SBOM Dashboard</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                <Icon size={20} className="min-w-[20px]" />
                <span
                  className={`ml-3 whitespace-nowrap transition-all duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                    }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 w-full rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium"
          >
            <LogOut size={20} />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
