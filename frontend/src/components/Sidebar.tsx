// Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock, BarChartBig, UserCog, LogOut, CreditCard, ChevronDown, Wrench, ClipboardList, Warehouse } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/context/LayoutContext";
import clsx from "clsx";

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useLayout();
  const location = useLocation();
  const { user, logout } = useAuth();
  const temFuncao = (codigo: string) => (user?.funcoes || []).some((f) => f.codigo === codigo && f.is_active);
  const podeOcorrencias = user?.perfil === "admin" || temFuncao("CHEFE_EQUIPE") || temFuncao("RESPONSAVEL_ESTALEIRO");
  const podeEstaleiro = user?.perfil === "admin" || temFuncao("CHEFE_EQUIPE") || temFuncao("RESPONSAVEL_ESTALEIRO");
  const reportsRouteActive = location.pathname.toLowerCase().startsWith("/relatorios");
  const [reportsOpen, setReportsOpen] = useState(reportsRouteActive);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) closeSidebar();
  };

  const menuItems = [
    { label: "Registro de Horas", to: "/registro-horas", icon: <Clock size={18} />, showFor: ["admin", "operador", "motorista"] },
    ...(podeOcorrencias ? [{ label: "Ocorrências", to: "/ocorrencias", icon: <ClipboardList size={18} />, showFor: ["admin", "operador"] }] : []),
    ...(podeEstaleiro ? [{ label: "Armazém", to: "/estaleiro", icon: <Warehouse size={18} />, showFor: ["admin", "operador"] }] : []),
    { label: "Usuários", to: "/usuarios", icon: <UserCog size={18} />, showFor: ["admin"] },
    { label: "Clientes", to: "/clientes", icon: <UserCog size={18} />, showFor: ["admin"] },
    { label: "Obras", to: "/obras", icon: <UserCog size={18} />, showFor: ["admin"] },
    { label: "Controle de cartões", to: "/controle-cartoes", icon: <CreditCard size={18} />, showFor: ["admin"] },
    { label: "Máquinas", to: "/maquinas", icon: <Wrench size={18} />, showFor: ["admin"] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.showFor.includes(user?.perfil || ""));

  return <>
    <aside className={clsx("fixed inset-y-0 left-0 z-40","h-screen w-64 overflow-y-auto","bg-white shadow-md","transition-transform duration-300 ease-in-out",isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex min-h-full flex-col p-4">
        <div className="mb-6 flex justify-center"><img src="/logo_unidal_editado.png" alt="Unidal" className="h-20 w-20 object-contain" /></div>
        <nav className="flex-1"><ul className="space-y-3" style={{ listStyle:'none', margin:'5% 0 0 4%', padding:'0' }}>
          {visibleMenuItems.slice(0,1).map((item,idx)=><li key={idx}><Link to={item.to} onClick={handleLinkClick} className={clsx("flex items-center gap-3 px-4 py-2 rounded-md transition text-gray-700 menu-element menu-element:hover ",location.pathname===item.to&&"bg-indigo-200 font-semibold")}>{item.icon}{item.label}</Link></li>)}
          {user?.perfil === "admin" && <li>
            <button type="button" onClick={()=>setReportsOpen(open=>!open)} aria-expanded={reportsOpen} className={clsx("flex w-full items-center gap-3 rounded-md px-4 py-2 text-gray-700 transition hover:bg-indigo-100",reportsRouteActive&&"bg-indigo-200 font-semibold")}><BarChartBig size={18}/><span className="flex-1 text-left">Relatórios</span><ChevronDown size={16} className={clsx("transition-transform",reportsOpen&&"rotate-180")}/></button>
            {reportsOpen&&<ul className="mt-2 space-y-1 border-l border-indigo-100 pl-5">{[
              {label:"Obras e Produção",to:"/relatorios"},{label:"Motoristas",to:"/relatoriosmotorista"},{label:"Dias Trabalhados",to:"/relatorios/dias-trabalhados"}
            ].map(report=><li key={report.to}><Link to={report.to} onClick={handleLinkClick} className={clsx("block rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700",location.pathname.toLowerCase()===report.to&&"bg-indigo-100 font-semibold text-indigo-700")}>{report.label}</Link></li>)}</ul>}
          </li>}
          {visibleMenuItems.slice(1).map((item,idx)=><li key={idx}><Link to={item.to} onClick={handleLinkClick} className={clsx("flex items-center gap-3 px-4 py-2 rounded-md transition text-gray-700 menu-element menu-element:hover ",location.pathname===item.to&&"bg-indigo-200 font-semibold")}>{item.icon}{item.label}</Link></li>)}
        </ul></nav>
        <div className="mt-6"><button onClick={()=>{logout();handleLinkClick()}} style={{margin:'0 0 5% 0'}} className="flex items-center gap-2 text-red-400 hover:text-red-600 px-4"><LogOut size={18}/>Sair</button></div>
      </div>
    </aside>
  </>;
};

export default Sidebar;
