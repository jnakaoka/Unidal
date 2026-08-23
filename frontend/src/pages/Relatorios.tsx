// frontend/src/pages/Relatorios.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import Pagination, { usePagination } from "@/components/pagination-utils";
import HighlightText from "@/components/ui/HighlightText";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/LoadingState";

// ==== Tipos ====
type User = { id: number; name: string; empresa?: string };
type Cliente = { id: number; nome: string };
type Obra = { id: number; nome: string; cliente_id: number; cliente?: Cliente };

// Opções de máquinas (mantém alinhado com RegistroHoras.tsx)
type IntervencaoMaquinasOpcoes = {
  laserComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  poComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  manobrador?: { checked?: boolean; qtd?: number; empresa?: string };
  soLaser?: { checked?: boolean; m2?: string; empresa?: string };
  soPo?: { checked?: boolean; m2?: string; empresa?: string };
  laserWS940CComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  lazerYZ30ComManobrador?: { checked?: boolean; m2?: string; empresa?: string };
  soMaqLaserWS940C?: { checked?: boolean; m2?: string; empresa?: string };
  soMaqLazerYZ30?: { checked?: boolean; m2?: string; empresa?: string };
};

type RegistroHoras = {
  id: number;
  data: string; // "YYYY-MM-DD"
  horas?: number | string; // pode vir string
  usuario_id: number;
  user?: User;
  cliente_id: number | null;
  obra_id: number | null;
  cliente?: Cliente | null;
  obra?: Obra | null;

  // ===== novos (para a coluna Etapas) ====
  preparacao?: boolean;
  bruto?: boolean;
  colagem?: boolean;
  acabamento?: boolean;
  serragem?: boolean;
  coli?: boolean;
  optipav?: boolean;

  // novos campos usados no relatório
  metros_quadrados?: string | number;
  equipa?: { user: User; intemperie?: boolean }[];
  intervencao_maquinas?: boolean;
  intervencao_maquinas_opcoes?: IntervencaoMaquinasOpcoes | null;
};

type DateMode = "week" | "month" | "year" | "range";
type FiltroMaquinas =
  | "todos"
  | "com"
  | "sem"
  | "laserComManobrador"
  | "poComManobrador"
  | "manobrador"
  | "soLaser"
  | "soPo"
  | "laserWS940CComManobrador"
  | "lazerYZ30ComManobrador"
  | "soMaqLaserWS940C"
  | "soMaqLazerYZ30";

