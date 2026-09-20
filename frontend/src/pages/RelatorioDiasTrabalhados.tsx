import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import LoadingState from "@/components/LoadingState";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  name: string;
  empresa: string;
  is_active: boolean;
};

type Relatorio = {
  funcionario_id: number;
  funcionario_nome: string;
  empresa: string;
  data_inicio: string;
  data_fim: string;
  total_dias: number;
  datas_trabalhadas: string[];
  total_double_journeys: number;
  double_journeys: { data: string; obras: string[] }[];
};

type DateMode = "month" | "range";

const hoje = new Date();
const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

const limitesDoMes = (mes: string) => {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(ano, numeroMes, 0).getDate();
  return {
    inicio: `${mes}-01`,
    fim: `${mes}-${String(ultimoDia).padStart(2, "0")}`,
  };
};

const formatarData = (valor: string) =>
  new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${valor}T00:00:00Z`));

const RelatorioDiasTrabalhados: React.FC = () => {
  const [funcionarios, setFuncionarios] = useState<User[]>([]);
  const [funcionarioId, setFuncionarioId] = useState<number | "">("");
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [mes, setMes] = useState(mesAtual);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api.get<User[]>("/users/", { params: { is_active: true } })
      .then(({ data }) => {
        if (ativo) {
          setFuncionarios(
            data
              .filter((funcionario) => funcionario.is_active !== false)
              .sort((a, b) => a.name.localeCompare(b.name, "pt")),
          );
        }
      })
      .catch(() => ativo && setErro("Não foi possível carregar os funcionários."))
      .finally(() => ativo && setCarregandoFuncionarios(false));
    return () => { ativo = false; };
  }, []);

  const periodo = useMemo(() => {
    if (dateMode === "month") return limitesDoMes(mes);
    return { inicio: dataInicio, fim: dataFim };
  }, [dateMode, mes, dataInicio, dataFim]);

  const consultar = async () => {
    if (!funcionarioId) {
      setErro("Selecione um funcionário.");
      return;
    }
    if (!periodo.inicio || !periodo.fim) {
      setErro("Preencha as duas datas do período.");
      return;
    }
    if (periodo.inicio > periodo.fim) {
      setErro("A data inicial não pode ser posterior à data final.");
      return;
    }

    try {
      setConsultando(true);
      setErro(null);
      const { data } = await api.get<Relatorio>("/relatorio/dias-trabalhados", {
        params: {
          funcionario_id: funcionarioId,
          data_inicio: periodo.inicio,
          data_fim: periodo.fim,
        },
      });
      setRelatorio(data);
    } catch {
      setRelatorio(null);
      setErro("Não foi possível gerar o relatório de dias trabalhados.");
    } finally {
      setConsultando(false);
    }
  };

  const imprimir = () => {
    if (!relatorio) return;
    const datas = relatorio.datas_trabalhadas
      .map((data, indice) => `<tr><td>${indice + 1}</td><td>${formatarData(data)}</td></tr>`)
      .join("");
    const ocorrencias = relatorio.double_journeys
      .map((item) => `<li><strong>${formatarData(item.data)}:</strong> ${item.obras.join(" • ")}</li>`)
      .join("");
    const janela = window.open("", "_blank", "width=850,height=700");
    if (!janela) return;
    janela.document.write(`<!doctype html><html><head><title>Dias trabalhados</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#1f2937}h1{margin-bottom:24px}.resumo{padding:18px;background:#f3f4f6;border-radius:8px;margin:20px 0}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}</style>
      </head><body><h1>Relatório de Dias Trabalhados</h1>
      <p><strong>Funcionário:</strong> ${relatorio.funcionario_nome}</p>
      <p><strong>Empresa:</strong> ${relatorio.empresa}</p>
      <p><strong>Período:</strong> ${formatarData(relatorio.data_inicio)} a ${formatarData(relatorio.data_fim)}</p>
      <div class="resumo"><strong>Total de dias trabalhados: ${relatorio.total_dias}</strong></div>
      <div class="resumo"><strong>Double journeys identificados: ${relatorio.total_double_journeys}</strong></div>
      ${ocorrencias ? `<h2>Ocorrências para conferência</h2><ul>${ocorrencias}</ul>` : ""}
      <table><thead><tr><th>#</th><th>Data</th></tr></thead><tbody>${datas || '<tr><td colspan="2">Nenhum dia trabalhado no período.</td></tr>'}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    janela.document.close();
  };

  if (carregandoFuncionarios) {
    return <div className="mx-auto w-full max-w-5xl p-6"><LoadingState message="A carregar funcionários..." /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dias Trabalhados</h1>
        <p className="mt-1 text-sm text-gray-500">Conta cada data uma única vez, como chefe de equipa ou membro da equipa.</p>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-4 shadow md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Funcionário</span>
            <select className="w-full rounded-xl border p-2" value={funcionarioId} onChange={(e) => { setFuncionarioId(e.target.value ? Number(e.target.value) : ""); setRelatorio(null); }}>
              <option value="">Selecione um funcionário</option>
              {funcionarios.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Tipo de período</span>
            <select className="w-full rounded-xl border p-2" value={dateMode} onChange={(e) => { setDateMode(e.target.value as DateMode); setRelatorio(null); }}>
              <option value="month">Mês</option>
              <option value="range">Período personalizado</option>
            </select>
          </label>

          {dateMode === "month" ? (
            <label className="space-y-1 text-sm font-medium text-gray-700">
              <span>Mês</span>
              <input className="w-full rounded-xl border p-2" type="month" value={mes} onChange={(e) => { setMes(e.target.value); setRelatorio(null); }} />
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm font-medium text-gray-700"><span>De</span><input className="w-full rounded-xl border p-2" type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setRelatorio(null); }} /></label>
              <label className="space-y-1 text-sm font-medium text-gray-700"><span>Até</span><input className="w-full rounded-xl border p-2" type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setRelatorio(null); }} /></label>
            </div>
          )}
        </div>
        <Button onClick={consultar} disabled={consultando}>{consultando ? "A consultar..." : "Gerar relatório"}</Button>
      </div>

      {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">{erro}</div>}

      {relatorio && (
        <div className="space-y-5 rounded-2xl bg-white p-5 shadow md:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div><h2 className="text-xl font-semibold text-gray-800">{relatorio.funcionario_nome}</h2><p className="text-sm text-gray-500">{relatorio.empresa}</p></div>
            <Button variant="outline" onClick={imprimir}>Imprimir</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-indigo-50 p-5 text-indigo-900"><p className="text-sm">Dias trabalhados</p><p className="text-3xl font-bold">{relatorio.total_dias} {relatorio.total_dias === 1 ? "dia" : "dias"}</p></div>
            <div className="rounded-xl bg-amber-50 p-5 text-amber-900"><p className="text-sm">Double journeys identificados</p><p className="text-3xl font-bold">{relatorio.total_double_journeys}</p></div>
          </div>
          {relatorio.double_journeys.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-900">Ocorrências para conferência administrativa</h3>
              <ul className="mt-2 space-y-2 text-sm text-amber-900">
                {relatorio.double_journeys.map((ocorrencia) => (
                  <li key={ocorrencia.data}><b className="capitalize">{formatarData(ocorrencia.data)}:</b> {ocorrencia.obras.join(" • ")}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Data trabalhada</th></tr></thead>
              <tbody>{relatorio.datas_trabalhadas.length ? relatorio.datas_trabalhadas.map((data, indice) => <tr key={data} className="border-t"><td className="px-4 py-3 text-gray-500">{indice + 1}</td><td className="px-4 py-3 capitalize">{formatarData(data)}</td></tr>) : <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">Nenhum dia trabalhado neste período.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioDiasTrabalhados;
