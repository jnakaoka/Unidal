import { useEffect, useState } from "react";
import axios from "axios";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type Categoria = { id: number; nome: string; visibilidade: string; perfil_ids: number[]; usuario_ids: number[] };
type Documento = { id: number; titulo: string; descricao: string; categoria_id: number; nome_original: string; criado_em: string };
type Destino = { id: number; nome: string };
type Versao = { id: number; nome_original: string; criado_em: string };
const inicial = { nome: "", visibilidade: "admin", perfil_ids: [] as number[], usuario_ids: [] as number[] };
const input = "w-full rounded border p-2";
const button = "rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50";

export default function Documentos() {
  const { user } = useAuth();
  const admin = user?.perfil === "admin";
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [destinos, setDestinos] = useState<{ perfis: Destino[]; usuarios: Destino[] }>({ perfis: [], usuarios: [] });
  const [categoria, setCategoria] = useState(inicial);
  const [editId, setEditId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [historico, setHistorico] = useState<{ doc: Documento; versoes: Versao[] } | null>(null);

  async function carregar() {
    const [c, d] = await Promise.all([api.get<Categoria[]>("/documentos/categorias"), api.get<Documento[]>("/documentos/")]);
    setCategorias(c.data); setDocs(d.data);
    if (admin) setDestinos((await api.get("/documentos/destinatarios")).data);
  }
  function mensagem(e: unknown) {
    const detail = axios.isAxiosError(e) ? e.response?.data?.detail : null;
    setErro(typeof detail === "string" ? detail : "Não foi possível concluir a operação.");
  }
  useEffect(() => { carregar().catch(mensagem); }, [admin]);
  async function executar(action: () => Promise<unknown>) {
    setBusy(true); setErro("");
    try { await action(); await carregar(); } catch (e) { mensagem(e); } finally { setBusy(false); }
  }
  async function descarregar(doc: Documento, versaoId?: number, nome?: string) {
    try {
      const r = await api.get(`/documentos/${doc.id}/download`, { responseType: "blob", params: { versao_id: versaoId } });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a"); a.href = url; a.download = nome || doc.nome_original; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setErro("Não foi possível descarregar o documento. Verifique se ainda tem acesso."); }
  }
  const restrita = categoria.visibilidade === "perfis" || categoria.visibilidade === "usuarios";
  const selecionados = categoria.visibilidade === "perfis" ? categoria.perfil_ids : categoria.usuario_ids;
  return <div className="mx-auto max-w-5xl space-y-5">
    <h1 className="text-2xl font-bold">Documentos da empresa</h1>
    {erro && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{erro}</p>}
    {admin && <details className="rounded bg-white p-4 shadow" open={editId !== null}>
      <summary className="cursor-pointer font-semibold">Gerir categorias e permissões</summary>
      <div className="my-3 flex flex-wrap gap-2">{categorias.map(c => <button className="rounded border p-2" key={c.id} onClick={() => { setEditId(c.id); setCategoria({ nome: c.nome, visibilidade: c.visibilidade, perfil_ids: c.perfil_ids, usuario_ids: c.usuario_ids }); }}>{c.nome} · Editar</button>)}</div>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); executar(async () => { if (editId) await api.put(`/documentos/categorias/${editId}`, categoria); else await api.post("/documentos/categorias", categoria); setEditId(null); setCategoria(inicial); }); }}>
        <label className="block">Nome da categoria<input className={input} required maxLength={120} value={categoria.nome} onChange={e => setCategoria({ ...categoria, nome: e.target.value })}/></label>
        <label className="block">Quem pode aceder<select className={input} value={categoria.visibilidade} onChange={e => setCategoria({ ...categoria, visibilidade: e.target.value, perfil_ids: [], usuario_ids: [] })}>
          <option value="admin">Apenas administradores</option><option value="todos">Todos os funcionários</option><option value="perfis">Perfis selecionados</option><option value="usuarios">Funcionários selecionados</option>
        </select></label>
        {restrita && <fieldset className="max-h-60 overflow-y-auto rounded border p-3"><legend>Selecione os destinatários</legend>{(categoria.visibilidade === "perfis" ? destinos.perfis : destinos.usuarios).map(d => <label className="block py-1" key={d.id}><input type="checkbox" checked={selecionados.includes(d.id)} onChange={e => { const ids = e.target.checked ? [...selecionados, d.id] : selecionados.filter(id => id !== d.id); setCategoria({ ...categoria, [categoria.visibilidade === "perfis" ? "perfil_ids" : "usuario_ids"]: ids }); }}/> {d.nome}</label>)}</fieldset>}
        <p className="text-sm text-gray-600">Administradores têm acesso a todas as categorias. Alterar estas permissões afeta todos os documentos da categoria.</p>
        <button className={button} disabled={busy || (restrita && !selecionados.length)}>Guardar categoria</button>
        <button className="ml-3 rounded border p-2" type="button" onClick={() => { setEditId(null); setCategoria(inicial); }}>Nova categoria / Cancelar edição</button>
      </form>
    </details>}
    {admin && <details className="rounded bg-white p-4 shadow"><summary className="cursor-pointer font-semibold">Publicar documento</summary>
      <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); executar(async () => { await api.post("/documentos/", data, { headers: { "Content-Type": "multipart/form-data" } }); form.reset(); }); }}>
        <label className="block">Título<input name="titulo" className={input} required maxLength={200}/></label>
        <label className="block">Categoria<select name="categoria_id" className={input} required defaultValue=""><option value="" disabled>Selecione</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="block">Descrição<textarea name="descricao" className={input} maxLength={10000}/></label>
        <label className="block">Ficheiro (PDF, imagem, Word ou Excel)<input name="ficheiro" type="file" required accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" className={input}/></label>
        <button disabled={busy} className={button}>Publicar</button>
      </form>
    </details>}
    <div className="flex flex-wrap gap-3"><input aria-label="Pesquisar documentos" className="rounded border p-2" placeholder="Pesquisar documentos" value={busca} onChange={e => setBusca(e.target.value)}/><select aria-label="Filtrar categoria" className="rounded border p-2" value={filtro} onChange={e => setFiltro(e.target.value)}><option value="">Todas as categorias</option>{categorias.map(c => <option value={c.id} key={c.id}>{c.nome}</option>)}</select></div>
    <div className="space-y-3">{docs.filter(d => (!filtro || String(d.categoria_id) === filtro) && `${d.titulo} ${d.descricao}`.toLocaleLowerCase().includes(busca.toLocaleLowerCase())).map(d => <article key={d.id} className="rounded bg-white p-4 shadow">
      <h2 className="font-semibold">{d.titulo}</h2><p className="text-sm text-gray-600">{categorias.find(c => c.id === d.categoria_id)?.nome} · {d.nome_original}</p><p className="my-2">{d.descricao}</p>
      <div className="flex flex-wrap items-center gap-3"><button className={button} onClick={() => descarregar(d)}>Descarregar</button>
        <button className="rounded border p-2" onClick={async () => { try { setHistorico({ doc: d, versoes: (await api.get(`/documentos/${d.id}/versoes`)).data }); } catch (e) { mensagem(e); } }}>Ver versões</button>
        {admin && <><label className="cursor-pointer rounded border p-2">Nova versão<input className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const data = new FormData(); data.append("ficheiro", file); executar(() => api.post(`/documentos/${d.id}/versoes`, data, { headers: { "Content-Type": "multipart/form-data" } })); e.target.value = ""; }}/></label><button disabled={busy} className="text-red-700" onClick={() => { if (window.confirm(`Arquivar “${d.titulo}”?`)) executar(() => api.delete(`/documentos/${d.id}`)); }}>Arquivar</button></>}
      </div>
    </article>)}</div>
    {!docs.length && <p>Nenhum documento disponível.</p>}
    {historico && <section className="rounded border bg-white p-4"><div className="flex justify-between"><h2 className="font-semibold">Versões: {historico.doc.titulo}</h2><button onClick={() => setHistorico(null)}>Fechar</button></div>{historico.versoes.map(v => <button className="block py-2 text-red-700" key={v.id} onClick={() => descarregar(historico.doc, v.id, v.nome_original)}>{v.nome_original} · {new Date(v.criado_em + (v.criado_em.endsWith("Z") ? "" : "Z")).toLocaleString("pt-PT")}</button>)}</section>}
  </div>;
}
