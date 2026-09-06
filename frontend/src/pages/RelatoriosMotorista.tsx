// frontend/src/pages/RelatoriosMotorista.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import Pagination, { usePagination } from "@/components/pagination-utils";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/LoadingState";

// ==== Tipos ====
type Perfil = {
  id: number;
  nome: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  empresa?: string;
  is_active?: boolean;
  perfil?: Perfil;
};
type Veiculo = { id: number; matricula: string; tipo: string; descricao?: string };
type Maquina = { id: number; nome: string; referencia?: string };

type RegistroHorasMotorista = {
  id: number;
  data: string; // "YYYY-MM-DD"
  horas?: number | string;
  usuario_id: number;
  user?: User;

  origem?: string | null;
  destino?: string | null;
  matricula?: string | null;
  km_rodados?: number | string | null;
  maquinas_transportadas?: string | null;
  transporte_veiculo_id?: number | null;
  transporte_maquina_ids?: number[] | null;
  origem_morada?: string | null; origem_codigo_postal?: string | null; origem_regiao?: string | null;
  destino_morada?: string | null; destino_codigo_postal?: string | null; destino_regiao?: string | null;
};

type DateMode = "week" | "month" | "year" | "range";

const RelatoriosMotorista: React.FC = () => {
  // dados
  const [registrosAll, setRegistrosAll] = useState<RegistroHorasMotorista[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // filtros
  const [filtroDriverId, setFiltroDriverId] = useState<number | "">("");
  const [filtroMatricula, setFiltroMatricula] = useState<string>("");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("");
  const [filtroDestino, setFiltroDestino] = useState<string>("");

  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [monthValue, setMonthValue] = useState<string>(""); // YYYY-MM
  const [weekValue, setWeekValue] = useState<string>(""); // YYYY-W##
  const [yearValue, setYearValue] = useState<string>(""); // YYYY
  const [rangeFrom, setRangeFrom] = useState<string>(""); // YYYY-MM-DD
  const [rangeTo, setRangeTo] = useState<string>(""); // YYYY-MM-DD

  // ordenação por data
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // helpers
  const toNum = (v: unknown): number => {
    if (v === null || v === undefined) return 0;
    const n = Number(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  };

  const toNumHours = (h?: number | string) => toNum(h);

  const normalize = (s?: string | null) => (s ?? "").trim();
  const includesCI = (hay?: string | null, needle?: string) => {
    const h = normalize(hay).toLowerCase();
    const n = (needle ?? "").trim().toLowerCase();
    if (!n) return true;
    return h.includes(n);
  };
  const veiculoTexto = (r: RegistroHorasMotorista) => {
    const veiculo = veiculos.find(item => item.id === r.transporte_veiculo_id);
    return veiculo ? `${veiculo.matricula} — ${veiculo.tipo}` : normalize(r.matricula) || "-";
  };
  const enderecoTexto = (r: RegistroHorasMotorista, tipo: "origem" | "destino") => {
    const partes = tipo === "origem"
      ? [r.origem_morada, r.origem_codigo_postal, r.origem_regiao]
      : [r.destino_morada, r.destino_codigo_postal, r.destino_regiao];
    const detalhado = partes.map(normalize).filter(Boolean).join(", ");
    return detalhado || normalize(tipo === "origem" ? r.origem : r.destino) || "-";
  };
  const maquinasTexto = (r: RegistroHorasMotorista) => {
    const nomes = (r.transporte_maquina_ids || []).map(id => {
      const maquina = maquinas.find(item => item.id === id);
      return maquina ? `${maquina.nome}${maquina.referencia ? ` — ${maquina.referencia}` : ""}` : `#${id}`;
    });
    return nomes.length ? nomes.join(", ") : normalize(r.maquinas_transportadas) || "-";
  };

  // definição “registro motorista preenchido”
  const isMotoristaRegistro = (r: RegistroHorasMotorista) => {
    const origemOk = normalize(r.origem) !== "" || normalize(r.origem_morada) !== "";
    const destinoOk = normalize(r.destino) !== "" || normalize(r.destino_morada) !== "";
    const matriculaOk = normalize(r.matricula) !== "" || !!r.transporte_veiculo_id;
    const kmOk = toNum(r.km_rodados) > 0; // se você quiser permitir 0, troca para >= 0 e exige campo preenchido
    const maqOk = normalize(r.maquinas_transportadas) !== "" || !!r.transporte_maquina_ids?.length;
    return origemOk && destinoOk && matriculaOk && kmOk && maqOk;
  };

  const toIsoWeek = (dStr: string) => {
    const d = new Date(dStr + "T00:00:00");
    const dayNr = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    const target = new Date(d);
    target.setUTCDate(target.getUTCDate() - dayNr + 3); // quinta
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const diff = target.valueOf() - firstThursday.valueOf();
    const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
    const year = target.getUTCFullYear();
    return `${year}-W${String(week).padStart(2, "0")}`;
  };

  const clearDates = () => {
    setMonthValue("");
    setYearValue("");
    setWeekValue("");
    setRangeFrom("");
    setRangeTo("");
  };

  // carga inicial
  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDados() {
      try {
        setCarregando(true);
        setErroCarregamento(null);

        const [reg, usr, vei, maq] = await Promise.all([
          api.get<RegistroHorasMotorista[]>(
            "/registro-horas/",
          ),
          api.get<User[]>("/users/", { params: { is_active: true } }),
          api.get<Veiculo[]>("/veiculos/", { params: { ativo: true } }),
          api.get<Maquina[]>("/maquinas/", { params: { ativo: true } }),
        ]);

        if (!componenteAtivo) {
          return;
        }

        setRegistrosAll(reg.data);
        setVeiculos(vei.data);
        setMaquinas(maq.data);

        const motoristasOrdenados = (usr.data || [])
          .filter(
            (utilizador) => (
              utilizador.perfil?.nome
                ?.trim()
                .toLocaleLowerCase()
              === "motorista"
            ),
          )
          .sort(
            (a, b) => (
              (a.name || "").localeCompare(
                b.name || "",
                "pt",
              )
            ),
          );

        setDrivers(motoristasOrdenados);
      } catch (error) {
        console.error(
          "Erro ao carregar relatório de motoristas:",
          error,
        );

        if (componenteAtivo) {
          setErroCarregamento(
            "Não foi possível carregar o relatório de motoristas.",
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  // aplica filtros (inclui filtro “só motorista”)
  const registrosFiltrados = useMemo(() => {
    return registrosAll.filter((r) => {
      // ✅ só motorista (campos preenchidos)
      if (!isMotoristaRegistro(r)) return false;

      // motorista (usuário)
      if (
        filtroDriverId &&
        r.user?.id !== filtroDriverId &&
        r.usuario_id !== (filtroDriverId as number)
      )
        return false;

      // matrícula / origem / destino (contains case-insensitive)
      if (!includesCI(veiculoTexto(r), filtroMatricula)) return false;
      if (!includesCI(enderecoTexto(r, "origem"), filtroOrigem)) return false;
      if (!includesCI(enderecoTexto(r, "destino"), filtroDestino)) return false;

      // data
      if (!r.data) return false;

      if (dateMode === "month" && monthValue) {
        return r.data.slice(0, 7) === monthValue;
      }
      if (dateMode === "year" && yearValue) {
        return r.data.slice(0, 4) === yearValue;
      }
      if (dateMode === "week" && weekValue) {
        return toIsoWeek(r.data) === weekValue;
      }
      if (dateMode === "range" && (rangeFrom || rangeTo)) {
        if (rangeFrom && r.data < rangeFrom) return false;
        if (rangeTo && r.data > rangeTo) return false;
      }

      return true;
    });
  }, [
    registrosAll,
    filtroDriverId,
    filtroMatricula,
    filtroOrigem,
    filtroDestino,
    dateMode,
    monthValue,
    yearValue,
    weekValue,
    rangeFrom,
    rangeTo,
    veiculos,
  ]);

  // ordenação por data
  const registrosFiltradosSorted = useMemo(() => {
    const arr = [...registrosFiltrados];
    arr.sort((a, b) => {
      const da = a.data || "";
      const db = b.data || "";
      if (da === db) return 0;
      if (sortDir === "asc") return da < db ? -1 : 1;
      return da > db ? -1 : 1;
    });
    return arr;
  }, [registrosFiltrados, sortDir]);

  // paginação
  const { pageItems, currentPage, setCurrentPage, totalPages } =
    usePagination<RegistroHorasMotorista>(registrosFiltradosSorted, 20);

  // reseta pagina quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [
    setCurrentPage,
    registrosFiltrados.length,
    filtroDriverId,
    filtroMatricula,
    filtroOrigem,
    filtroDestino,
    dateMode,
    monthValue,
    yearValue,
    weekValue,
    rangeFrom,
    rangeTo,
    sortDir,
  ]);

  const totalHoras = useMemo(
    () => registrosFiltrados.reduce((acc, r) => acc + toNumHours(r.horas), 0),
    [registrosFiltrados]
  );

  const totalKm = useMemo(
    () => registrosFiltrados.reduce((acc, r) => acc + toNum(r.km_rodados), 0),
    [registrosFiltrados]
  );

  // ===== Impressão =====
  const buildPrintableHtml = () => {
    const rows = registrosFiltradosSorted
      .map((r, idx) => {
        const rowClass = idx % 2 === 0 ? "line-bg-white-600" : "line-bg-gray-100";
        return `
          <tr class="${rowClass}">
            <td>${r.data ?? "-"}</td>
            <td>${r.user?.name ?? `#${r.usuario_id}`}</td>
            <td>${veiculoTexto(r)}</td>
            <td>${enderecoTexto(r, "origem")}</td>
            <td>${enderecoTexto(r, "destino")}</td>
            <td style="text-align:right">${toNum(r.km_rodados)}</td>
            <td>${maquinasTexto(r)}</td>
          </tr>`;
      })
      .join("");

    const stamp = new Date().toLocaleString();

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Relatório de Motoristas</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            .meta { color: #555; font-size: 12px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; border-spacing: 0; border: 1px solid #ddd; table-layout: fixed;}
            th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
            @media print { .no-print { display: none; } th, td { font-size: 11px; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:right; margin-bottom:12px;">
            <button onclick="window.print()">Imprimir</button>
          </div>
          <h1>Relatório de Motoristas (filtrado)</h1>
          <div class="meta">Gerado em ${stamp} — Registos: ${registrosFiltradosSorted.length}</div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Motorista</th>
                <th>Matrícula</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Km</th>
                <th>Máquinas Transportadas</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="7" style="text-align:center;color:#777">Nenhum registo encontrado</td></tr>`
              }
            </tbody>
          </table>
        </body>
      </html>`;
  };

  const printViaHiddenIframe = (html: string) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.ownerDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 500);
      }, 50);
    };
  };

  const handlePrint = () => {
    printViaHiddenIframe(buildPrintableHtml());
  };
  // ===== Impressão =====

  const DateInputs = () => {
    switch (dateMode) {
      case "month":
        return (
          <input
            type="month"
            className="p-2 border rounded-xl w-full"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
          />
        );
      case "year":
        return (
          <input
            type="number"
            min={2000}
            max={2100}
            placeholder="YYYY"
            className="p-2 border rounded-xl w-full"
            value={yearValue}
            onChange={(e) => setYearValue(e.target.value)}
          />
        );
      case "week":
        return (
          <input
            type="week"
            className="p-2 border rounded-xl w-full"
            value={weekValue}
            onChange={(e) => setWeekValue(e.target.value)}
          />
        );
      case "range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="p-2 border rounded-xl w-full"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
            />
            <input
              type="date"
              className="p-2 border rounded-xl w-full"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (carregando) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Relatório Motoristas
        </h1>

        <div className="rounded-2xl bg-white shadow-sm">
          <LoadingState message="A carregar relatório de motoristas..." />
        </div>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Relatório Motoristas
        </h1>

        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
        >
          {erroCarregamento}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Relatório Motoristas</h1>

      <div className="flex gap-2">
        <Button onClick={handlePrint} className="btn-bg-blue-500">
          Imprimir
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* motorista */}
          <select
            className="p-2 border rounded-xl w-full"
            value={filtroDriverId}
            onChange={(e) => setFiltroDriverId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Motorista (todos)</option>
            {drivers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* modo e entrada de data */}
          <div className="grid grid-cols-1 gap-2">
            <select
              className="p-2 border rounded-xl w-full"
              value={dateMode}
              onChange={(e) => {
                setDateMode(e.target.value as DateMode);
                clearDates();
              }}
            >
              <option value="month">Mensal</option>
              <option value="week">Semanal</option>
              <option value="year">Anual</option>
              <option value="range">Por Período</option>
            </select>
            <DateInputs />
          </div>

          {/* matrícula */}
          <input
            className="p-2 border rounded-xl w-full"
            placeholder="Matrícula (contém)"
            value={filtroMatricula}
            onChange={(e) => setFiltroMatricula(e.target.value)}
          />

          {/* origem */}
          <input
            className="p-2 border rounded-xl w-full"
            placeholder="Origem (contém)"
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
          />

          {/* destino */}
          <input
            className="p-2 border rounded-xl w-full"
            placeholder="Destino (contém)"
            value={filtroDestino}
            onChange={(e) => setFiltroDestino(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFiltroDriverId("");
              setFiltroMatricula("");
              setFiltroOrigem("");
              setFiltroDestino("");
              setDateMode("month");
              clearDates();
              setSortDir("desc");
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl shadow overflow-x-auto mt-8 clear-both">
        <table
          cellSpacing="0"
          cellPadding="20"
          className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0"
        >
          {/* Data | Motorista | Matrícula | Origem | Destino | Km | Máquinas */}
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>

          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
            <tr className="head-lista">
              <th
                className="px-4 py-2 cursor-pointer select-none"
                onClick={() => setSortDir((old) => (old === "asc" ? "desc" : "asc"))}
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  <span className="text-[10px] leading-none text-gray-500">
                    {sortDir === "asc" ? "↑" : "↓"}
                  </span>
                </div>
              </th>
              <th className="px-4 py-2">Motorista</th>
              <th className="px-4 py-2">Matrícula</th>
              <th className="px-4 py-2">Origem</th>
              <th className="px-4 py-2">Destino</th>
              <th className="px-4 py-2 text-right">Km</th>
              <th className="px-4 py-2">Máquinas Transportadas</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Nenhum registo encontrado
                </td>
              </tr>
            ) : (
              pageItems.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? "line-bg-white-600" : "line-bg-gray-100"}>
                  <td className="px-4 py-2">{r.data}</td>
                  <td className="px-4 py-2">{r.user?.name ?? `#${r.usuario_id}`}</td>
                  <td className="px-4 py-2">{veiculoTexto(r)}</td>
                  <td className="px-4 py-2">{enderecoTexto(r, "origem")}</td>
                  <td className="px-4 py-2">{enderecoTexto(r, "destino")}</td>
                  <td className="px-4 py-2 text-right">{toNum(r.km_rodados)}</td>
                  <td className="px-4 py-2 whitespace-pre-wrap">
                    {maquinasTexto(r)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* paginação */}
        <div className="p-4">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            siblingCount={1}
            boundaryCount={1}
          />
        </div>

        {/* totais */}
        <div className="px-6 pb-6 text-right text-gray-700 font-medium">
          Total de Horas: <span className="font-bold">{totalHoras}</span>
          <span className="mx-3">|</span>
          Total de Km: <span className="font-bold">{totalKm}</span>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosMotorista;
