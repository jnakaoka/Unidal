// Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, BarChartBig, UserCog, LogOut, CreditCard, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/context/LayoutContext";
import clsx from "clsx";


const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useLayout();
  const location = useLocation();
  const { user, logout } = useAuth();
  const reportsRouteActive = location.pathname.toLowerCase().startsWith("/relatorios");
  const [reportsOpen, setReportsOpen] = useState(reportsRouteActive);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };

  const menuItems = [
    // {
    //   label: "Dashboard",
    //   to: user?.perfil === "admin" ? "/dashboard" : "/operador-dashboard",
    //   icon: <LayoutDashboard size={18} />,
    //   showFor: ["admin", "operador"],
    // },
    {
      label: "Registro de Horas",
      to: "/registro-horas",
      icon: <Clock size={18} />,
      showFor: ["admin", "operador", "motorista"],
    },
    // {
    //   label: "Projetos",
    //   to: "/projetos",
    //   icon: <FolderKanban size={18} />,
    //   showFor: ["admin"],
    // },
    {
      label: "Usuários",
      to: "/usuarios",
      icon: <UserCog size={18} />,
      showFor: ["admin"],
    },
    {
      label: "Clientes",
      to: "/clientes",
      icon: <UserCog size={18} />,
      showFor: ["admin"],
    },
    {
      label: "Obras",
      to: "/obras",
      icon: <UserCog size={18} />,
      showFor: ["admin"],
    },
    {
      label: "Controle de cartões",
      to: "/controle-cartoes",
      icon: <CreditCard size={18} />,
      showFor: ["admin"],
    },
    // {
    //   label: "Trocar Password",
    //   to: "/change-password",
    //   icon: <Clock size={18} />,
    //   showFor: ["admin", "operador"],
    // },
  ];

  const visibleMenuItems = menuItems.filter(item => item.showFor.includes(user?.perfil || ""));

  return (
    <>
      {/* {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-40 md:hidden"
          onClick={closeSidebar}
        />
      )} */}
      <aside className={clsx(
          "fixed inset-y-0 left-0 z-40",
          "h-screen w-64 overflow-y-auto",
          "bg-white shadow-md",
          "transition-transform duration-300 ease-in-out",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full",
        )}
      >
        <div className="flex min-h-full flex-col p-4">
          <div className="mb-6 flex justify-center">
            <img
              src="/logo_unidal_editado.png"
              alt="Unidal"
              className="h-20 w-20 object-contain"
            />
          </div>
          <nav className="flex-1">
            <ul className="space-y-3" style={{ listStyle: 'none', margin: '5% 0 0 4%', padding: '0' }}>
              {visibleMenuItems.slice(0, 1).map((item, idx) => (
                <li key={idx}>
                  <Link
                    to={item.to}
                    onClick={handleLinkClick}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-2 rounded-md transition text-gray-700 menu-element menu-element:hover ",
                      location.pathname === item.to && "bg-indigo-200 font-semibold"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
              {user?.perfil === "admin" && (
                <li>
                  <button
                    type="button"
                    onClick={() => setReportsOpen((open) => !open)}
                    aria-expanded={reportsOpen}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-md px-4 py-2 text-gray-700 transition hover:bg-indigo-100",
                      reportsRouteActive && "bg-indigo-200 font-semibold"
                    )}
                  >
                    <BarChartBig size={18} />
                    <span className="flex-1 text-left">Relatórios</span>
                    <ChevronDown
                      size={16}
                      className={clsx("transition-transform", reportsOpen && "rotate-180")}
                    />
                  </button>
                  {reportsOpen && (
                    <ul className="mt-2 space-y-1 border-l border-indigo-100 pl-5">
                      {[
                        { label: "Obras e Produção", to: "/relatorios" },
                        { label: "Motoristas", to: "/relatoriosmotorista" },
                        { label: "Dias Trabalhados", to: "/relatorios/dias-trabalhados" },
                      ].map((report) => (
                        <li key={report.to}>
                          <Link
                            to={report.to}
                            onClick={handleLinkClick}
                            className={clsx(
                              "block rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700",
                              location.pathname.toLowerCase() === report.to && "bg-indigo-100 font-semibold text-indigo-700"
                            )}
                          >
                            {report.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}
              {visibleMenuItems.slice(1).map((item, idx) => (
                <li key={idx}>
                  <Link
                    to={item.to}
                    onClick={handleLinkClick}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-2 rounded-md transition text-gray-700 menu-element menu-element:hover ",
                      location.pathname === item.to && "bg-indigo-200 font-semibold"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6">
            <button
              onClick={() => {
                logout();
                handleLinkClick();
              }}
              style={{ margin: '0 0 5% 0' }}
              className="flex items-center gap-2 text-red-400 hover:text-red-600 px-4"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;













//sidebar.tsx old
// import { Link, useLocation } from "react-router-dom";
// import { LayoutDashboard, Clock, FolderKanban, BarChartBig, UserCog, LogOut } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";
// import { useLayout } from "@/context/LayoutContext";
// import clsx from "clsx";

// interface SidebarProps {
//   isOpen: boolean;
//   onClose?: () => void;
// }

// const Sidebar = ({ isOpen }: SidebarProps) => {
//   const { closeSidebar } = useLayout();
//   const location = useLocation();
//   const { user, logout } = useAuth();

//   const handleLinkClick = () => {
//     // Fecha o menu se estiver em mobile (largura < md)
//     //if (window.innerWidth < 768) {
//       closeSidebar?.(); // evita erro se for undefined
//     //}
//   };

//   const menuItems = [
//     {
//       label: "Dashboard",
//       to: user?.perfil === "admin" ? "/dashboard" : "/operador-dashboard",
//       icon: <LayoutDashboard size={18} />,
//       showFor: ["admin", "operador"],
//     },
//     {
//       label: "Registro de Horas",
//       to: "/registro-horas",
//       icon: <Clock size={18} />,
//       showFor: ["admin", "operador"],
//     },
//     {
//       label: "Projetos",
//       to: "/projetos",
//       icon: <FolderKanban size={18} />,
//       showFor: ["admin"],
//     },
//     {
//       label: "Relatórios",
//       to: "/relatorios",
//       icon: <BarChartBig size={18} />,
//       showFor: ["admin", "operador"],
//     },
//     {
//       label: "Usuários",
//       to: "/usuarios",
//       icon: <UserCog size={18} />,
//       showFor: ["admin"],
//     },
//   ];

//   const visibleMenuItems = menuItems.filter(item => item.showFor.includes(user?.perfil || ""));

//   return (
//     // <aside style={{ backgroundColor: 'white', borderEndEndRadius: '3px', borderColor: 'lightgray', marginRight: '1%'}}
//     //       className={clsx(
//     //                   "p-4 transition-all duration-300 ease-in-out overflow-hidden bg-yellow-100 border border-radius",
//     //                   isOpen
//     //                     ? "w-64 border-red-500"
//     //                     : "absolute -left-64 w-0 border-blue-500 pointer-events-none opacity-0",
//     //                   "md:static md:w-64 md:opacity-100 md:pointer-events-auto"
//     //                 )}
//     //     >
//     <>
//     {/* BACKDROP overlay - só em mobile */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
//           onClick={closeSidebar}
//         />
//       )}
//     <aside
//       className={clsx(
//         "fixed z-20 bg-white h-full shadow-md transition-transform duration-300 ease-in-out",
//           isOpen ? "translate-x-0" : "-translate-x-full",
//           "w-64 md:translate-x-0 md:static md:block"
//       )}
//     >
//       <div
//         // className="sidebar-header mb-6 text-lg font-bold"
//         className="text-3xl font-bold text-gray-800"
//         >
//           <img style={{ width: '10%' }} src="/logo_unidal_editado.png" alt="Unidal Logo" className="h-8 w-auto" />
//         {/* <img alt="Unidal Logo" className="h-8 w-auto" src="/logo_unidal_editado.png" style={{ width: "50%", margin: "7% 0 0 0"}} ></img>   */}
//         </div>
//       <ul className="space-y-3 text-sm" style={{ listStyle: 'none', margin: '15% 5% 0px 5%', padding: '0' }}>
//         {visibleMenuItems.map((item, idx) => (
//           <li key={idx} style={{ color: 'black' }}>
//             <Link style={{ color: 'black' }}
//               onClick={handleLinkClick}
//               to={item.to}
//               className={clsx(
//                 "flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition rounded-md",
//                 location.pathname === item.to ? "bg-blue-800 font-semibold" : ""
//               )}
//             >
//               {item.icon}
//               {item.label}
//             </Link>
//           </li>
//         ))}
//         <li style={{ color: 'gray', marginTop: '5%' }}>
//           <button
//             onClick={() => {
//               logout();
//               handleLinkClick();
//             }}
//             className="flex items-center gap-2 px-2 py-1 text-red-300 hover:text-red-500"
//           >
//             <LogOut size={18} />
//             Sair
//           </button>
//         </li>
//       </ul>
//     </aside>
//     </>
//   );
// };

// export default Sidebar;




// import { Link, useLocation } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   Clock,
//   FileText,
//   LogOut,
//   X,
//   FolderKanban,
//   BarChartBig,
//   UserCog,
// } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";
// import { useLayout } from "@/context/LayoutContext";
// import clsx from "clsx";

// const Sidebar = () => {
//   const location = useLocation();
//   const { user, logout } = useAuth();
//   const { isSidebarOpen, closeSidebar } = useLayout();

//   const menuItems = [
//     {
//       label: "Dashboard",
//       to: "/dashboard",
//       icon: <LayoutDashboard size={18} />,
//       showFor: ["admin"],
//     },
//     {
//       label: "Dashboard",
//       to: "/operador-dashboard",
//       icon: <LayoutDashboard size={18} />,
//       showFor: ["operador"],
//     },
//     {
//       label: "Registro de Horas",
//       to: "/registro-horas",
//       icon: <Clock size={18} />,
//       showFor: ["admin", "operador"],
//     },
//     {
//       label: "Projetos",
//       to: "/projetos",
//       icon: <FolderKanban size={18} />,
//       showFor: ["admin"],
//     },
//     {
//       label: "Relatórios",
//       to: "/relatorios",
//       icon: <BarChartBig size={18} />,
//       showFor: ["admin", "operador"],
//     },
//     {
//       label: "Usuários",
//       to: "/usuarios",
//       icon: <UserCog size={18} />,
//       showFor: ["admin"],
//     },
//   ];

//   return (
//     <div className="md:hidden">
//       {/* BACKDROP */}
//       {isSidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-40 z-30"
//           onClick={closeSidebar}
//         />
//       )}

//       {/* SIDEBAR */}
//       <aside
//         className={clsx(
//           "fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-200 ease-in-out",
//           {
//             "-translate-x-full": !isSidebarOpen,
//             "translate-x-0": isSidebarOpen,
//           }
//         )}
//       >
//         <div className="h-16 flex items-center justify-between px-4 border-b">
//           <span className="text-xl font-bold">Unidal</span>
//           <button
//             className="text-gray-600 hover:text-black"
//             onClick={closeSidebar}
//           >
//             <X size={22} />
//           </button>
//         </div>
//         <nav className="flex flex-col p-4 space-y-2">
//           {menuItems
//             .filter((item) => item.showFor.includes(user?.perfil || ""))
//             .map((item) => (
//               <Link
//                 key={item.to}
//                 to={item.to}
//                 onClick={closeSidebar}
//                 className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
//                   location.pathname === item.to
//                     ? "bg-blue-100 text-blue-700"
//                     : "text-gray-700 hover:bg-gray-100"
//                 }`}
//               >
//                 {item.icon}
//                 {item.label}
//               </Link>
//             ))}
//           <button
//             onClick={() => {
//               logout();
//               closeSidebar();
//             }}
//             className="mt-4 flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100"
//           >
//             <LogOut size={18} />
//             Sair
//           </button>
//         </nav>
//       </aside>
//     </div>
//   );
// };

// export default Sidebar;




//old working
{/* Botão mobile */}
      // <button
      //   className="md:hidden p-2 fixed top-4 left-4 z-50 bg-white rounded shadow"
      //   onClick={() => setIsOpen(true)}
      // >
      //   <Menu />
      // </button>

      // {/* Overlay */}
      // {isOpen && (
      //   <div
      //     className="fixed inset-0 bg-black bg-opacity-50 z-40"
      //     onClick={() => setIsOpen(false)}
      //   />
      // )}

      // {/* Sidebar */}
      // <div
      //   className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 transform transition-transform duration-300
      //     ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      //     md:relative md:translate-x-0 md:shadow-none md:w-64 md:block`}
      // >
      //   {/* Botão de fechar no mobile */}
      //   <div className="md:hidden p-4 flex justify-end">
      //     <button onClick={() => setIsOpen(false)}>
      //       <X />
      //     </button>
      //   </div>

      //   {/* Conteúdo do menu */}
      //   <nav className="p-4 space-y-2">
      //     {menuItems
      //       .filter((item) => item.showFor.includes(user?.perfil || ""))
      //       .map((item) => (
      //         <Link
      //           key={item.to}
      //           to={item.to}
      //           onClick={closeSidebar}
      //           className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
      //             location.pathname === item.to
      //               ? "bg-blue-100 text-blue-700"
      //               : "text-gray-700 hover:bg-gray-100"
      //           }`}
      //         >
      //           {item.icon}
      //           {item.label}
      //         </Link>
      //       ))}
      //     <button
      //       onClick={() => {
      //         logout();
      //         closeSidebar();
      //       }}
      //       className="mt-4 flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100"
      //     >
      //       <LogOut size={18} />
      //       Sair
      //     </button>
      //     {/* <a href="/dashboard" className="block text-gray-700 hover:text-blue-500">Dashboard</a>
      //     <a href="#" className="block text-gray-700 hover:text-blue-500">Projetos</a>
      //     <a href="#" className="block text-gray-700 hover:text-blue-500">Usuários</a> */}
      //   </nav>
      // </div>