const Relatorios: React.FC = () => {
  // dados
  const [registrosAll, setRegistrosAll] = useState<RegistroHoras[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]); // vem de /users/

  // filtros
  const [filtroLeaderId, setFiltroLeaderId] = useState<number | "">("");
  const [filtroMaquinas, setFiltroMaquinas] = useState<FiltroMaquinas>("todos");
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [monthValue, setMonthValue] = useState<string>(""); // YYYY-MM
  const [weekValue, setWeekValue] = useState<string>(""); // YYYY-W##
  const [yearValue, setYearValue] = useState<string>(""); // YYYY
  const [rangeFrom, setRangeFrom] = useState<string>(""); // YYYY-MM-DD
  const [rangeTo, setRangeTo] = useState<string>(""); // YYYY-MM-DD
  const [clienteId, setClienteId] = useState<number | "">("");
  const [obraId, setObraId] = useState<number | "">("");
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // ordenação por data
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // helpers
  const toNum = (v: unknown): number => {
    if (v === null || v === undefined) return 0;
    const n = Number(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  };

  const toNumHours = (h?: number | string) => toNum(h);

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

  const etapasResumo = (r: RegistroHoras): string => {
    const etiquetas: Record<string, string> = {
      preparacao: "Preparação",
      bruto: "Bruto",
      colagem: "Colagem",
      acabamento: "Acabamento",
      serragem: "Serragem",
      coli: "COLI",
      optipav: "Optipav",
    };

    const chaves = [
      "preparacao",
      "bruto",
      "colagem",
      "acabamento",
      "serragem",
      "coli",
      "optipav",
    ] as const;

    const ativas = chaves.filter((k) => Boolean((r as any)[k])).map((k) => etiquetas[k]);
    return ativas.length ? ativas.join(", ") : "—";
  };

  // const resumoEmpresas = (r: RegistroHoras): string => {
  //   const map: Record<string, number> = {};
  //   (r.equipa || []).forEach((e) => {
  //     const emp = (e.user?.empresa || "Sem Empresa").trim();
  //     map[emp] = (map[emp] || 0) + 1;
  //   });
  //   const parts = Object.entries(map).map(([k, v]) => `${k}: ${v}`);
  //   return parts.length ? parts.join(" | ") : "—";
  // };

  // const resumoEmpresas = (r: RegistroHoras, asHtmlBreak: boolean = false): string => {
  //   // mapa: empresa -> { total, intemperie, normais }
  //   const map: Record<string, { total: number; intemperie: number; normais: number }> = {};

  //   (r.equipa || []).forEach((e) => {
  //     const empRaw = e.user?.empresa?.substring(0, 7) || "Sem Empresa";
  //     const emp = empRaw.trim() || "Sem Empresa";

  //     if (!map[emp]) {
  //       map[emp] = { total: 0, intemperie: 0, normais: 0 };
  //     }

  //     map[emp].total += 1;

  //     if (e.intemperie) {
  //       map[emp].intemperie += 1;
  //     } else {
  //       map[emp].normais += 1;
  //     }
  //   });

  //   const parts = Object.entries(map).map(([empresa, info]) => {
  //     const { total, intemperie, normais } = info;
  //     return `${empresa} (Intemp.: ${intemperie} | Normais: ${normais} | Total: ${total})`;
  //   });

  //   if (!parts.length) return "—";

  //   // quebra de linha: \n para tela (React) e <br /> para HTML de impressão
  //   return asHtmlBreak ? parts.join("<br />") : parts.join("\n");
  // };

  const getResumoEmpresas = (r: RegistroHoras) => {
    const map: Record<
      string,
      { total: number; intemperie: number; normais: number }
    > = {};

    (r.equipa || []).forEach((e) => {
      const empRaw = e.user?.empresa?.substring(0, 7) || "Sem Empresa";
      const empresa = empRaw.trim() || "Sem Empresa";

      if (!map[empresa]) {
        map[empresa] = {
          total: 0,
          intemperie: 0,
          normais: 0,
        };
      }

      map[empresa].total += 1;

      if (e.intemperie) {
        map[empresa].intemperie += 1;
      } else {
        map[empresa].normais += 1;
      }
    });

    return Object.entries(map);
  };

  const renderResumoEmpresas = (r: RegistroHoras) => {
    const empresas = getResumoEmpresas(r);

    if (!empresas.length) return "—";

    return (
      <div className="space-y-1">
        {empresas.map(([empresa, info]) => (
          <div key={empresa}>
            {empresa} (
            {info.intemperie > 0 ? (
              <HighlightText type="warning">
                Intemp.: {info.intemperie}
              </HighlightText>
            ) : (
              <>Intemp.: 0</>
            )}
            {" | "}Normais: {info.normais}
            {" | "}Total: {info.total})
          </div>
        ))}
      </div>
    );
  };

  const resumoEmpresasHtml = (r: RegistroHoras): string => {
    const empresas = getResumoEmpresas(r);

    if (!empresas.length) return "—";

    return empresas
      .map(([empresa, info]) => {
        const intemperieHtml =
          info.intemperie > 0
            ? `<span class="intemperie-alert">Intemp.: ${info.intemperie}</span>`
            : `Intemp.: 0`;

        return `
          <div>
            ${empresa} (
            ${intemperieHtml}
            | Normais: ${info.normais}
            | Total: ${info.total})
          </div>
        `;
      })
      .join("");
  };


  // const maquinasResumo = (r: RegistroHoras): string => {
  //   const o = r.intervencao_maquinas_opcoes;
  //   if (!r.intervencao_maquinas || !o) return "—";
  //   const parts: string[] = [];
  //   if (o.laserComManobrador?.checked)
  //     parts.push(`Laser c/ manobr.: ${o.laserComManobrador.m2 || "0"} m²`);
  //   if (o.poComManobrador?.checked)
  //     parts.push(`Pó c/ manobr.: ${o.poComManobrador.m2 || "0"} m²`);
  //   if (o.manobrador?.checked) parts.push(`Manobrador: ${o.manobrador.qtd ?? 1}`);
  //   if (o.soLaser?.checked) parts.push(`Só Laser: ${o.soLaser.m2 || "0"} m²`);
  //   if (o.soPo?.checked) parts.push(`Só Pó: ${o.soPo.m2 || "0"} m²`);
  //   return parts.join(", ");
  // };

  const maquinasResumo = (r: RegistroHoras): string => {
    console.log(r.intervencao_maquinas_opcoes);
    const o = r.intervencao_maquinas_opcoes;
    console.log(o);
    if (!r.intervencao_maquinas || !o) return "—";

    const showEmp = (emp?: string) => ` (${emp && emp.trim() ? emp : "-"})`;
    const parts: string[] = [];

    if (o.laserComManobrador?.checked)
    parts.push(`Laser c/ manobr.: ${o.laserComManobrador.m2 || "0"} m²${showEmp(o.laserComManobrador.empresa)}`);

    if (o.poComManobrador?.checked)
    parts.push(`Pó c/ manobr.: ${o.poComManobrador.m2 || "0"} m²${showEmp(o.poComManobrador.empresa)}`);

    if (o.manobrador?.checked)
    parts.push(`Manobrador: ${o.manobrador.qtd ?? 1}${showEmp(o.manobrador.empresa)}`);

    if (o.soLaser?.checked)
    parts.push(`Só Laser: ${o.soLaser.m2 || "0"} m²${showEmp(o.soLaser.empresa)}`);

    if (o.soPo?.checked)
    parts.push(`Só Pó: ${o.soPo.m2 || "0"} m²${showEmp(o.soPo.empresa)}`);

    if(o.laserWS940CComManobrador?.checked)
    parts.push(`Laser WS940C c/ manobr.: ${o.laserWS940CComManobrador.m2 || "0"} m²${showEmp(o.laserWS940CComManobrador.empresa)}`);

    if(o.lazerYZ30ComManobrador?.checked)
    parts.push(`Lazer YZ30 c/ manobr.: ${o.lazerYZ30ComManobrador.m2 || "0"} m²${showEmp(o.lazerYZ30ComManobrador.empresa)}`);

    if(o.soMaqLaserWS940C?.checked)
    parts.push(`Só Laser WS940C: ${o.soMaqLaserWS940C.m2 || "0"} m²${showEmp(o.soMaqLaserWS940C.empresa)}`);

    if(o.soMaqLazerYZ30?.checked)
    parts.push(`Só Lazer YZ30: ${o.soMaqLazerYZ30.m2 || "0"} m²${showEmp(o.soMaqLazerYZ30.empresa)}`);

    return parts.join(", ");
  };

  // carga inicial
  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDados() {
      try {
        setCarregando(true);
        setErroCarregamento(null);

        const [reg, cls, usr] = await Promise.all([
          api.get<RegistroHoras[]>("/registro-horas/"),
          api.get<Cliente[]>("/clientes/"),
          api.get<User[]>("/users/"),
        ]);

        if (!componenteAtivo) {
          return;
        }

        setRegistrosAll(reg.data);
        setClientes(cls.data);

        const utilizadoresOrdenados = [...usr.data].sort(
          (a, b) => (
            (a.name || "").localeCompare(
              b.name || "",
              "pt",
            )
          ),
        );

        setLeaders(utilizadoresOrdenados);
      } catch (error) {
        console.error(
          "Erro ao carregar relatório:",
          error,
        );

        if (componenteAtivo) {
          setErroCarregamento(
            "Não foi possível carregar os dados do relatório.",
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

  // quando trocar cliente, carregar obras do cliente
  useEffect(() => {
    (async () => {
      if (!clienteId) {
        setObras([]);
        setObraId("");
        return;
      }
      const { data } = await api.get<Obra[]>(`/obras/?cliente_id=${clienteId}`);
      setObras(data);
      if (obraId && !data.some((o) => o.id === obraId)) setObraId("");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // aplica filtros
  const registrosFiltrados = useMemo(() => {
    return registrosAll.filter((r) => {
      // líder
      if (filtroLeaderId && r.user?.id !== filtroLeaderId && r.usuario_id !== (filtroLeaderId as number))
        return false;

      // cliente
      const ridCliente = r.cliente_id ?? r.cliente?.id ?? null;
      if (clienteId && ridCliente !== clienteId) return false;

      // obra
      const ridObra = r.obra_id ?? r.obra?.id ?? null;
      if (obraId && ridObra !== obraId) return false;

      // filtro máquinas
      if (filtroMaquinas !== "todos") {
        const has = !!r.intervencao_maquinas;
        if (filtroMaquinas === "com" && !has) return false;
        if (filtroMaquinas === "sem" && has) return false;
        if (
          [
            "laserComManobrador",
            "poComManobrador",
            "manobrador",
            "soLaser",
            "soPo",
            "laserWS940CComManobrador",
            "lazerYZ30ComManobrador",
            "soMaqLaserWS940C",
            "soMaqLazerYZ30",
          ].includes(filtroMaquinas)
        ) {
          const key = filtroMaquinas as keyof IntervencaoMaquinasOpcoes;
          const checked = r.intervencao_maquinas_opcoes?.[key]?.checked;
          if (!checked) return false;
        }
      }

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
    filtroLeaderId,
    clienteId,
    obraId,
    filtroMaquinas,
    dateMode,
    monthValue,
    yearValue,
    weekValue,
    rangeFrom,
    rangeTo,
  ]);

  // aplica ordenação por data ao resultado filtrado
  const registrosFiltradosSorted = useMemo(() => {
    // cópia para não mutar estado original
    const arr = [...registrosFiltrados];

    arr.sort((a, b) => {
      // datas vêm como "YYYY-MM-DD", que já é comparável lexicograficamente
      const da = a.data || "";
      const db = b.data || "";

      if (da === db) return 0;

      if (sortDir === "asc") {
        return da < db ? -1 : 1;
      } else {
        // "desc"
        return da > db ? -1 : 1;
      }
    });

    return arr;
  }, [registrosFiltrados, sortDir]);

  // paginação em cima da lista filtrada
  // const { pageItems, currentPage, setCurrentPage, totalPages } = usePagination<RegistroHoras>(
  //   registrosFiltrados,
  //   20
  // );

  const { pageItems, currentPage, setCurrentPage, totalPages } =
  usePagination<RegistroHoras>(registrosFiltradosSorted, 20);

  // sempre que filtros mudam, volta para página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [
    setCurrentPage,
    registrosFiltrados.length,
    filtroLeaderId,
    clienteId,
    obraId,
    filtroMaquinas,
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

  const clearDates = () => {
    setMonthValue("");
    setYearValue("");
    setWeekValue("");
    setRangeFrom("");
    setRangeTo("");
  };


  // ===== Impressão =====
  const buildPrintableHtml = () => {
    // usa a lista ORDENADA
    const rows = registrosFiltradosSorted
      .map((r, idx) => {
        const totalUsers = r.equipa?.length || 0;
        //const metros = toNum(r.metros_quadrados);
        const rowClass = idx % 2 === 0 ? "line-bg-white-600" : "line-bg-gray-100";
        return `
          <tr class="${rowClass}">
            <td>${r.data}</td>
            <td>${r.user?.name ?? `#${r.usuario_id}`}</td>
            <td>${r.cliente?.nome ?? (r.cliente_id ?? "-")}</td>
            <td>${r.obra?.nome ?? (r.obra_id ?? "-")}</td>
            <td style="text-align:center">${totalUsers}</td>
            <td>${resumoEmpresasHtml(r)}</td>
            <td>${r.metros_quadrados}</td>
            <td>${etapasResumo(r)}</td>
            <td>${maquinasResumo(r)}</td>
          </tr>`;
      })
      .join("");

    // se você quiser que os totais sejam calculados sobre o mesmo conjunto impresso:
    const totalHorasPrint = registrosFiltradosSorted.reduce(
      (acc, r) => acc + toNumHours(r.horas),
      0
    );
    const totalM2Print = registrosFiltradosSorted.reduce(
      (acc, r) => acc + toNum(r.metros_quadrados),
      0
    );

    const stamp = new Date().toLocaleString();

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Relatório</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            .meta { color: #555; font-size: 12px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; border-spacing: 0; border: 1px solid #ddd; table-layout: fixed;}
            th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
            tfoot td { font-weight: bold; }
            .intemperie-alert {
              color: #ea580c;
              font-weight: 700;
              font-style: italic;
            }
            @media print { .no-print { display: none; } th, td { font-size: 11px; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:right; margin-bottom:12px;">
            <button onclick="window.print()">Imprimir</button>
          </div>
          <h1>Relatório (filtrado)</h1>
          <div class="meta">Gerado em ${stamp} — Registos: ${registrosFiltradosSorted.length}</div>
          <table>
            <colgroup>
              <col style="width:8%" />
              <col style="width:12%" />
              <col style="width:12%" />
              <col style="width:12%" />
              <col style="width:6%" />
              <col style="width:12%" />
              <col style="width:8%" />
              <col style="width:14%" />
              <col style="width:16%" />
            </colgroup>
            <thead>
              <tr>
                <th>Data</th>
                <th>Chefe de Equipa</th>
                <th>Cliente</th>
                <th>Obra</th>
                <th>Nº Trab</th>
                <th>Trab. por Empresa</th>
                <th>m²</th>
                <th className="px-4 py-2">Etapas</th>
                <th className="px-4 py-2">Interv. Máq. (detalhes)</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan=9 style='text-align:center;color:#777'>Nenhum registo encontrado</td></tr>`
              }
            </tbody>
            <!-- Se quiser linha de totais impressa, descomenta o <tfoot> abaixo -->
            <!--
            <tfoot>
              <tr>
                <td colspan="5" style="text-align:right">Totais</td>
                <td></td>
                <td style="text-align:right">${totalM2Print}</td>
                <td style="text-align:right">${totalHorasPrint}</td>
              </tr>
            </tfoot>
            -->
          </table>
        </body>
      </html>`;
  };

  // const buildPrintableHtml = () => {
  //   const rows = registrosFiltrados
  //     .map((r, idx) => {
  //       const totalUsers = r.equipa?.length || 0;
  //       const metros = toNum(r.metros_quadrados);
  //       const rowClass = idx % 2 === 0 ? "line-bg-white-600" : "line-bg-gray-100";
  //       return `
  //         <tr class="${rowClass}">
  //           <td>${r.data}</td>
  //           <td>${r.user?.name ?? `#${r.usuario_id}`}</td>
  //           <td>${r.cliente?.nome ?? (r.cliente_id ?? "-")}</td>
  //           <td>${r.obra?.nome ?? (r.obra_id ?? "-")}</td>
  //           <td style="text-align:center">${totalUsers}</td>
  //           <td>${resumoEmpresas(r)}</td>
  //           <td style="text-align:right">${metros}</td>
  //           <td>${maquinasResumo(r)}</td>
  //         </tr>`;
  //     })
  //     .join("");

  //   const totalHorasPrint = registrosFiltrados.reduce((acc, r) => acc + toNumHours(r.horas), 0);
  //   const totalM2Print = registrosFiltrados.reduce((acc, r) => acc + toNum(r.metros_quadrados), 0);

  //   const stamp = new Date().toLocaleString();

  //   return `
  //     <!doctype html>
  //     <html>
  //       <head>
  //         <meta charset="utf-8" />
  //         <title>Relatório</title>
  //         <style>
  //           body { font-family: Arial, Helvetica, sans-serif; margin: 24px; }
  //           h1 { font-size: 18px; margin: 0 0 8px; }
  //           .meta { color: #555; font-size: 12px; margin-bottom: 12px; }
  //           table { width: 100%; border-collapse: collapse; border-spacing: 0; border: 1px solid #ddd; table-layout: fixed;}
  //           th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
  //           th { background: #f5f5f5; text-align: left; }
  //           tfoot td { font-weight: bold; }
  //           @media print { .no-print { display: none; } th, td { font-size: 11px; } }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="no-print" style="text-align:right; margin-bottom:12px;">
  //           <button onclick="window.print()">Imprimir</button>
  //         </div>
  //         <h1>Relatório (filtrado)</h1>
  //         <div class="meta">Gerado em ${stamp} — Registos: ${registrosFiltrados.length}</div>
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>Data</th>
  //               <th>Chefe de Equipa</th>
  //               <th>Cliente</th>
  //               <th>Obra</th>
  //               <th>Nº Trabalhadores</th>
  //               <th>Trab. por Empresa</th>
  //               <th>m²</th>
  //               <th>Máquinas</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${rows || `<tr><td colspan=9 style='text-align:center;color:#777'>Nenhum registo encontrado</td></tr>`}
  //           </tbody>
  //         </table>
  //       </body>
  //     </html>`;
  // };

  /* linha de totais
  <tfoot>
              <tr>
                <td colspan="6" style="text-align:right">Totais</td>
                <td style="text-align:right">${totalM2Print}</td>
                <td></td>
                <td style="text-align:right">${totalHorasPrint}</td>
              </tr>
            </tfoot>*/

  // Imprime via iframe escondida (não aciona bloqueador de pop-up)
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

    // aguarda o layout do iframe
    iframe.onload = () => {
      // alguns navegadores precisam de um pequeno delay
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // remove depois de imprimir
        setTimeout(() => document.body.removeChild(iframe), 500);
      }, 50);
    };
  };

  const handlePrint = () => {
    const html = buildPrintableHtml();
    printViaHiddenIframe(html);
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
          Relatórios
        </h1>
        <div className="rounded-2xl bg-white shadow-sm">
          <LoadingState message="A carregar relatório..." />
        </div>
      </div>
    );
  }
  if (erroCarregamento) {
    return (
      <div className="mx-auto w-full max-w-7xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Relatórios
        </h1>
        <div role="alert"
          className={[
            "rounded-xl border border-red-200",
            "bg-red-50 px-5 py-4 text-red-700",
          ].join(" ")}
        >
          {erroCarregamento}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
      <div className="flex gap-2">
        <Button onClick={handlePrint} className="btn-bg-blue-500">Imprimir</Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* chefe de equipa */}
          <select
            className="p-2 border rounded-xl w-full"
            value={filtroLeaderId}
            onChange={(e) => setFiltroLeaderId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Chefe de equipa (todos)</option>
            {leaders.map((u) => (
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

          {/* cliente */}
          <select
            className="p-2 border rounded-xl w-full"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Cliente (todos)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* obra (depende do cliente) */}
          <select
            className="p-2 border rounded-xl w-full"
            value={obraId}
            onChange={(e) => setObraId(e.target.value ? Number(e.target.value) : "")}
            disabled={!clienteId}
          >
            <option value="">{clienteId ? "Obra (todas)" : "Selecione um cliente"}</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>

          {/* filtro de máquinas */}
          <select
            className="p-2 border rounded-xl w-full"
            value={filtroMaquinas}
            onChange={(e) => setFiltroMaquinas(e.target.value as FiltroMaquinas)}
          >
            <option value="todos">Máquinas (todas)</option>
            <option value="com">Com intervenção</option>
            <option value="sem">Sem intervenção</option>
            <option value="laserComManobrador">Laser c/ manobrador</option>
            <option value="poComManobrador">Pó c/ manobrador</option>
            <option value="manobrador">Manobrador</option>
            <option value="soLaser">Só Laser</option>
            <option value="soPo">Só Pó</option>
            <option value="laserWS940CComManobrador">Laser WS 940C c/ manobrador</option>
            <option value="lazerYZ30ComManobrador">Lazer YZ30 c/ manobrador</option>
            <option value="soMaqLaserWS940C">Só Laser WS 940C</option>
            <option value="soMaqLazerYZ30">Só Lazer YZ30</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFiltroLeaderId("");
              setClienteId("");
              setObraId("");
              setFiltroMaquinas("todos");
              setDateMode("month");
              clearDates();
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl shadow overflow-x-auto mt-8 clear-both">
        <table cellSpacing="0" cellPadding="20" className="w-full table-auto text-sm divide-y divide-gray-200 table-spacing-0">
          <colgroup>
            <col style={{ width: "8%" }} />   {/* Data */}
            <col style={{ width: "14%" }} />  {/* Chefe de Equipa */}
            <col style={{ width: "12%" }} />  {/* Cliente */}
            <col style={{ width: "12%" }} />  {/* Obra */}
            <col style={{ width: "6%" }} />   {/* Nº Trab. */}
            <col style={{ width: "12%" }} />  {/* Trab. por Empresa */}
            <col style={{ width: "6%" }} />   {/* m² */}
            <col style={{ width: "14%" }} />  {/* Etapas */}
            <col style={{ width: "16%" }} />  {/* Interv. Máq. */}
          </colgroup>
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
            <tr className="head-lista">
              {/* <th className="px-4 py-2">Data</th> */}
              <th
                className="px-4 py-2 cursor-pointer select-none"
                onClick={() => {
                  setSortDir((old) => (old === "asc" ? "desc" : "asc"));
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Data</span>
                  <span className="text-[10px] leading-none text-gray-500">
                    {sortDir === "asc" ? "↑" : "↓"}
                  </span>
                </div>
              </th>
              <th className="px-4 py-2">Chefe de Equipa</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Obra</th>
              <th className="px-4 py-2">Nº Trabalhadores</th>
              <th className="px-4 py-2">Trab. por Empresa</th>
              <th className="px-4 py-2">m²</th>
              <th className="px-4 py-2">Etapas</th>
              <th className="px-4 py-2">Interv. Máq. (detalhes)</th>
              {/* <th className="p-3">Horas</th> */}
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  Nenhum registo encontrado
                </td>
              </tr>
            ) : (
              pageItems.map((r, idx) => {
                const totalUsers = r.equipa?.length || 0;
                //const metros = toNum(r.metros_quadrados);
                return (
                  <tr key={r.id} className={idx % 2 === 0 ? 'line-bg-white-600' : 'line-bg-gray-100'}>
                    <td className="px-4 py-2">{r.data}</td>
                    <td className="px-4 py-2">{r.user?.name ?? `#${r.usuario_id}`}</td>
                    <td className="px-4 py-2">{r.cliente?.nome ?? (r.cliente_id ?? "-")}</td>
                    <td className="px-4 py-2">{r.obra?.nome ?? (r.obra_id ?? "-")}</td>
                    <td className="px-4 py-2">{totalUsers}</td>
                    <td className="px-4 py-2 whitespace-pre-wrap">{renderResumoEmpresas(r)}</td>
                    {/* <td className="px-4 py-2">{metros}</td> */}
                    <td className="px-4 py-2">{r.metros_quadrados}</td>
                    <td className="px-4 py-2">{etapasResumo(r)}</td>
                    <td className="px-4 py-2 whitespace-pre-wrap">{maquinasResumo(r)}</td>
                    {/* <td className="p-3">{toNumHours(r.horas)}</td> */}
                  </tr>
                );
              })
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

        {/* total */}
        <div className="px-6 pb-6 text-right text-gray-700 font-medium">
          Total de Horas: <span className="font-bold">{totalHoras}</span>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;


// import React, { useEffect, useMemo, useState } from "react";
// import api from "@/services/api";
// import Pagination, { usePagination } from "@/components/pagination-utils";
// import { Button } from "@/components/ui/button";

// type User = { id: number; name: string };
// type Cliente = { id: number; nome: string };
// type Obra = { id: number; nome: string; cliente_id: number; cliente?: Cliente };

// type RegistroHoras = {
//   id: number;
//   data: string;                // "YYYY-MM-DD"
//   horas?: number | string;     // pode vir string
//   usuario_id: number;
//   user?: User;
//   cliente_id: number | null;
//   obra_id: number | null;
//   cliente?: Cliente | null;
//   obra?: Obra | null;
// };

// type DateMode = "week" | "month" | "year" | "range";

// const Relatorios: React.FC = () => {
//   // dados
//   const [registrosAll, setRegistrosAll] = useState<RegistroHoras[]>([]);
//   const [clientes, setClientes] = useState<Cliente[]>([]);
//   const [obras, setObras] = useState<Obra[]>([]);
//   const [leaders, setLeaders] = useState<User[]>([]); // vem de /users/

//   // filtros
//   const [filtroLeaderId, setFiltroLeaderId] = useState<number | "">("");
//   const [dateMode, setDateMode] = useState<DateMode>("month");
//   const [monthValue, setMonthValue] = useState<string>(""); // YYYY-MM
//   const [weekValue, setWeekValue] = useState<string>("");   // YYYY-W##
//   const [yearValue, setYearValue] = useState<string>("");   // YYYY
//   const [rangeFrom, setRangeFrom] = useState<string>("");   // YYYY-MM-DD
//   const [rangeTo, setRangeTo] = useState<string>("");       // YYYY-MM-DD
//   const [clienteId, setClienteId] = useState<number | "">("");
//   const [obraId, setObraId] = useState<number | "">("");

//   // helpers
//   const toNumHours = (h?: number | string) => {
//     if (typeof h === "number") return h;
//     if (typeof h === "string") {
//       const n = Number(h.replace(",", "."));
//       return isNaN(n) ? 0 : n;
//     }
//     return 0;
//   };

//   const toIsoWeek = (dStr: string) => {
//     const d = new Date(dStr + "T00:00:00");
//     const dayNr = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
//     const target = new Date(d);
//     target.setUTCDate(target.getUTCDate() - dayNr + 3); // quinta
//     const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
//     const diff = target.valueOf() - firstThursday.valueOf();
//     const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
//     const year = target.getUTCFullYear();
//     return `${year}-W${String(week).padStart(2, "0")}`;
//   };

//   // carga inicial
//   useEffect(() => {
//     (async () => {
//       const [reg, cls, usr] = await Promise.all([
//         api.get<RegistroHoras[]>("/registro-horas/"),
//         api.get<Cliente[]>("/clientes/"),
//         api.get<User[]>("/users/"),
//       ]);
//       setRegistrosAll(reg.data);
//       setClientes(cls.data);

//       // ordena usuários por nome para o select
//       const sortedUsers = [...usr.data].sort((a, b) =>
//         (a.name || "").localeCompare(b.name || "", "pt")
//       );
//       setLeaders(sortedUsers);
//     })();
//   }, []);

//   // quando trocar cliente, carregar obras do cliente
//   useEffect(() => {
//     (async () => {
//       if (!clienteId) {
//         setObras([]);
//         setObraId("");
//         return;
//       }
//       const { data } = await api.get<Obra[]>(`/obras/?cliente_id=${clienteId}`);
//       setObras(data);
//       if (obraId && !data.some((o) => o.id === obraId)) setObraId("");
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [clienteId]);

//   // aplica filtros
//   const registrosFiltrados = useMemo(() => {
//     return registrosAll.filter((r) => {
//       // líder
//       if (filtroLeaderId && r.user?.id !== filtroLeaderId && r.usuario_id !== filtroLeaderId)
//         return false;

//       // cliente
//       const ridCliente = r.cliente_id ?? r.cliente?.id ?? null;
//       if (clienteId && ridCliente !== clienteId) return false;

//       // obra
//       const ridObra = r.obra_id ?? r.obra?.id ?? null;
//       if (obraId && ridObra !== obraId) return false;

//       // data
//       if (!r.data) return false;

//       if (dateMode === "month" && monthValue) {
//         return r.data.slice(0, 7) === monthValue;
//       }
//       if (dateMode === "year" && yearValue) {
//         return r.data.slice(0, 4) === yearValue;
//       }
//       if (dateMode === "week" && weekValue) {
//         return toIsoWeek(r.data) === weekValue;
//       }
//       if (dateMode === "range" && (rangeFrom || rangeTo)) {
//         if (rangeFrom && r.data < rangeFrom) return false;
//         if (rangeTo && r.data > rangeTo) return false;
//       }
//       return true;
//     });
//   }, [
//     registrosAll,
//     filtroLeaderId,
//     clienteId,
//     obraId,
//     dateMode,
//     monthValue,
//     yearValue,
//     weekValue,
//     rangeFrom,
//     rangeTo,
//   ]);

//   // paginação em cima da lista filtrada
//   const {
//     pageItems,
//     currentPage,
//     setCurrentPage,
//     totalPages,
//   } = usePagination<RegistroHoras>(registrosFiltrados, 20);

//   // sempre que filtros mudam, volta para página 1
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [setCurrentPage, registrosFiltrados.length, filtroLeaderId, clienteId, obraId, dateMode, monthValue, yearValue, weekValue, rangeFrom, rangeTo]);

//   const totalHoras = useMemo(
//     () => registrosFiltrados.reduce((acc, r) => acc + toNumHours(r.horas), 0),
//     [registrosFiltrados]
//   );

//   const clearDates = () => {
//     setMonthValue("");
//     setYearValue("");
//     setWeekValue("");
//     setRangeFrom("");
//     setRangeTo("");
//   };

//   const DateInputs = () => {
//     switch (dateMode) {
//       case "month":
//         return (
//           <input
//             type="month"
//             className="p-2 border rounded-xl w-full"
//             value={monthValue}
//             onChange={(e) => setMonthValue(e.target.value)}
//           />
//         );
//       case "year":
//         return (
//           <input
//             type="number"
//             min={2000}
//             max={2100}
//             placeholder="YYYY"
//             className="p-2 border rounded-xl w-full"
//             value={yearValue}
//             onChange={(e) => setYearValue(e.target.value)}
//           />
//         );
//       case "week":
//         return (
//           <input
//             type="week"
//             className="p-2 border rounded-xl w-full"
//             value={weekValue}
//             onChange={(e) => setWeekValue(e.target.value)}
//           />
//         );
//       case "range":
//         return (
//           <div className="grid grid-cols-2 gap-2">
//             <input
//               type="date"
//               className="p-2 border rounded-xl w-full"
//               value={rangeFrom}
//               onChange={(e) => setRangeFrom(e.target.value)}
//             />
//             <input
//               type="date"
//               className="p-2 border rounded-xl w-full"
//               value={rangeTo}
//               onChange={(e) => setRangeTo(e.target.value)}
//             />
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto p-6 space-y-6">
//       <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>

//       {/* Filtros */}
//       <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           {/* chefe de equipa */}
//           <select
//             className="p-2 border rounded-xl w-full"
//             value={filtroLeaderId}
//             onChange={(e) => setFiltroLeaderId(e.target.value ? Number(e.target.value) : "")}
//           >
//             <option value="">Chefe de equipa (todos)</option>
//             {leaders.map((u) => (
//               <option key={u.id} value={u.id}>
//                 {u.name}
//               </option>
//             ))}
//           </select>

//           {/* modo e entrada de data */}
//           <div className="grid grid-cols-1 gap-2">
//             <select
//               className="p-2 border rounded-xl w-full"
//               value={dateMode}
//               onChange={(e) => {
//                 setDateMode(e.target.value as DateMode);
//                 clearDates();
//               }}
//             >
//               <option value="month">Mensal</option>
//               <option value="week">Semanal</option>
//               <option value="year">Anual</option>
//               <option value="range">Por Período</option>
//             </select>
//             <DateInputs />
//           </div>

//           {/* cliente */}
//           <select
//             className="p-2 border rounded-xl w-full"
//             value={clienteId}
//             onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : "")}
//           >
//             <option value="">Cliente (todos)</option>
//             {clientes.map((c) => (
//               <option key={c.id} value={c.id}>
//                 {c.nome}
//               </option>
//             ))}
//           </select>

//           {/* obra (depende do cliente) */}
//           <select
//             className="p-2 border rounded-xl w-full"
//             value={obraId}
//             onChange={(e) => setObraId(e.target.value ? Number(e.target.value) : "")}
//             disabled={!clienteId}
//           >
//             <option value="">{clienteId ? "Obra (todas)" : "Selecione um cliente"}</option>
//             {obras.map((o) => (
//               <option key={o.id} value={o.id}>
//                 {o.nome}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex justify-end gap-2">
//           <Button
//             variant="outline"
//             onClick={() => {
//               setFiltroLeaderId("");
//               setClienteId("");
//               setObraId("");
//               setDateMode("month");
//               clearDates();
//             }}
//           >
//             Limpar Filtros
//           </Button>
//         </div>
//       </div>

//       {/* Tabela */}
//       <div className="bg-white rounded-2xl shadow p-0 overflow-x-auto">
//         <table className="min-w-full table-auto">
//           <thead className="bg-gray-100 text-left">
//             <tr>
//               <th className="p-3">Data</th>
//               <th className="p-3">Chefe de Equipa</th>
//               <th className="p-3">Cliente</th>
//               <th className="p-3">Obra</th>
//               <th className="p-3">Horas</th>
//             </tr>
//           </thead>
//           <tbody>
//             {pageItems.length === 0 ? (
//               <tr>
//                 <td colSpan={5} className="p-6 text-center text-gray-500">
//                   Nenhum registo encontrado
//                 </td>
//               </tr>
//             ) : (
//               pageItems.map((r) => (
//                 <tr key={r.id} className="border-t">
//                   <td className="p-3">{r.data}</td>
//                   <td className="p-3">{r.user?.name ?? `#${r.usuario_id}`}</td>
//                   <td className="p-3">{r.cliente?.nome ?? (r.cliente_id ?? "-")}</td>
//                   <td className="p-3">{r.obra?.nome ?? (r.obra_id ?? "-")}</td>
//                   <td className="p-3">{toNumHours(r.horas)}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>

//         {/* paginação */}
//         <div className="p-4">
//           <Pagination
//             totalPages={totalPages}
//             currentPage={currentPage}
//             onPageChange={setCurrentPage}
//             siblingCount={1}
//             boundaryCount={1}
//           />
//         </div>

//         {/* total */}
//         <div className="px-6 pb-6 text-right text-gray-700 font-medium">
//           Total de Horas: <span className="font-bold">{totalHoras}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Relatorios;


// import React, { useState } from 'react';

// interface Registro {
//   operador: string;
//   projeto: string;
//   data: string;
//   horas: number;
// }

// const Relatorios: React.FC = () => {
//   const [filtroProjeto, setFiltroProjeto] = useState('');
//   const [filtroOperador, setFiltroOperador] = useState('');
//   const [filtroMes, setFiltroMes] = useState('');

//   // Simulação de dados
//   const registros: Registro[] = [
//     { operador: 'João', projeto: 'Projeto A', data: '2025-06-01', horas: 8 },
//     { operador: 'Maria', projeto: 'Projeto B', data: '2025-06-02', horas: 6 },
//     { operador: 'João', projeto: 'Projeto A', data: '2025-06-03', horas: 7 },
//     { operador: 'Maria', projeto: 'Projeto B', data: '2025-06-04', horas: 8 },
//   ];

//   const registrosFiltrados = registros.filter((r) => {
//     const mesRegistro = r.data.slice(0, 7);
//     return (
//       (!filtroProjeto || r.projeto === filtroProjeto) &&
//       (!filtroOperador || r.operador === filtroOperador) &&
//       (!filtroMes || mesRegistro === filtroMes)
//     );
//   });

//   const totalHoras = registrosFiltrados.reduce((acc, r) => acc + r.horas, 0);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800">Relatórios</h1>

//       {/* Filtros */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//         <select
//           className="p-2 border rounded-xl w-full"
//           value={filtroProjeto}
//           onChange={(e) => setFiltroProjeto(e.target.value)}
//         >
//           <option value="">Todos os Projetos</option>
//           <option value="Projeto A">Projeto A</option>
//           <option value="Projeto B">Projeto B</option>
//         </select>

//         <select
//           className="p-2 border rounded-xl w-full"
//           value={filtroOperador}
//           onChange={(e) => setFiltroOperador(e.target.value)}
//         >
//           <option value="">Todos os Operadores</option>
//           <option value="João">João</option>
//           <option value="Maria">Maria</option>
//         </select>

//         <input
//           type="month"
//           className="p-2 border rounded-xl w-full"
//           value={filtroMes}
//           onChange={(e) => setFiltroMes(e.target.value)}
//         />
//       </div>

//       {/* Tabela */}
//       <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
//         <table className="min-w-full table-auto">
//           <thead className="bg-gray-100 text-left">
//             <tr>
//               <th className="p-3">Data</th>
//               <th className="p-3">Projeto</th>
//               <th className="p-3">Operador</th>
//               <th className="p-3">Horas</th>
//             </tr>
//           </thead>
//           <tbody>
//             {registrosFiltrados.map((r, i) => (
//               <tr key={i} className="border-t">
//                 <td className="p-3">{r.data}</td>
//                 <td className="p-3">{r.projeto}</td>
//                 <td className="p-3">{r.operador}</td>
//                 <td className="p-3">{r.horas}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className="mt-4 text-right text-gray-700 font-medium">
//           Total de Horas: <span className="font-bold">{totalHoras}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Relatorios;
