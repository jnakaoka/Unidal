import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import axios from "axios";
  import {
    ArrowRightLeft,
    History,
    Link2,
    Search,
    Unlink,
    UserRound,
  } from "lucide-react";

  import LoadingState from "@/components/LoadingState";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import {
    associarCondutor,
    desassociarCondutor,
    listarAssociacoesCondutores,
    listarCondutores,
    listarVeiculos,
    obterHistoricoCondutoresVeiculo,
    transferirCondutor,
  } from "@/services/cartoes";
  import type {
    Condutor,
    Veiculo,
    VeiculoCondutorAssociacao,
  } from "@/types/cartao";


  type TipoOperacao = "associar" | "transferir";


  interface OperacaoAssociar {
    tipo: "associar";
    veiculo: Veiculo;
  }


  interface OperacaoTransferir {
    tipo: "transferir";
    associacao: VeiculoCondutorAssociacao;
  }


  type Operacao =
    | OperacaoAssociar
    | OperacaoTransferir;


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


  export default function CondutoresPanel() {
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [condutores, setCondutores] = useState<Condutor[]>(
      [],
    );
    const [associacoes, setAssociacoes] = useState<
      VeiculoCondutorAssociacao[]
    >([]);
    const [pesquisa, setPesquisa] = useState("");
    const [operacao, setOperacao] =
      useState<Operacao | null>(null);
    const [condutorSelecionado, setCondutorSelecionado] =
      useState("");
    const [veiculoDestinoSelecionado, setVeiculoDestinoSelecionado] =
      useState("");
    const [observacoes, setObservacoes] = useState("");
    const [historico, setHistorico] = useState<
      VeiculoCondutorAssociacao[]
    >([]);
    const [veiculoHistorico, setVeiculoHistorico] =
      useState<Veiculo | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [carregandoHistorico, setCarregandoHistorico] =
      useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);


    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);

        const [
          dadosVeiculos,
          dadosCondutores,
          dadosAssociacoes,
        ] = await Promise.all([
          listarVeiculos(true),
          listarCondutores(),
          listarAssociacoesCondutores({
            ativa: true,
          }),
        ]);

        setVeiculos(dadosVeiculos);
        setCondutores(dadosCondutores);
        setAssociacoes(dadosAssociacoes);
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setCarregando(false);
      }
    }


    useEffect(() => {
      void carregar();
    }, []);


    const associacaoPorVeiculo = useMemo(() => {
      return new Map(
        associacoes.map((associacao) => [
          associacao.veiculo_id,
          associacao,
        ]),
      );
    }, [associacoes]);


    const condutoresOcupados = useMemo(() => {
      return new Set(
        associacoes.map(
          (associacao) => associacao.condutor_id,
        ),
      );
    }, [associacoes]);


    const veiculosOcupados = useMemo(() => {
      return new Set(
        associacoes.map(
          (associacao) => associacao.veiculo_id,
        ),
      );
    }, [associacoes]);


    const condutoresDisponiveis = useMemo(() => {
      return condutores.filter(
        (condutor) => !condutoresOcupados.has(condutor.id),
      );
    }, [condutores, condutoresOcupados]);


    const veiculosFiltrados = useMemo(() => {
      const termo = pesquisa.trim().toLocaleLowerCase();

      if (!termo) {
        return veiculos;
      }

      return veiculos.filter((veiculo) => {
        const associacao = associacaoPorVeiculo.get(
          veiculo.id,
        );

        const texto = [
          veiculo.matricula,
          veiculo.tipo,
          veiculo.descricao ?? "",
          associacao?.condutor.name ?? "",
          associacao?.condutor.email ?? "",
          associacao?.condutor.empresa ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase();

        return texto.includes(termo);
      });
    }, [
      associacaoPorVeiculo,
      pesquisa,
      veiculos,
    ]);


    function fecharOperacao() {
      setOperacao(null);
      setCondutorSelecionado("");
      setVeiculoDestinoSelecionado("");
      setObservacoes("");
    }


    function abrirAssociacao(veiculo: Veiculo) {
      setOperacao({
        tipo: "associar",
        veiculo,
      });
      setCondutorSelecionado(
        condutoresDisponiveis[0]?.id.toString() ?? "",
      );
      setVeiculoDestinoSelecionado("");
      setObservacoes("");
      setErro(null);
    }


    function abrirTransferencia(
      associacao: VeiculoCondutorAssociacao,
    ) {
      const primeiroDestino = veiculos.find(
        (veiculo) => (
          veiculo.id !== associacao.veiculo_id
          && !veiculosOcupados.has(veiculo.id)
        ),
      );

      setOperacao({
        tipo: "transferir",
        associacao,
      });
      setCondutorSelecionado("");
      setVeiculoDestinoSelecionado(
        primeiroDestino?.id.toString() ?? "",
      );
      setObservacoes("");
      setErro(null);
    }


    async function executarOperacao() {
      if (!operacao) {
        return;
      }

      try {
        setSalvando(true);
        setErro(null);

        if (operacao.tipo === "associar") {
          const condutorId = Number(condutorSelecionado);

          if (!condutorId) {
            setErro("Selecione um condutor.");
            return;
          }

          await associarCondutor({
            veiculo_id: operacao.veiculo.id,
            condutor_id: condutorId,
            observacoes: observacoes.trim() || null,
          });
        } else {
          const veiculoDestinoId = Number(
            veiculoDestinoSelecionado,
          );

          if (!veiculoDestinoId) {
            setErro("Selecione o veículo de destino.");
            return;
          }

          await transferirCondutor(
            operacao.associacao.condutor_id,
            {
              veiculo_destino_id: veiculoDestinoId,
              observacoes: observacoes.trim() || null,
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


    async function executarDesassociacao(
      associacao: VeiculoCondutorAssociacao,
    ) {
      if (
        !window.confirm(
          `Desassociar o condutor `
          + `"${associacao.condutor.name}" do veículo `
          + `"${associacao.veiculo.matricula}"?`,
        )
      ) {
        return;
      }

      try {
        setErro(null);

        await desassociarCondutor(
          associacao.veiculo_id,
        );

        await carregar();

        if (
          veiculoHistorico?.id
          === associacao.veiculo_id
        ) {
          await abrirHistorico(
            veiculoHistorico,
          );
        }
      } catch (error) {
        setErro(obterMensagemErro(error));
      }
    }


    async function abrirHistorico(veiculo: Veiculo) {
      try {
        setCarregandoHistorico(true);
        setErro(null);
        setVeiculoHistorico(veiculo);

        const dados =
          await obterHistoricoCondutoresVeiculo(
            veiculo.id,
          );

        setHistorico(dados);
      } catch (error) {
        setErro(obterMensagemErro(error));
        setHistorico([]);
      } finally {
        setCarregandoHistorico(false);
      }
    }


    if (carregando) {
      return (
        <LoadingState message="A carregar condutores e veículos..." />
      );
    }


    return (
      <section className="space-y-5">
        <header>
          <div className="flex items-center gap-2">
            <UserRound className="h-6 w-6 text-blue-700" />

            <h2 className="text-xl font-semibold text-gray-900">
              Condutores por veículo
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Consulte o condutor atual de cada veículo e
            mantenha o histórico das movimentações.
          </p>
        </header>


        {erro && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erro}
          </div>
        )}


        {operacao && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-lg font-semibold text-gray-900">
              {operacao.tipo === "associar"
                ? "Associar condutor"
                : "Transferir condutor"}
            </h3>

            {operacao.tipo === "associar" ? (
              <p className="mt-1 text-sm text-gray-600">
                Veículo:{" "}
                <strong>
                  {operacao.veiculo.matricula}
                </strong>
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-600">
                  Condutor:{" "}
                  <strong>
                    {operacao.associacao.condutor.name}
                  </strong>
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Veículo atual:{" "}
                  <strong>
                    {operacao.associacao.veiculo.matricula}
                  </strong>
                </p>
              </>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {operacao.tipo === "associar" ? (
                <div className="space-y-2">
                  <Label htmlFor="condutor-associacao">
                    Condutor
                  </Label>

                  <select
                    id="condutor-associacao"
                    value={condutorSelecionado}
                    onChange={(event) => {
                      setCondutorSelecionado(
                        event.target.value,
                      );
                    }}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">
                      Selecione
                    </option>

                    {condutoresDisponiveis.map(
                      (condutor) => (
                        <option
                          key={condutor.id}
                          value={condutor.id}
                        >
                          {condutor.name}
                          {" — "}
                          {condutor.empresa}
                        </option>
                      ),
                    )}
                  </select>

                  {condutoresDisponiveis.length === 0 && (
                    <p className="text-sm text-amber-700">
                      Não existem condutores disponíveis.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="condutor-veiculo-destino">
                    Veículo de destino
                  </Label>

                  <select
                    id="condutor-veiculo-destino"
                    value={veiculoDestinoSelecionado}
                    onChange={(event) => {
                      setVeiculoDestinoSelecionado(
                        event.target.value,
                      );
                    }}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">
                      Selecione
                    </option>

                    {veiculos
                      .filter(
                        (veiculo) => (
                          veiculo.id
                          !== operacao.associacao.veiculo_id
                          && !veiculosOcupados.has(
                            veiculo.id,
                          )
                        ),
                      )
                      .map((veiculo) => (
                        <option
                          key={veiculo.id}
                          value={veiculo.id}
                        >
                          {veiculo.matricula}
                          {" — "}
                          {veiculo.tipo}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="condutor-observacoes">
                  Observações
                </Label>

                <Textarea
                  id="condutor-observacoes"
                  value={observacoes}
                  onChange={(event) => {
                    setObservacoes(event.target.value);
                  }}
                  maxLength={2000}
                  placeholder="Motivo ou informação adicional"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={fecharOperacao}
                disabled={salvando}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                className="btn-bg-blue-500 text-white"
                onClick={() => {
                  void executarOperacao();
                }}
                disabled={salvando}
                aria-busy={salvando}
              >
                {salvando
                  ? "A guardar..."
                  : operacao.tipo === "associar"
                    ? "Associar"
                    : "Transferir"}
              </Button>
            </div>
          </div>
        )}


        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <Input
            value={pesquisa}
            onChange={(event) => {
              setPesquisa(event.target.value);
            }}
            placeholder="Pesquisar matrícula, veículo ou condutor"
            className="pl-9"
          />
        </div>


        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">
                    Veículo
                  </th>

                  <th className="px-4 py-3">
                    Tipo
                  </th>

                  <th className="px-4 py-3">
                    Condutor atual
                  </th>

                  <th className="px-4 py-3">
                    Empresa
                  </th>

                  <th className="px-4 py-3">
                    Associado em
                  </th>

                  <th className="px-4 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {veiculosFiltrados.map((veiculo) => {
                  const associacao =
                    associacaoPorVeiculo.get(veiculo.id);

                  return (
                    <tr
                      key={veiculo.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {veiculo.matricula}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {veiculo.tipo}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {associacao?.condutor.name ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {associacao?.condutor.empresa ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {formatarData(
                          associacao?.associado_em ?? null,
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {associacao ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 text-sm"
                                onClick={() => {
                                  abrirTransferencia(
                                    associacao,
                                  );
                                }}
                              >
                                <ArrowRightLeft className="mr-1 h-4 w-4" />
                                Transferir
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 text-sm"
                                onClick={() => {
                                  void executarDesassociacao(
                                    associacao,
                                  );
                                }}
                              >
                                <Unlink className="mr-1 h-4 w-4" />
                                Desassociar
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 px-3 text-sm"
                              onClick={() => {
                                abrirAssociacao(veiculo);
                              }}
                            >
                              <Link2 className="mr-1 h-4 w-4" />
                              Associar
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 px-3 text-sm"
                            onClick={() => {
                              void abrirHistorico(veiculo);
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

                {veiculosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum veículo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        {veiculoHistorico && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Histórico de{" "}
                  {veiculoHistorico.matricula}
                </h3>

                <p className="text-sm text-gray-500">
                  Condutores associados ao veículo.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVeiculoHistorico(null);
                  setHistorico([]);
                }}
              >
                Fechar
              </Button>
            </div>

            {carregandoHistorico ? (
              <LoadingState
                compact
                message="A carregar histórico..."
              />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">
                        Condutor
                      </th>

                      <th className="px-3 py-2">
                        Início
                      </th>

                      <th className="px-3 py-2">
                        Fim
                      </th>

                      <th className="px-3 py-2">
                        Associado por
                      </th>

                      <th className="px-3 py-2">
                        Desassociado por
                      </th>

                      <th className="px-3 py-2">
                        Observações
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {historico.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          {item.condutor.name}
                        </td>

                        <td className="px-3 py-2">
                          {formatarData(item.associado_em)}
                        </td>

                        <td className="px-3 py-2">
                          {item.ativa
                            ? "Atual"
                            : formatarData(
                                item.desassociado_em,
                              )}
                        </td>

                        <td className="px-3 py-2">
                          {item.associado_por.name}
                        </td>

                        <td className="px-3 py-2">
                          {item.desassociado_por?.name ?? "—"}
                        </td>

                        <td className="px-3 py-2">
                          {item.observacoes ?? "—"}
                        </td>
                      </tr>
                    ))}

                    {historico.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-6 text-center text-gray-500"
                        >
                          Nenhuma associação registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }