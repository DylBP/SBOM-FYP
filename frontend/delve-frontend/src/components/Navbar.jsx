import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        location.pathname === to
          ? "bg-indigo-700 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-gray-600 fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-white">Delve</span>
            <span className="text-sm text-gray-400">SBOM Dashboard</span>
          </div>

          {/* Links + Logout */}
          <div className="flex items-center gap-4">
            {navLink("/", "Dashboard")}
            {navLink("/upload", "Upload")}
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm font-medium transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
