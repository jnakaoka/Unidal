// Footer.tsx
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/context/LayoutContext";

export default function Footer() {
  return (
    <footer className="footer-bg-red-600 mt-12">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div style={{ color: 'white' }} className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} <strong>Unidal</strong>. Todos os direitos reservados.</p>
          </div>
          {/* <div className="flex space-x-4">
            <a href="/sobre" className="text-sm text-gray-600 hover:text-red-600">Sobre</a>
            <a href="/contato" className="text-sm text-gray-600 hover:text-red-600">Contato</a>
            <a href="/privacidade" className="text-sm text-gray-600 hover:text-red-600">Privacidade</a>
          </div> */}
        </div>
      </div>
    </footer>
  );
}



// export default function Header() {
//   const { user, logout } = useAuth();
//   const { toggleSidebar } = useLayout();

//   return (
//     <footer className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-t z-10">
//       {/* Botão hambúrguer - số aparece no mobile */}
//       <button onClick={toggleSidebar} className="md:hidden text-gray-700 hover:text-black">
//         <Menu className="h-6 w-6" />
//       </button>

//       {/* Centro: Logo responsiva */}
//       <div className="flex items-center gap-2" style={{ paddingLeft: '38%' }}>
//         <img
//           style={{ width: '25%' }}
//           src="/logo_unidal_editado.png"
//           alt="Unidal Logo"
//           className="h-8 w-auto"
//         />
//         <span className="font-semibold text-lg text-gray-800 hidden sm:inline">Unidal</span>
//       </div>

//       {/* Direita: Saudação + botão Sair */}
//       <div className="flex items-center gap-4">
//         <span className="text-sm text-gray-600 hidden sm:block">        
//           Olá, {user?.name || "Usuário"}
//         </span>
//         <button
//           onClick={logout}
//           className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
//         >
//           Sair
//         </button>
//       </div>
//     </footer>
//   );
// }