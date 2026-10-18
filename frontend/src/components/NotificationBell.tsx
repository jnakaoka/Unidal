import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
export default function NotificationBell() {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let ativo = true;
    const atualizar = () => api.get("/notificacoes/", { params: { limite: 1 } }).then(r => { if (ativo) setTotal(r.data.nao_lidas); }).catch(() => {});
    atualizar();
    const timer = setInterval(atualizar, 30000);
    window.addEventListener("notificacoes-atualizadas", atualizar);
    return () => { ativo = false; clearInterval(timer); window.removeEventListener("notificacoes-atualizadas", atualizar); };
  }, []);
  return <Link to="/notificacoes" className="relative rounded p-2 text-white" aria-label={`Notificações: ${total} não lidas`}><Bell size={22}/>{total > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-white px-1 text-xs font-bold text-red-700">{total > 99 ? "99+" : total}</span>}</Link>;
}
