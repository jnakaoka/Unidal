import React from "react";
import { Link } from "react-router-dom";

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-gray-100 w-64 p-4 min-h-screen shadow">
      <nav className="space-y-2">
        <Link to="/" className="block text-gray-800 hover:text-blue-600">
          Dashboard
        </Link>
        <Link to="/login" className="block text-gray-800 hover:text-blue-600">
          Login
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
