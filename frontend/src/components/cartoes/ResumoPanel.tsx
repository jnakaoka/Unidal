import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import axios from "axios";
  import {
    AlertTriangle,
    Car,
    CreditCard,
    LayoutDashboard,
    RefreshCw,
    UserRound,
  } from "lucide-react";

  import LoadingState from "@/components/LoadingState";
  import { Button } from "@/components/ui/button";
  import {
    listarAssociacoes,
    listarAssociacoesCondutores,
    listarCartoes,
    listarVeiculos,
  } from "@/services/cartoes";
  import type {
    Cartao,
    CartaoVeiculoAssociacao,
    Veiculo,
    VeiculoCondutorAssociacao,
  } from "@/types/cartao";

  type AbaDestino =
    | "associacoes"
    | "cartoes"
    | "veiculos"
    | "condutores";

    interface ResumoPanelProps {
        onNavegar: (aba: AbaDestino) => void;
    }


  function obterMensagemErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const detalhe = erro.response?.data?.detail;

      if (typeof detalhe === "string") {
        return detalhe;
      }
    }

    return "Não foi possível carregar o resumo.";
  }

  export default function ResumoPanel({
        onNavegar,
    }: ResumoPanelProps) {
    const [cartoes, setCartoes] = useState<Cartao[]>([]);
    const [veiculos, setVeiculos] = useState<Veiculo[]>(
      [],
    );
    const [
      associacoesCartoes,
      setAssociacoesCartoes,
    ] = useState<CartaoVeiculoAssociacao[]>([]);
    const [
      associacoesCondutores,
      setAssociacoesCondutores,
    ] = useState<VeiculoCondutorAssociacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);

        const [
          dadosCartoes,
          dadosVeiculos,
          dadosAssociacoesCartoes,
          dadosAssociacoesCondutores,
        ] = await Promise.all([
          listarCartoes(),
          listarVeiculos(true),
          listarAssociacoes({
            ativa: true,
          }),
          listarAssociacoesCondutores({
            ativa: true,
          }),
        ]);

        setCartoes(dadosCartoes);
        setVeiculos(dadosVeiculos);
        setAssociacoesCartoes(
          dadosAssociacoesCartoes,
        );
        setAssociacoesCondutores(
          dadosAssociacoesCondutores,
        );
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setCarregando(false);
      }
    }

    useEffect(() => {
      void carregar();
    }, []);

    const dadosResumo = useMemo(() => {
      const cartoesAssociados = new Set(
        associacoesCartoes.map(
          (associacao) => associacao.cartao_id,
        ),
      );

      const veiculosComCartao = new Set(
        associacoesCartoes.map(
          (associacao) => associacao.veiculo_id,
        ),
      );

      const veiculosComCondutor = new Set(
        associacoesCondutores.map(
          (associacao) => associacao.veiculo_id,
        ),
      );

      const cartoesDisponiveis = cartoes.filter(
        (cartao) => (
          cartao.estado === "ativo"
          && !cartoesAssociados.has(cartao.id)
        ),
      );

      const cartoesAtencao = cartoes.filter(
        (cartao) => cartao.estado !== "ativo",
      );

      const veiculosSemCartao = veiculos.filter(
        (veiculo) => !veiculosComCartao.has(veiculo.id),
      );

      const veiculosSemCondutor = veiculos.filter(
        (veiculo) => (
          !veiculosComCondutor.has(veiculo.id)
        ),
      );

      return {
        cartoesDisponiveis,
        cartoesAtencao,
        veiculosSemCartao,
        veiculosSemCondutor,
      };
    }, [
      associacoesCartoes,
      associacoesCondutores,
      cartoes,
      veiculos,
    ]);

    const indicadores = [
      {
        nome: "Total de cartões",
        valor: cartoes.length,
        descricao: "Cartões cadastrados",
        cor: "border-blue-200 bg-blue-50 text-blue-700",
        Icone: CreditCard,
        destino: "cartoes" as const,
      },
      {
        nome: "Disponíveis",
        valor: dadosResumo.cartoesDisponiveis.length,
        descricao: "Ativos sem veículo",
        cor: "border-green-200 bg-green-50 text-green-700",
        Icone: CreditCard,
        destino: "associacoes" as const,
      },
      {
        nome: "Em utilização",
        valor: associacoesCartoes.length,
        descricao: "Com associação ativa",
        cor: "border-indigo-200 bg-indigo-50 text-indigo-700",
        Icone: CreditCard,
        destino: "associacoes" as const,
      },
      {
        nome: "Exigem atenção",
        valor: dadosResumo.cartoesAtencao.length,
        descricao: "Não estão ativos",
        cor: "border-amber-200 bg-amber-50 text-amber-700",
        Icone: AlertTriangle,
        destino: "cartoes" as const,
      },
      {
        nome: "Veículos ativos",
        valor: veiculos.length,
        descricao: "Disponíveis no cadastro",
        cor: "border-purple-200 bg-purple-50 text-purple-700",
        Icone: Car,
        destino: "veiculos" as const,
      },
      {
        nome: "Sem cartão",
        valor: dadosResumo.veiculosSemCartao.length,
        descricao: "Veículos sem cartões",
        cor: "border-gray-200 bg-gray-50 text-gray-700",
        Icone: Car,
        destino: "veiculos" as const,
      },
      {
        nome: "Sem condutor",
        valor: dadosResumo.veiculosSemCondutor.length,
        descricao: "Veículos sem condutor",
        cor: "border-rose-200 bg-rose-50 text-rose-700",
        Icone: UserRound,
        destino: "condutores" as const,
      },
    ];

    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-blue-700" />

              <h2 className="text-xl font-semibold text-gray-900">
                Resumo operacional
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Consulte rapidamente a situação atual de
              cartões, veículos e condutores.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void carregar()}
            disabled={carregando}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </header>

        {erro && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {erro}
          </div>
        )}

        {carregando && cartoes.length === 0 ? (
          <LoadingState message="A carregar resumo..." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {indicadores.map((indicador) => {
                const Icone = indicador.Icone;

                return (
                    <button
                        key={indicador.nome}
                        type="button"
                        onClick={() => {
                        onNavegar(indicador.destino);
                        }}
                        className={
                        "rounded-xl border p-4 text-left "
                        + "transition hover:-translate-y-0.5 "
                        + "hover:shadow-md "
                        + indicador.cor
                        }
                    >
                        <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium">
                            {indicador.nome}
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                            {indicador.valor}
                            </p>

                            <p className="mt-1 text-xs opacity-80">
                            {indicador.descricao}
                            </p>
                        </div>

                        <Icone className="h-6 w-6" />
                        </div>
                    </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b px-5 py-4">
                  <h3 className="font-semibold text-gray-900">
                    Cartões que exigem atenção
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Bloqueados, perdidos, cancelados ou
                    expirados.
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {dadosResumo.cartoesAtencao.map(
                    (cartao) => (
                      <div
                        key={cartao.id}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {cartao.nome}
                          </p>

                          <p className="text-xs text-gray-500">
                            {cartao.identificador}
                          </p>
                        </div>

                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          {cartao.estado}
                        </span>
                      </div>
                    ),
                  )}

                  {dadosResumo.cartoesAtencao.length
                    === 0 && (
                      <p className="px-5 py-6 text-center text-sm text-gray-500">
                        Nenhum cartão exige atenção.
                      </p>
                    )}
                </div>
              </div>

              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b px-5 py-4">
                  <h3 className="font-semibold text-gray-900">
                    Veículos com pendências
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Veículos sem cartões ou sem condutor.
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {veiculos
                    .filter((veiculo) => (
                      dadosResumo.veiculosSemCartao.some(
                        (item) => item.id === veiculo.id,
                      )
                      || dadosResumo.veiculosSemCondutor.some(
                        (item) => item.id === veiculo.id,
                      )
                    ))
                    .map((veiculo) => {
                      const semCartao =
                        dadosResumo.veiculosSemCartao.some(
                          (item) => item.id === veiculo.id,
                        );
                      const semCondutor =
                        dadosResumo.veiculosSemCondutor.some(
                          (item) => item.id === veiculo.id,
                        );

                      return (
                        <div
                          key={veiculo.id}
                          className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {veiculo.matricula}
                            </p>

                            <p className="text-xs text-gray-500">
                              {veiculo.descricao
                                || veiculo.tipo}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {semCartao && (
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                Sem cartão
                              </span>
                            )}

                            {semCondutor && (
                              <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">
                                Sem condutor
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {dadosResumo.veiculosSemCartao.length
                    === 0
                    && dadosResumo.veiculosSemCondutor.length
                    === 0
                    && (
                      <p className="px-5 py-6 text-center text-sm text-gray-500">
                        Nenhum veículo possui pendências.
                      </p>
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    );
  }