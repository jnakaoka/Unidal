import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import axios from "axios";
  import {
    Car,
    Pencil,
    Plus,
    Search,
  } from "lucide-react";

  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { normalizarTextoBusca } from "@/utils/text";
  import {
    atualizarVeiculo,
    criarVeiculo,
    listarAssociacoes,
    listarVeiculos,
  } from "@/services/cartoes";
  import type {
    CartaoVeiculoAssociacao,
    TipoVeiculo,
    Veiculo,
  } from "@/types/cartao";
  import LoadingState from "@/components/LoadingState";

  import type {
    FiltroContextualCartoes,
  } from "@/types/controleCartoes";

  interface VeiculoForm {
    matricula: string;
    tipo: TipoVeiculo;
    descricao: string;
    ativo: boolean;
  }

  interface VeiculosPanelProps {
    filtroContextual: FiltroContextualCartoes;
    onLimparFiltro: () => void;
  }

  const formularioInicial: VeiculoForm = {
    matricula: "",
    tipo: "carrinha",
    descricao: "",
    ativo: true,
  };


  const nomesTipos: Record<TipoVeiculo, string> = {
    carrinha: "Carrinha",
    camiao: "Camião",
    automovel: "Automóvel",
    outro: "Outro",
  };


  function obterMensagemErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const detalhe = erro.response?.data?.detail;

      if (typeof detalhe === "string") {
        return detalhe;
      }
    }

    return "Não foi possível concluir a operação.";
  }


  export default function VeiculosPanel({
    filtroContextual,
    onLimparFiltro,
  }: VeiculosPanelProps) {
    const [veiculos, setVeiculos] = useState<Veiculo[]>(
      [],
    );
    const [
      associacoesCartoes,
      setAssociacoesCartoes,
    ] = useState<CartaoVeiculoAssociacao[]>([]);
    const [pesquisa, setPesquisa] = useState("");
    const [formulario, setFormulario] = useState(
      formularioInicial,
    );
    const [mostrarFormulario, setMostrarFormulario] =
      useState(false);
    const [veiculoEmEdicao, setVeiculoEmEdicao] =
      useState<number | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);


    async function carregar() {
      try {
        setErro(null);
        setCarregando(true);

        const [
          dadosVeiculos,
          dadosAssociacoesCartoes,
        ] = await Promise.all([
          listarVeiculos(),
          listarAssociacoes({
            ativa: true,
          }),
        ]);

        setVeiculos(dadosVeiculos);
        setAssociacoesCartoes(
          dadosAssociacoesCartoes,
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


    const veiculosComCartao = useMemo(() => {
      return new Set(
        associacoesCartoes.map(
          (associacao) => associacao.veiculo_id,
        ),
      );
    }, [associacoesCartoes]);

    const veiculosFiltrados = useMemo(() => {
      const termo = normalizarTextoBusca(pesquisa);

      return veiculos.filter((veiculo) => {
        if (
          filtroContextual === "sem_cartao"
          && (
            !veiculo.ativo
            || veiculosComCartao.has(veiculo.id)
          )
        ) {
          return false;
        }

        if (!termo) {
          return true;
        }

        const texto = normalizarTextoBusca([
          veiculo.matricula,
          veiculo.tipo,
          veiculo.descricao ?? "",
        ].join(" "));

        return texto.includes(termo);
      });
    }, [
      filtroContextual,
      pesquisa,
      veiculos,
      veiculosComCartao,
    ]);


    function abrirNovo() {
      setFormulario(formularioInicial);
      setVeiculoEmEdicao(null);
      setMostrarFormulario(true);
      setErro(null);
    }


    function abrirEdicao(veiculo: Veiculo) {
      setFormulario({
        matricula: veiculo.matricula,
        tipo: veiculo.tipo,
        descricao: veiculo.descricao ?? "",
        ativo: veiculo.ativo,
      });

      setVeiculoEmEdicao(veiculo.id);
      setMostrarFormulario(true);
      setErro(null);
    }


    function cancelar() {
      setFormulario(formularioInicial);
      setVeiculoEmEdicao(null);
      setMostrarFormulario(false);
      setErro(null);
    }


    async function salvar() {
      if (!formulario.matricula.trim()) {
        setErro("Informe a matrícula do veículo.");
        return;
      }

      try {
        setSalvando(true);
        setErro(null);

        const dadosComuns = {
          matricula: formulario.matricula,
          tipo: formulario.tipo,
          descricao:
            formulario.descricao.trim() || null,
        };

        if (veiculoEmEdicao !== null) {
          await atualizarVeiculo(
            veiculoEmEdicao,
            {
              ...dadosComuns,
              ativo: formulario.ativo,
            },
          );
        } else {
          await criarVeiculo(dadosComuns);
        }

        cancelar();
        await carregar();
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setSalvando(false);
      }
    }


    async function alternarEstado(veiculo: Veiculo) {
      const acao = veiculo.ativo
        ? "inativar"
        : "reativar";

      if (
        !window.confirm(
          `Deseja ${acao} o veículo `
          + `${veiculo.matricula}?`,
        )
      ) {
        return;
      }

      try {
        setErro(null);

        await atualizarVeiculo(
          veiculo.id,
          {
            ativo: !veiculo.ativo,
          },
        );

        await carregar();
      } catch (error) {
        setErro(obterMensagemErro(error));
      }
    }


    return (
      <section className="space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-blue-700" />

              <h2 className="text-xl font-semibold text-gray-900">
                Veículos
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Carrinhas e outros veículos que podem
              receber cartões.
            </p>
          </div>

          <Button
            className="btn-bg-green-600 text-white"
            onClick={abrirNovo}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo veículo
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


        {mostrarFormulario && (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {veiculoEmEdicao !== null
                ? "Editar veículo"
                : "Novo veículo"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="veiculo-matricula">
                  Matrícula
                </Label>

                <Input
                  id="veiculo-matricula"
                  value={formulario.matricula}
                  maxLength={20}
                  placeholder="Ex.: AA-00-BB"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      matricula: event.target.value,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo-tipo">
                  Tipo
                </Label>

                <select
                  id="veiculo-tipo"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={formulario.tipo}
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      tipo: event.target.value as TipoVeiculo,
                    }));
                  }}
                >
                  {Object.entries(nomesTipos).map(
                    ([valor, nome]) => (
                      <option key={valor} value={valor}>
                        {nome}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="veiculo-descricao">
                  Descrição
                </Label>

                <Input
                  id="veiculo-descricao"
                  value={formulario.descricao}
                  maxLength={255}
                  placeholder="Descrição opcional"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      descricao: event.target.value,
                    }));
                  }}
                />
              </div>

              {veiculoEmEdicao !== null && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(event) => {
                      setFormulario((anterior) => ({
                        ...anterior,
                        ativo: event.target.checked,
                      }));
                    }}
                  />

                  Veículo ativo
                </label>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={cancelar}
                disabled={salvando}
              >
                Cancelar
              </Button>

              <Button
                className="btn-bg-blue-500 text-white"
                onClick={() => void salvar()}
                disabled={salvando}
              >
                {salvando
                  ? "A guardar..."
                  : "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {filtroContextual === "sem_cartao" && (
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Filtro do resumo: veículos sem cartão
              </p>

              <p className="text-xs text-gray-600">
                Mostra somente veículos ativos sem qualquer
                associação ativa com cartões.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onLimparFiltro}
            >
              Limpar filtro
            </Button>
          </div>
        )}

        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
          />

          <Input
            value={pesquisa}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm"
            placeholder="Pesquisar matrícula, tipo ou descrição"
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
                  Matrícula
                </th>
                <th className="px-4 py-3">
                  Tipo
                </th>
                <th className="px-4 py-3">
                  Descrição
                </th>
                <th className="px-4 py-3">
                  Estado
                </th>
                <th className="px-4 py-3 text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {veiculosFiltrados.map((veiculo) => (
                <tr key={veiculo.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {veiculo.matricula}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {nomesTipos[veiculo.tipo]}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {veiculo.descricao || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        veiculo.ativo
                          ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600"
                      }
                    >
                      {veiculo.ativo
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => abrirEdicao(veiculo)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          void alternarEstado(veiculo);
                        }}
                      >
                        {veiculo.ativo
                          ? "Inativar"
                          : "Reativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando
                && veiculosFiltrados.length === 0
                && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum veículo encontrado.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>

          {carregando && (
            <LoadingState
                message="A carregar veículos..."
                compact
            />
           )}
        </div>
      </section>
    );
  }