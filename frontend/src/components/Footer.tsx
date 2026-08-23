// Footer.tsx
export default function Footer() {
  return (
    <footer className="border-t border-red-700 bg-[#e60000]">
      <div className="mx-auto w-full px-6 py-5">
        <p className="text-center text-sm text-white md:text-left">
          &copy; {new Date().getFullYear()}{" "}
          <strong>Unidal</strong>. Todos os direitos reservados.
        </p>
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