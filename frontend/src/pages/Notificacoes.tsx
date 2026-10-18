import { useEffect, useState } from "react";
import api from "../services/api";

type Evento = { id: number; registro_id: number; autor_nome: string; resumo: string; criado_em: string; lida_em: string | null; alteracoes: Record<string, { antes: unknown; depois: unknown }> };
type Resultado = { items: Evento[]; nao_lidas: number; total: number };
function valor(v: unknown): string { return v === null ? "—" : typeof v === "object" ? JSON.stringify(v, null, 2) : String(v); }
const campos: Record<string, string> = { observacao: "Observação", horas: "Horas", data: "Data", equipa: "Equipa", obra_id: "Obra (ID)", cliente_id: "Cliente (ID)", metros_quadrados: "Metros quadrados", intervencao_maquinas_opcoes: "Intervenção de máquinas", double_journey_lider: "Double Journey do chefe", transporte_maquina_ids: "Máquinas transportadas (IDs)" };
export default function Notificacoes() {
  const [dados, setDados] = useState<Resultado>({ items: [], nao_lidas: 0, total: 0 });
  const [offset, setOffset] = useState(0);
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState<{ id: number; eventos: Evento[] } | null>(null);
  async function carregar() { setDados((await api.get("/notificacoes/", { params: { offset, limite: 50 } })).data); }
  useEffect(() => { carregar().catch(() => setErro("Não foi possível carregar os alertas.")); const timer = setInterval(() => carregar().catch(() => {}), 30000); return () => clearInterval(timer); }, [offset]);
  async function ler(id: number) { try { await api.patch(`/notificacoes/${id}/ler`); await carregar(); window.dispatchEvent(new Event("notificacoes-atualizadas")); } catch { setErro("Não foi possível marcar a notificação como lida."); } }
  function tabela(alteracoes: Evento["alteracoes"]) { return <div className="overflow-x-auto"><table className="my-3 w-full text-left text-sm"><thead><tr><th className="p-2">Campo</th><th className="p-2">Antes</th><th className="p-2">Depois</th></tr></thead><tbody>{Object.entries(alteracoes).map(([campo, v]) => <tr key={campo} className="border-t"><td className="p-2">{campos[campo] || campo.replaceAll("_", " ")}</td><td className="max-w-xs whitespace-pre-wrap break-words p-2">{valor(v.antes)}</td><td className="max-w-xs whitespace-pre-wrap break-words p-2">{valor(v.depois)}</td></tr>)}</tbody></table></div>; }
  return <div className="mx-auto max-w-5xl space-y-4"><h1 className="text-2xl font-bold">Edições de apontamentos</h1><p>{dados.nao_lidas} notificações não lidas</p>{erro && <p role="alert" className="text-red-700">{erro}</p>}
    {dados.items.map(e => <article key={e.id} className={`rounded border bg-white p-4 ${!e.lida_em ? "border-red-500" : "border-gray-200"}`}><h2 className="font-semibold">{e.resumo}</h2><p className="text-sm text-gray-600">{new Date(e.criado_em + (e.criado_em.endsWith("Z") ? "" : "Z")).toLocaleString("pt-PT")}</p><details><summary className="my-2 cursor-pointer text-red-700">Ver alterações</summary>{tabela(e.alteracoes)}</details><div className="flex gap-4">{!e.lida_em && <button className="rounded border p-2" onClick={() => ler(e.id)}>Marcar como lida</button>}<button className="text-red-700" onClick={async () => { try { setHistorico({ id: e.registro_id, eventos: (await api.get(`/notificacoes/apontamentos/${e.registro_id}/historico`)).data }); } catch { setErro("Não foi possível carregar o histórico."); } }}>Histórico do apontamento #{e.registro_id}</button></div></article>)}
    {!dados.items.length && <p>Nenhuma notificação disponível.</p>}
    <div className="flex gap-3"><button disabled={!offset} onClick={() => setOffset(offset - 50)}>Anterior</button><button disabled={offset + 50 >= dados.total} onClick={() => setOffset(offset + 50)}>Seguinte</button></div>
    {historico && <section className="rounded border bg-white p-4"><button className="float-right" onClick={() => setHistorico(null)}>Fechar</button><h2 className="font-bold">Histórico do apontamento #{historico.id}</h2>{historico.eventos.map(e => <div className="my-4" key={e.id}><p>{e.resumo}</p>{tabela(e.alteracoes)}</div>)}</section>}
  </div>;
}
