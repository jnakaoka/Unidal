import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type Funcao = {
  id: number;
  codigo: string;
  nome: string;
  is_active: boolean;
};

type Usuario = {
  id: number;
  name: string;
  email: string;
  empresa: string;
  is_active?: boolean;
  funcoes?: Funcao[];
};

type Ocorrencia = {
  id: number;
  data: string;
  chefe_equipe_id: number;
  funcionario_id: number;
  descricao: string;
  criado_por_id: number;
  criado_em: string;
  chefe_equipe: Usuario;
  funcionario: Usuario;
  criado_por: Usuario;
  testemunhas: Usuario[];
};

type Formulario = {
  data: string;
  chefe_equipe_id: string;
  funcionario_id: string;
  descricao: string;
  testemunha_ids: number[];
};

const hoje = () => new Date().toISOString().slice(0, 10);

const vazio = (): Formulario => ({
  data: hoje(),
  chefe_equipe_id: "",
  funcionario_id: "",
  descricao: "",
  testemunha_ids: [],
});

const Ocorrencias: React.FC = () => {
  const { user } = useAuth();
  const perfil = String((user as any)?.perfil?.nome ?? (user as any)?.perfil ?? "").toLowerCase();
  const isAdmin = perfil === "admin" || perfil === "administrador";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [form, setForm] = useState<Formulario>(vazio());
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [buscaTestemunha, setBuscaTestemunha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      const [resUsuarios, resOcorrencias] = await Promise.all([
        api.get<Usuario[]>("/users/?is_active=true"),
        api.get<Ocorrencia[]>("/ocorrencias/"),
      ]);
      setUsuarios(resUsuarios.data);
      setOcorrencias(resOcorrencias.data);
    } catch {
      setMensagem({ tipo: "erro", texto: "Não foi possível carregar as ocorrências." });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (!isAdmin && user?.id) {
      setForm((atual) => ({ ...atual, chefe_equipe_id: String(user.id) }));
    }
  }, [isAdmin, user?.id]);

  const chefesDisponiveis = useMemo(
    () => usuarios.filter((u) => (u.funcoes || []).some((f) => f.codigo === "CHEFE_EQUIPE" && f.is_active)),
    [usuarios]
  );

  const testemunhasDisponiveis = useMemo(() => {
    const termo = buscaTestemunha.trim().toLowerCase();
    return usuarios.filter((u) =>
      u.id !== Number(form.funcionario_id) &&
      (!termo || `${u.name} ${u.empresa}`.toLowerCase().includes(termo))
    );
  }, [usuarios, buscaTestemunha, form.funcionario_id]);

  const alternarTestemunha = (id: number) => {
    setForm((atual) => ({
      ...atual,
      testemunha_ids: atual.testemunha_ids.includes(id)
        ? atual.testemunha_ids.filter((item) => item !== id)
        : [...atual.testemunha_ids, id],
    }));
  };

  const limpar = () => {
    setForm({
      ...vazio(),
      chefe_equipe_id: !isAdmin && user?.id ? String(user.id) : "",
    });
    setEditandoId(null);
    setBuscaTestemunha("");
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem(null);
    if (!form.chefe_equipe_id || !form.funcionario_id || form.descricao.trim().length < 3) {
      setMensagem({ tipo: "erro", texto: "Preencha a data, o chefe de equipa, o funcionário e a descrição." });
      return;
    }

    setSalvando(true);
    const payload = {
      data: form.data,
      chefe_equipe_id: Number(form.chefe_equipe_id),
      funcionario_id: Number(form.funcionario_id),
      descricao: form.descricao.trim(),
      testemunha_ids: form.testemunha_ids,
    };
    try {
      if (editandoId) {
        await api.put(`/ocorrencias/${editandoId}`, payload);
      } else {
        await api.post("/ocorrencias/", payload);
      }
      setMensagem({ tipo: "ok", texto: editandoId ? "Ocorrência atualizada." : "Ocorrência registada." });
      limpar();
      await carregar();
    } catch (error: any) {
      setMensagem({ tipo: "erro", texto: error?.response?.data?.detail || "Não foi possível guardar a ocorrência." });
    } finally {
      setSalvando(false);
    }
  };

  const editar = (o: Ocorrencia) => {
    setEditandoId(o.id);
    setForm({
      data: o.data,
      chefe_equipe_id: String(o.chefe_equipe_id),
      funcionario_id: String(o.funcionario_id),
      descricao: o.descricao,
      testemunha_ids: o.testemunhas.map((t) => t.id),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("Eliminar esta ocorrência?")) return;
    try {
      await api.delete(`/ocorrencias/${id}`);
      await carregar();
    } catch (error: any) {
      setMensagem({ tipo: "erro", texto: error?.response?.data?.detail || "Não foi possível eliminar a ocorrência." });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ocorrências</h1>
        <p className="text-sm text-gray-500">Registo de ocorrências com funcionário, chefe de equipa e testemunhas.</p>
      </div>

      <form onSubmit={guardar} className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Plus size={20} />
          <h2 className="font-semibold">{editandoId ? "Editar ocorrência" : "Nova ocorrência"}</h2>
        </div>

        {mensagem && (
          <div className={`mb-4 rounded-md p-3 text-sm ${mensagem.tipo === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {mensagem.texto}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Data da ocorrência
            <input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="mt-1 w-full rounded-md border p-2" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Chefe de equipa
            <select required disabled={!isAdmin} value={form.chefe_equipe_id} onChange={(e) => setForm({ ...form, chefe_equipe_id: e.target.value })} className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100 disabled:text-gray-600">
              <option value="">Selecionar...</option>
              {chefesDisponiveis.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.empresa}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Funcionário da ocorrência
            <select required value={form.funcionario_id} onChange={(e) => {
              const id = Number(e.target.value);
              setForm({ ...form, funcionario_id: e.target.value, testemunha_ids: form.testemunha_ids.filter((t) => t !== id) });
            }} className="mt-1 w-full rounded-md border p-2">
              <option value="">Selecionar...</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.empresa}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">Descrição da ocorrência</label>
          <textarea required maxLength={5000} rows={5} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1 w-full rounded-md border p-3" placeholder="Descreva detalhadamente o que ocorreu..." />
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700"><Users size={17} /> Testemunhas</div>
          <input value={buscaTestemunha} onChange={(e) => setBuscaTestemunha(e.target.value)} placeholder="Procurar testemunha..." className="mb-2 w-full rounded-md border p-2 md:max-w-md" />
          <div className="max-h-52 overflow-y-auto rounded-md border p-2">
            {testemunhasDisponiveis.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-gray-50">
                <input type="checkbox" checked={form.testemunha_ids.includes(u.id)} onChange={() => alternarTestemunha(u.id)} />
                <span className="text-sm">{u.name} <span className="text-gray-400">— {u.empresa}</span></span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button disabled={salvando} className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{salvando ? "A guardar..." : editandoId ? "Guardar alterações" : "Registar ocorrência"}</button>
          {editandoId && <button type="button" onClick={limpar} className="rounded-md border px-4 py-2">Cancelar</button>}
        </div>
      </form>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Ocorrências registadas</h2>
        {carregando ? <p className="text-sm text-gray-500">A carregar...</p> : ocorrencias.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma ocorrência registada.</p>
        ) : (
          <div className="space-y-3">
            {ocorrencias.map((o) => (
              <article key={o.id} className="rounded-lg border p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <div className="font-medium">{new Date(o.data + "T00:00:00").toLocaleDateString("pt-PT")} — {o.funcionario.name}</div>
                    <div className="text-sm text-gray-500">Chefe de equipa: {o.chefe_equipe.name}</div>
                    <div className="text-sm text-gray-500">Testemunhas: {o.testemunhas.length ? o.testemunhas.map((t) => t.name).join(", ") : "Nenhuma"}</div>
                  </div>
                  {isAdmin && <div className="flex gap-2">
                    <button type="button" onClick={() => editar(o)} className="rounded border p-2" title="Editar"><Pencil size={16} /></button>
                    <button type="button" onClick={() => eliminar(o.id)} className="rounded border p-2 text-red-600" title="Eliminar"><Trash2 size={16} /></button>
                  </div>}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{o.descricao}</p>
                <p className="mt-3 text-xs text-gray-400">Registada por {o.criado_por.name}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Ocorrencias;
