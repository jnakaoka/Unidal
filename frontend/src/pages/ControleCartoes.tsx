import { useState } from "react";
import {
  ArrowRightLeft,
  Car,
  CreditCard,
  UserRound,
  History,
  LayoutDashboard,
} from "lucide-react";

import AssociacoesPanel from "@/components/cartoes/AssociacoesPanel";
import CartoesPanel from "@/components/cartoes/CartoesPanel";
import VeiculosPanel from "@/components/cartoes/VeiculosPanel";
import CondutoresPanel from "@/components/cartoes/CondutoresPanel";
import HistoricoPanel from "@/components/cartoes/HistoricoPanel";
import ResumoPanel from "@/components/cartoes/ResumoPanel";

type Aba =
  | "resumo"
  | "associacoes"
  | "cartoes"
  | "veiculos"
  | "condutores"
  | "historico";

const abas = [
  {
    id: "resumo" as const,
    nome: "Resumo",
    descricao: "Situação operacional",
    icon: LayoutDashboard,
  },
  {
    id: "associacoes" as const,
    nome: "Associações",
    descricao: "Localização e histórico",
    icon: ArrowRightLeft,
  },
  {
    id: "cartoes" as const,
    nome: "Cartões",
    descricao: "Cadastro e estados",
    icon: CreditCard,
  },
  {
    id: "veiculos" as const,
    nome: "Veículos",
    descricao: "Carrinhas e viaturas",
    icon: Car,
  },
  {
    id: "condutores" as const,
    nome: "Condutores",
    descricao: "Veículo atual e histórico",
    icon: UserRound,
  },
  {
    id: "historico" as const,
    nome: "Histórico",
    descricao: "Todas as movimentações",
    icon: History,
  },
];

export default function ControleCartoes() {
  const [abaAtiva, setAbaAtiva] =
    useState<Aba>("resumo");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Controle de cartões
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Gerencie cartões, veículos, condutores e
          o histórico de movimentações.
        </p>
      </header>

      <nav
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Áreas do controle de cartões"
      >
        {abas.map((aba) => {
          const Icone = aba.icon;
          const selecionada = abaAtiva === aba.id;

          return (
            <button
              key={aba.id}
              type="button"
              aria-pressed={selecionada}
              onClick={() => setAbaAtiva(aba.id)}
              className={
                "flex items-center gap-3 rounded-xl border p-4 text-left transition "
                + (
                  selecionada
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-blue-300"
                )
              }
            >
              <span
                className={
                  "rounded-lg p-2 "
                  + (
                    selecionada
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  )
                }
              >
                <Icone className="h-5 w-5" />
              </span>

              <span>
                <span className="block font-semibold text-gray-900">
                  {aba.nome}
                </span>

                <span className="block text-xs text-gray-500">
                  {aba.descricao}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <main className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        {abaAtiva === "resumo" && (
          <ResumoPanel
            onNavegar={(aba) => setAbaAtiva(aba)}
          />
        )}

        {abaAtiva === "associacoes" && (
          <AssociacoesPanel />
        )}

        {abaAtiva === "cartoes" && (
          <CartoesPanel />
        )}

        {abaAtiva === "veiculos" && (
          <VeiculosPanel />
        )}

        {abaAtiva === "condutores" && (
          <CondutoresPanel />
        )}

        {abaAtiva === "historico" && (
          <HistoricoPanel />
        )}
      </main>
    </div>
  );
}