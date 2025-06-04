import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const linksAdmin = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/usuarios", label: "Usuários" },
    { to: "/projetos", label: "Projetos" },
  ];

  const linksOperador = [
    { to: "/operador-dashboard", label: "Dashboard" },
    { to: "/registro-horas", label: "Registro de Horas" },
  ];

  const links = user.perfil === "admin" ? linksAdmin : linksOperador;

  return (
    <>
      {/* Botão mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-blue-600 p-2 rounded"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r shadow-md w-64 p-6 z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <h2 className="text-xl font-bold text-blue-600 mb-6">Unidal</h2>
        <ul className="space-y-4">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`block px-3 py-2 rounded hover:bg-blue-100 ${
                  location.pathname === link.to
                    ? "bg-blue-100 text-blue-600 font-semibold"
                    : "text-gray-700"
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <hr className="my-4" />
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded"
        >
          Sair
        </button>
      </div>
    </>
  );
};

export default Sidebar;
