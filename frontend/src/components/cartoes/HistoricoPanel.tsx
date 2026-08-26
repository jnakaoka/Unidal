import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import axios from "axios";
  import {
    History,
    RefreshCw,
    Search,
  } from "lucide-react";

  import LoadingState from "@/components/LoadingState";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import {
    listarAssociacoes,
    listarAssociacoesCondutores,
  } from "@/services/cartoes";

  type Categoria = "cartao" | "condutor";
  type Acao = "associacao" | "desassociacao";

  interface Movimento {
    id: string;
    data: string;
    categoria: Categoria;
    acao: Acao;
    entidade: string;
    detalhe: string;
    veiculo: string;
    responsavel: string;
    observacoes: string | null;
  }

  function obterMensagemErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const detalhe = erro.response?.data?.detail;

      if (typeof detalhe === "string") {
        return detalhe;
      }
    }

    return "Não foi possível carregar o histórico.";
  }

  function formatarData(valor: string): string {
    return new Intl.DateTimeFormat(
      "pt-PT",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(new Date(valor));
  }

  function formatarDataInput(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1)
      .padStart(2, "0");
    const dia = String(data.getDate())
      .padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function converterDataInput(
    valor: string,
    finalDoDia = false,
  ): Date | null {
    if (!valor) {
      return null;
    }

    const [ano, mes, dia] = valor
      .split("-")
      .map(Number);

    if (!ano || !mes || !dia) {
      return null;
    }

    return new Date(
      ano,
      mes - 1,
      dia,
      finalDoDia ? 23 : 0,
      finalDoDia ? 59 : 0,
      finalDoDia ? 59 : 0,
      finalDoDia ? 999 : 0,
    );
  }

  function nomeAcao(
    categoria: Categoria,
    acao: Acao,
  ): string {
    if (categoria === "cartao") {
      return acao === "associacao"
        ? "Cartão associado"
        : "Cartão desassociado";
    }

    return acao === "associacao"
      ? "Condutor associado"
      : "Condutor desassociado";
  }

  function classesAcao(acao: Acao): string {
    return acao === "associacao"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";
  }

  export default function HistoricoPanel() {
    const [movimentos, setMovimentos] = useState<
      Movimento[]
    >([]);
    const [pesquisa, setPesquisa] = useState("");
    const [categoria, setCategoria] = useState("");
    const [acao, setAcao] = useState("");
    const [dataInicial, setDataInicial] = useState("");
    const [dataFinal, setDataFinal] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);

        const [
          associacoesCartoes,
          associacoesCondutores,
        ] = await Promise.all([
          listarAssociacoes(),
          listarAssociacoesCondutores(),
        ]);

        const dados: Movimento[] = [];

        associacoesCartoes.forEach((associacao) => {
          dados.push({
            id: `cartao-associacao-${associacao.id}`,
            data: associacao.associado_em,
            categoria: "cartao",
            acao: "associacao",
            entidade: associacao.cartao.nome,
            detalhe: associacao.cartao.identificador,
            veiculo: associacao.veiculo.matricula,
            responsavel: associacao.associado_por.name,
            observacoes: associacao.observacoes,
          });

          if (associacao.desassociado_em) {
            dados.push({
              id: `cartao-desassociacao-${associacao.id}`,
              data: associacao.desassociado_em,
              categoria: "cartao",
              acao: "desassociacao",
              entidade: associacao.cartao.nome,
              detalhe: associacao.cartao.identificador,
              veiculo: associacao.veiculo.matricula,
              responsavel:
                associacao.desassociado_por?.name
                ?? "—",
              observacoes: associacao.observacoes,
            });
          }
        });

        associacoesCondutores.forEach((associacao) => {
          dados.push({
            id: `condutor-associacao-${associacao.id}`,
            data: associacao.associado_em,
            categoria: "condutor",
            acao: "associacao",
            entidade: associacao.condutor.name,
            detalhe: associacao.condutor.empresa,
            veiculo: associacao.veiculo.matricula,
            responsavel: associacao.associado_por.name,
            observacoes: associacao.observacoes,
          });

          if (associacao.desassociado_em) {
            dados.push({
              id: (
                `condutor-desassociacao-${associacao.id}`
              ),
              data: associacao.desassociado_em,
              categoria: "condutor",
              acao: "desassociacao",
              entidade: associacao.condutor.name,
              detalhe: associacao.condutor.empresa,
              veiculo: associacao.veiculo.matricula,
              responsavel:
                associacao.desassociado_por?.name
                ?? "—",
              observacoes: associacao.observacoes,
            });
          }
        });

        dados.sort(
          (primeiro, segundo) => (
            new Date(segundo.data).getTime()
            - new Date(primeiro.data).getTime()
          ),
        );

        setMovimentos(dados);
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setCarregando(false);
      }
    }

    useEffect(() => {
      void carregar();
    }, []);

    function aplicarUltimosDias(dias: number) {
        const final = new Date();
        const inicial = new Date();

        inicial.setDate(
            inicial.getDate() - (dias - 1),
        );

        setDataInicial(formatarDataInput(inicial));
        setDataFinal(formatarDataInput(final));
    }

    function aplicarHoje() {
        const hoje = formatarDataInput(new Date());

        setDataInicial(hoje);
        setDataFinal(hoje);
        }

        function limparPeriodo() {
        setDataInicial("");
        setDataFinal("");
    }

    const periodoInvalido = Boolean(
        dataInicial
        && dataFinal
        && dataInicial > dataFinal,
    );

    const movimentosFiltrados = useMemo(() => {
      const termo = pesquisa.trim().toLocaleLowerCase();

      return movimentos.filter((movimento) => {
        if (periodoInvalido) {
            return false;
        }

        const inicio = converterDataInput(dataInicial);
        const fim = converterDataInput(
        dataFinal,
        true,
        );
        const dataMovimento = new Date(
        movimento.data,
        ).getTime();

        if (
        inicio
        && dataMovimento < inicio.getTime()
        ) {
        return false;
        }

        if (
        fim
        && dataMovimento > fim.getTime()
        ) {
        return false;
        }

        if (
          categoria
          && movimento.categoria !== categoria
        ) {
          return false;
        }

        if (acao && movimento.acao !== acao) {
          return false;
        }

        if (!termo) {
          return true;
        }

        const texto = [
          nomeAcao(
            movimento.categoria,
            movimento.acao,
          ),
          movimento.entidade,
          movimento.detalhe,
          movimento.veiculo,
          movimento.responsavel,
          movimento.observacoes ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase();

        return texto.includes(termo);
      });
    }, [
        acao,
        categoria,
        dataFinal,
        dataInicial,
        movimentos,
        periodoInvalido,
        pesquisa,
    ]);

    return (
      <section className="space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-blue-700" />

              <h2 className="text-xl font-semibold text-gray-900">
                Histórico geral
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Consulte todas as movimentações de
              cartões e condutores.
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px]">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
            />

            <Input
              value={pesquisa}
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm"
              placeholder="Pesquisar cartão, condutor, veículo ou responsável"
              onChange={(event) => {
                setPesquisa(event.target.value);
              }}
            />
          </div>

          <select
            value={categoria}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            aria-label="Filtrar por categoria"
            onChange={(event) => {
              setCategoria(event.target.value);
            }}
          >
            <option value="">Todas as categorias</option>
            <option value="cartao">Cartões</option>
            <option value="condutor">Condutores</option>
          </select>

          <select
            value={acao}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            aria-label="Filtrar por movimento"
            onChange={(event) => {
              setAcao(event.target.value);
            }}
          >
            <option value="">Todos os movimentos</option>
            <option value="associacao">Associações</option>
            <option value="desassociacao">
              Desassociações
            </option>
          </select>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label
                        htmlFor="historico-data-inicial"
                        className="text-xs font-medium text-gray-600"
                        >
                        Data inicial
                        </label>

                        <Input
                        id="historico-data-inicial"
                        type="date"
                        value={dataInicial}
                        max={dataFinal || undefined}
                        onChange={(event) => {
                            setDataInicial(event.target.value);
                        }}
                        />
                    </div>

                    <div className="space-y-1">
                        <label
                        htmlFor="historico-data-final"
                        className="text-xs font-medium text-gray-600"
                        >
                        Data final
                        </label>

                        <Input
                        id="historico-data-final"
                        type="date"
                        value={dataFinal}
                        min={dataInicial || undefined}
                        onChange={(event) => {
                            setDataFinal(event.target.value);
                        }}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={aplicarHoje}
                >
                    Hoje
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => aplicarUltimosDias(7)}
                >
                    7 dias
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => aplicarUltimosDias(30)}
                >
                    30 dias
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={limparPeriodo}
                    disabled={!dataInicial && !dataFinal}
                >
                    Todo o período
                </Button>
                </div>
            </div>

            {periodoInvalido && (
                <p
                className="mt-3 text-sm text-red-700"
                role="alert"
                >
                A data inicial não pode ser posterior à
                data final.
                </p>
            )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>
                {movimentosFiltrados.length}
                {" "}
                {movimentosFiltrados.length === 1
                ? "movimentação encontrada"
                : "movimentações encontradas"}
            </span>

            {(pesquisa
                || categoria
                || acao
                || dataInicial
                || dataFinal) && (
                <button
                type="button"
                className="font-medium text-blue-700 hover:underline"
                onClick={() => {
                    setPesquisa("");
                    setCategoria("");
                    setAcao("");
                    limparPeriodo();
                }}
                >
                Limpar todos os filtros
                </button>
            )}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  Data
                </th>
                <th className="px-4 py-3">
                  Movimento
                </th>
                <th className="px-4 py-3">
                  Cartão ou condutor
                </th>
                <th className="px-4 py-3">
                  Veículo
                </th>
                <th className="px-4 py-3">
                  Responsável
                </th>
                <th className="px-4 py-3">
                  Observações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {movimentosFiltrados.map((movimento) => (
                <tr key={movimento.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatarData(movimento.data)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-1 text-xs font-medium "
                        + classesAcao(movimento.acao)
                      }
                    >
                      {nomeAcao(
                        movimento.categoria,
                        movimento.acao,
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {movimento.entidade}
                    </div>

                    <div className="text-xs text-gray-500">
                      {movimento.detalhe}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {movimento.veiculo}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {movimento.responsavel}
                  </td>

                  <td className="max-w-xs px-4 py-3 text-gray-600">
                    {movimento.observacoes || "—"}
                  </td>
                </tr>
              ))}

              {!carregando
                && movimentosFiltrados.length === 0
                && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhuma movimentação encontrada.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>

          {carregando && (
            <LoadingState
              message="A carregar histórico..."
              compact
            />
          )}
        </div>
      </section>
    );
  }