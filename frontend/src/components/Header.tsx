import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/context/LayoutContext";
import { Link } from "react-router-dom";
import { Button } from '../components/ui/button';

export default function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();
  console.log('usario', user);

  return (
    <header className="h-16 px-4 flex items-center justify-between bg-white border-b shadow-sm sticky top-0 z-10">
      <Button
        variant="ghost"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>
      {/* <div className="flex items-center gap-2">
        <img src="/logo_unidal_editado.png" alt="Logo Unidal" className="h-10 w-auto" />
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-700 hover:text-black"
        >
          <Menu size={24} />
        </button>
        <span className="text-lg font-semibold text-gray-800">Unidal</span>
      </div> */}
      {/* <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Unidal Logo" className="h-10 w-auto" />
        <span className="text-xl font-semibold text-gray-800">Unidal</span>
      </div> */}
      <div className="flex items-center gap-2" style={{ float: 'left',marginLeft: '40%' }}>
        <img style={{ width: '20%' }} src="/logo_unidal_editado.png" alt="Unidal Logo" className="h-8 w-auto" />
        {/* <span className="font-semibold text-xl text-gray-800">Unidal</span> */}
      </div>
      {/* NAV SÓ APARECE EM TELAS GRANDES */}
      {/* <nav className="hidden md:flex space-x-6 text-sm text-gray-700">
        <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <Link to="/projetos" className="hover:text-blue-600">Projetos</Link>
        <Link to="/relatorios" className="hover:text-blue-600">Relatórios</Link>
        <Link to="/usuarios" className="hover:text-blue-600">Usuários</Link>
      </nav> */}

      {/* BOTÃO HAMBÚRGUER APARECE SÓ EM TELAS PEQUENAS */}
      {/* <button
        onClick={toggleSidebar}
        className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
      >
        <Menu className="w-6 h-6" />
      </button> */}
      <div className="flex items-center gap-4" style={{ float: 'right', width: '30%' }}>
        <span className="text-sm text-gray-600" style={{ float: 'right', width: '60%' }}>Olá, {user?.name || 'Usuário'}</span>
        <button
          onClick={logout}
          className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-sm"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
// import React from "react";

// const Header: React.FC = () => {
//   return (
//     <header className="bg-blue-700 text-white px-4 py-3 shadow">
//       <h1 className="text-xl font-semibold">UNIDAL</h1>
//     </header>
//   );
// };

// export default Header;
