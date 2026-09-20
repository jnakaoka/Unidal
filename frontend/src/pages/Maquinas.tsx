import { useEffect, useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Maquina = { id: number; nome: string; referencia?: string; ativo: boolean };

export default function Maquinas() {
  const [itens, setItens] = useState<Maquina[]>([]);
  const [nome, setNome] = useState("");
  const [referencia, setReferencia] = useState("");
  const [editando, setEditando] = useState<Maquina | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const carregar = async () => setItens((await api.get<Maquina[]>("/maquinas/" )).data);
  useEffect(() => { void carregar(); }, []);

  const limparFormulario = () => {
    setNome("");
    setReferencia("");
    setEditando(null);
    setErro("");
  };

  const editar = (item: Maquina) => {
    setEditando(item);
    setNome(item.nome);
    setReferencia(item.referencia || "");
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const salvar = async () => {
    if (!nome.trim()) return setErro("Informe a designação da máquina.");
    try {
      setSalvando(true);
      const payload = { nome: nome.trim(), referencia: referencia.trim() || null };
      if (editando) {
        await api.put(`/maquinas/${editando.id}`, payload);
      } else {
        await api.post("/maquinas/", payload);
      }
      limparFormulario();
      await carregar();
    } catch (e: any) {
      setErro(e?.response?.data?.detail || `Erro ao ${editando ? "atualizar" : "cadastrar"} máquina.`);
    } finally {
      setSalvando(false);
    }
  };

  const alternar = async (item: Maquina) => {
    try {
      await api.put(`/maquinas/${item.id}`, { ativo: !item.ativo });
      if (editando?.id === item.id) limparFormulario();
      await carregar();
    } catch (e: any) {
      setErro(e?.response?.data?.detail || "Erro ao alterar o estado da máquina.");
    }
  };

  return <div className="mx-auto max-w-5xl p-6">
    <h1 className="mb-6 text-3xl font-bold">Máquinas</h1>
    <div className="mb-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
      <h2 className="text-lg font-semibold md:col-span-4">{editando ? "Editar máquina" : "Nova máquina"}</h2>
      <div><Label>Designação</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Laser WS940C"/></div>
      <div><Label>Modelo ou referência</Label><Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Opcional"/></div>
      <Button onClick={salvar} disabled={salvando}>{salvando ? "A guardar..." : editando ? "Guardar alterações" : "Adicionar máquina"}</Button>
      {editando && <Button variant="outline" onClick={limparFormulario} disabled={salvando}>Cancelar</Button>}
      {erro && <p className="text-sm text-red-600 md:col-span-4">{erro}</p>}
    </div>
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-left text-sm"><thead className="bg-gray-100"><tr><th className="p-3">Designação</th><th className="p-3">Referência</th><th className="p-3">Estado</th><th className="p-3">Ações</th></tr></thead>
      <tbody>{itens.map(item => <tr key={item.id} className="border-t"><td className="p-3">{item.nome}</td><td className="p-3">{item.referencia || "—"}</td><td className="p-3">{item.ativo ? "Ativa" : "Inativa"}</td><td className="flex gap-2 p-3"><Button onClick={() => editar(item)}>Editar</Button><Button variant="outline" onClick={() => alternar(item)}>{item.ativo ? "Inativar" : "Ativar"}</Button></td></tr>)}</tbody></table>
    </div>
  </div>;
}
