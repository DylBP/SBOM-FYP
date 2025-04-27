import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import { useState } from "react";

const excludedPaths = ["/login", "/register", "/confirm-signup"];

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const showSidebar = !excludedPaths.includes(pathname);

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar background placeholder */}
      {showSidebar && (
        <div
          className={`hidden lg:block fixed top-0 left-0 h-full bg-gray-100 transition-all duration-300 z-0 ${
            collapsed ? "w-16" : "w-64"
          }`}
        />
      )}

      {/* Actual Sidebar (on top of the placeholder) */}
      {showSidebar && (
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      <div className={`flex-1 ml-0 lg:ml-${collapsed ? "16" : "64"} transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
