import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import axios from "axios";
  import {
    ArrowRightLeft,
    History,
    Link,
    Search,
    Unlink,
  } from "lucide-react";

  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import {
    associarCartao,
    desassociarCartao,
    listarAssociacoes,
    listarCartoes,
    listarVeiculos,
    listarAssociacoesCondutores,
    obterHistoricoCartao,
    transferirCartao,
  } from "@/services/cartoes";
  import type {
    Cartao,
    CartaoVeiculoAssociacao,
    Veiculo,
    VeiculoCondutorAssociacao,
  } from "@/types/cartao";
  import LoadingState from "@/components/LoadingState";

  type TipoOperacao = "associar" | "transferir";

  interface Operacao {
    tipo: TipoOperacao;
    cartao: Cartao;
    associacaoAtual: CartaoVeiculoAssociacao | null;
  }

  function obterMensagemErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const detalhe = erro.response?.data?.detail;

      if (typeof detalhe === "string") {
        return detalhe;
      }
    }

    return "Não foi possível concluir a operação.";
  }

  function formatarData(valor: string | null): string {
    if (!valor) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "pt-PT",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(new Date(valor));
  }

  export default function AssociacoesPanel() {
    const [cartoes, setCartoes] = useState<Cartao[]>([]);
    const [veiculos, setVeiculos] = useState<Veiculo[]>(
      [],
    );
    const [associacoes, setAssociacoes] = useState<
      CartaoVeiculoAssociacao[]
    >([]);
    const [
      associacoesCondutores,
      setAssociacoesCondutores,
    ] = useState<VeiculoCondutorAssociacao[]>([]);

    const [pesquisa, setPesquisa] = useState("");
    const [operacao, setOperacao] =
      useState<Operacao | null>(null);
    const [veiculoSelecionado, setVeiculoSelecionado] =
      useState("");
    const [observacoes, setObservacoes] = useState("");
    const [historico, setHistorico] = useState<
      CartaoVeiculoAssociacao[]
    >([]);
    const [cartaoHistorico, setCartaoHistorico] =
      useState<Cartao | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);

        const [
          dadosCartoes,
          dadosVeiculos,
          dadosAssociacoes,
          dadosAssociacoesCondutores,
        ] = await Promise.all([
          listarCartoes(),
          listarVeiculos(true),
          listarAssociacoes({
            ativa: true,
          }),
          listarAssociacoesCondutores({
            ativa: true,
          }).catch(() => []),
        ]);

        setCartoes(dadosCartoes);
        setVeiculos(dadosVeiculos);
        setAssociacoes(dadosAssociacoes);
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

    const associacaoPorCartao = useMemo(() => {
      return new Map(
        associacoes.map((associacao) => [
          associacao.cartao_id,
          associacao,
        ]),
      );
    }, [associacoes]);

    const condutorPorVeiculo = useMemo(() => {
      return new Map(
        associacoesCondutores.map((associacao) => [
          associacao.veiculo_id,
          associacao,
        ]),
      );
    }, [associacoesCondutores]);

    const cartoesFiltrados = useMemo(() => {
      const termo = pesquisa.trim().toLocaleLowerCase();

      if (!termo) {
        return cartoes;
      }

      return cartoes.filter((cartao) => {
        const associacao = associacaoPorCartao.get(
          cartao.id,
        );

        const associacaoCondutor = associacao ? condutorPorVeiculo.get(associacao.veiculo_id,) : undefined;

        const texto = [
          cartao.nome,
          cartao.identificador,
          cartao.tipo,
          cartao.estado,
          associacao?.veiculo.matricula ?? "",
          associacaoCondutor?.condutor.name ?? "",
          associacaoCondutor?.condutor.empresa ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase();

        return texto.includes(termo);
      });
    }, [
      associacaoPorCartao,
      cartoes,
      condutorPorVeiculo,
      pesquisa,
    ]);

    function abrirOperacao(
      tipo: TipoOperacao,
      cartao: Cartao,
      associacaoAtual:
        CartaoVeiculoAssociacao | null,
    ) {
      const primeiroDisponivel = veiculos.find(
        (veiculo) => (
          veiculo.id
          !== associacaoAtual?.veiculo_id
        ),
      );

      setOperacao({
        tipo,
        cartao,
        associacaoAtual,
      });
      setVeiculoSelecionado(
        primeiroDisponivel?.id.toString() ?? "",
      );
      setObservacoes("");
      setErro(null);
    }

    function fecharOperacao() {
      setOperacao(null);
      setVeiculoSelecionado("");
      setObservacoes("");
    }

    async function executarOperacao() {
      if (!operacao) {
        return;
      }

      const veiculoId = Number(veiculoSelecionado);

      if (!veiculoId) {
        setErro("Selecione um veículo.");
        return;
      }

      try {
        setSalvando(true);
        setErro(null);

        if (operacao.tipo === "associar") {
          await associarCartao({
            cartao_id: operacao.cartao.id,
            veiculo_id: veiculoId,
            observacoes:
              observacoes.trim() || null,
          });
        } else {
          await transferirCartao(
            operacao.cartao.id,
            {
              veiculo_destino_id: veiculoId,
              observacoes:
                observacoes.trim() || null,
            },
          );
        }

        fecharOperacao();
        await carregar();
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setSalvando(false);
      }
    }

    async function desassociar(
      cartao: Cartao,
      associacao: CartaoVeiculoAssociacao,
    ) {
      if (
        !window.confirm(
          `Desassociar o cartão "${cartao.nome}" `
          + `do veículo `
          + `"${associacao.veiculo.matricula}"?`,
        )
      ) {
        return;
      }

      try {
        setErro(null);

        await desassociarCartao(cartao.id);
        await carregar();

        if (cartaoHistorico?.id === cartao.id) {
          await abrirHistorico(cartao);
        }
      } catch (error) {
        setErro(obterMensagemErro(error));
      }
    }

    async function abrirHistorico(cartao: Cartao) {
      try {
        setErro(null);

        const dados = await obterHistoricoCartao(
          cartao.id,
        );

        setHistorico(dados);
        setCartaoHistorico(cartao);
      } catch (error) {
        setErro(obterMensagemErro(error));
      }
    }

    return (
      <section className="space-y-5">
        <header>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-blue-700" />

            <h2 className="text-xl font-semibold text-gray-900">
              Cartões por veículo
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Consulte onde está cada cartão e mantenha
            o histórico de movimentações.
          </p>
        </header>

        {erro && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {erro}
          </div>
        )}

        {operacao && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-lg font-semibold text-gray-900">
              {operacao.tipo === "associar"
                ? "Associar cartão"
                : "Transferir cartão"}
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              {operacao.cartao.nome}
              {" — "}
              {operacao.cartao.identificador}
            </p>

            {operacao.associacaoAtual && (
              <p className="mt-1 text-sm text-gray-600">
                Veículo atual:{" "}
                <strong>
                  {
                    operacao.associacaoAtual
                      .veiculo.matricula
                  }
                </strong>
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="associacao-veiculo">
                  {operacao.tipo === "associar"
                    ? "Veículo"
                    : "Veículo de destino"}
                </Label>

                <select
                  id="associacao-veiculo"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={veiculoSelecionado}
                  onChange={(event) => {
                    setVeiculoSelecionado(
                      event.target.value,
                    );
                  }}
                >
                  <option value="">
                    Selecione
                  </option>

                  {veiculos
                    .filter(
                      (veiculo) => (
                        veiculo.id
                        !== operacao.associacaoAtual
                          ?.veiculo_id
                      ),
                    )
                    .map((veiculo) => (
                      <option
                        key={veiculo.id}
                        value={veiculo.id}
                      >
                        {veiculo.matricula}
                        {" — "}
                        {veiculo.descricao
                          || veiculo.tipo}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="associacao-observacoes">
                  Observações
                </Label>

                <Textarea
                  id="associacao-observacoes"
                  value={observacoes}
                  rows={2}
                  maxLength={2000}
                  placeholder="Motivo ou informação adicional"
                  onChange={(event) => {
                    setObservacoes(event.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={fecharOperacao}
                disabled={salvando}
              >
                Cancelar
              </Button>

              <Button
                className="btn-bg-blue-500 text-white"
                onClick={() => void executarOperacao()}
                disabled={
                  salvando
                  || !veiculoSelecionado
                }
              >
                {salvando
                  ? "A guardar..."
                  : (
                    operacao.tipo === "associar"
                      ? "Associar"
                      : "Transferir"
                  )}
              </Button>
            </div>
          </div>
        )}

        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
          />

          <Input
            value={pesquisa}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm"
            placeholder="Pesquisar cartão, matrícula ou condutor"
            onChange={(event) => {
              setPesquisa(event.target.value);
            }}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  Cartão
                </th>
                <th className="px-4 py-3">
                  Estado
                </th>
                <th className="px-4 py-3">
                  Veículo atual
                </th>
                <th className="px-4 py-3">
                  Condutor atual
                </th>
                <th className="px-4 py-3">
                  Associado em
                </th>
                <th className="px-4 py-3 text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
            {cartoesFiltrados.map((cartao) => {
              const associacao =
                associacaoPorCartao.get(cartao.id)
                ?? null;

              const associacaoCondutor = associacao
                ? condutorPorVeiculo.get(
                  associacao.veiculo_id,
                )
                : undefined;

              return (
                  <tr key={cartao.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {cartao.nome}
                      </div>

                      <div className="text-xs text-gray-500">
                        {cartao.identificador}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          cartao.estado === "ativo"
                            ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600"
                        }
                      >
                        {cartao.estado}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {associacao ? (
                        <>
                          <div className="font-semibold text-gray-900">
                            {
                              associacao
                                .veiculo.matricula
                            }
                          </div>

                          <div className="text-xs text-gray-500">
                            {
                              associacao
                                .veiculo.tipo
                            }
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">
                          Sem veículo
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {associacaoCondutor ? (
                        <>
                          <div className="font-semibold text-gray-900">
                            {associacaoCondutor.condutor.name}
                          </div>

                          <div className="text-xs text-gray-500">
                            {associacaoCondutor.condutor.empresa}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">
                          Sem condutor
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {associacao
                        ? formatarData(
                          associacao.associado_em,
                        )
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!associacao && (
                          <Button
                            variant="outline"
                            disabled={
                              cartao.estado !== "ativo"
                            }
                            onClick={() => {
                              abrirOperacao(
                                "associar",
                                cartao,
                                null,
                              );
                            }}
                          >
                            <Link className="mr-1 h-4 w-4" />
                            Associar
                          </Button>
                        )}

                        {associacao && (
                          <>
                            <Button
                              variant="outline"
                              disabled={
                                cartao.estado !== "ativo"
                              }
                              onClick={() => {
                                abrirOperacao(
                                  "transferir",
                                  cartao,
                                  associacao,
                                );
                              }}
                            >
                              <ArrowRightLeft className="mr-1 h-4 w-4" />
                              Transferir
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                void desassociar(
                                  cartao,
                                  associacao,
                                );
                              }}
                            >
                              <Unlink className="mr-1 h-4 w-4" />
                              Desassociar
                            </Button>
                          </>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => {
                            void abrirHistorico(cartao);
                          }}
                        >
                          <History className="mr-1 h-4 w-4" />
                          Histórico
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!carregando
                && cartoesFiltrados.length === 0
                && (
                    <tr>
                    <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                    >
                        Nenhum cartão encontrado.
                    </td>
                    </tr>
               )}
            </tbody>
          </table>

          {carregando && (
            <LoadingState
                message="A carregar associações..."
                compact
            />
          )}
        </div>

        {cartaoHistorico && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Histórico de {cartaoHistorico.nome}
                </h3>

                <p className="text-sm text-gray-500">
                  {cartaoHistorico.identificador}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setCartaoHistorico(null);
                  setHistorico([]);
                }}
              >
                Fechar
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">
                      Veículo
                    </th>
                    <th className="px-4 py-3">
                      Início
                    </th>
                    <th className="px-4 py-3">
                      Fim
                    </th>
                    <th className="px-4 py-3">
                      Associado por
                    </th>
                    <th className="px-4 py-3">
                      Desassociado por
                    </th>
                    <th className="px-4 py-3">
                      Observações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {historico.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold">
                        {item.veiculo.matricula}
                      </td>
                      <td className="px-4 py-3">
                        {formatarData(item.associado_em)}
                      </td>
                      <td className="px-4 py-3">
                        {item.ativa
                          ? "Atual"
                          : formatarData(
                            item.desassociado_em,
                          )}
                      </td>
                      <td className="px-4 py-3">
                        {item.associado_por.name}
                      </td>
                      <td className="px-4 py-3">
                        {item.desassociado_por?.name
                          ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.observacoes || "—"}
                      </td>
                    </tr>
                  ))}

                  {historico.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Este cartão ainda não possui
                        histórico.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    );
  }