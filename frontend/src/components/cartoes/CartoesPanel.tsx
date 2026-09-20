import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import axios from "axios";
  import {
    CreditCard,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
  } from "lucide-react";

  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import { normalizarTextoBusca } from "@/utils/text";
  import {
    atualizarCartao,
    criarCartao,
    listarCartoes,
  } from "@/services/cartoes";
  import type {
    Cartao,
    EstadoCartao,
    TipoCartao,
  } from "@/types/cartao";
  import LoadingState from "@/components/LoadingState";
  import {
    formatarValidadeCartao,
    obterSituacaoValidadeCartao,
  } from "@/utils/validadeCartao";
  import type {
    FiltroContextualCartoes,
  } from "@/types/controleCartoes";

  interface CartaoForm {
    nome: string;
    identificador: string;
    tipo: TipoCartao;
    emissor: string;
    ultimos_quatro: string;
    validade_mes: string;
    validade_ano: string;
    estado: EstadoCartao;
    observacoes: string;
  }

  interface CartoesPanelProps {
    filtroContextual: FiltroContextualCartoes;
    onLimparFiltro: () => void;
  }

  const formularioInicial: CartaoForm = {
    nome: "",
    identificador: "",
    tipo: "combustivel",
    emissor: "",
    ultimos_quatro: "",
    validade_mes: "",
    validade_ano: "",
    estado: "ativo",
    observacoes: "",
  };

  const nomesTipos: Record<TipoCartao, string> = {
    bancario: "Bancário",
    combustivel: "Combustível",
    via_verde: "Via Verde",
    outro: "Outro",
  };

  const nomesEstados: Record<EstadoCartao, string> = {
    ativo: "Ativo",
    bloqueado: "Bloqueado",
    perdido: "Perdido",
    cancelado: "Cancelado",
    expirado: "Expirado",
  };

  const classesEstados: Record<EstadoCartao, string> = {
    ativo: "bg-green-100 text-green-700",
    bloqueado: "bg-yellow-100 text-yellow-700",
    perdido: "bg-red-100 text-red-700",
    cancelado: "bg-gray-200 text-gray-600",
    expirado: "bg-orange-100 text-orange-700",
  };

  function obterMensagemErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const detalhe = erro.response?.data?.detail;

      if (typeof detalhe === "string") {
        return detalhe;
      }

      if (Array.isArray(detalhe)) {
        const primeiraMensagem = detalhe[0]?.msg;

        if (typeof primeiraMensagem === "string") {
          return primeiraMensagem;
        }
      }
    }

    return "Não foi possível concluir a operação.";
  }

  function ValidadeCartao({
    cartao,
  }: {
    cartao: Cartao;
  }) {
    const situacao = obterSituacaoValidadeCartao(cartao);
    const validade = formatarValidadeCartao(cartao);

    if (situacao === "expirado") {
      return (
        <div>
          <div className="font-medium text-red-700">
            {validade}
          </div>

          <div className="text-xs text-red-600">
            Expirado
          </div>
        </div>
      );
    }

    if (situacao === "vence_em_breve") {
      return (
        <div>
          <div className="font-medium text-amber-700">
            {validade}
          </div>

          <div className="text-xs text-amber-600">
            Vence em breve
          </div>
        </div>
      );
    }

    if (situacao === "sem_validade") {
      return (
        <span className="text-gray-500">
          Sem validade
        </span>
      );
    }

    return (
      <span className="text-gray-600">
        {validade}
      </span>
    );
  }

  export default function CartoesPanel({
    filtroContextual,
    onLimparFiltro,
  }: CartoesPanelProps) {
    const [cartoes, setCartoes] = useState<Cartao[]>([]);
    const [pesquisa, setPesquisa] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState<
      EstadoCartao | ""
    >("");
    const [formulario, setFormulario] = useState(
      formularioInicial,
    );
    const [mostrarFormulario, setMostrarFormulario] =
      useState(false);
    const [cartaoEmEdicao, setCartaoEmEdicao] =
      useState<number | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    async function carregar() {
      try {
        setErro(null);
        setCarregando(true);

        const dados = await listarCartoes(
          undefined,
          estadoFiltro || undefined,
        );

        setCartoes(dados);
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setCarregando(false);
      }
    }

    useEffect(() => {
      void carregar();
    }, [estadoFiltro]);

    const cartoesFiltrados = useMemo(() => {
      const termo = normalizarTextoBusca(pesquisa);

      return cartoes.filter((cartao) => {
        if (filtroContextual === "atencao") {
          const situacaoValidade =
            obterSituacaoValidadeCartao(cartao);

          const exigeAtencao = (
            cartao.estado !== "ativo"
            || situacaoValidade === "expirado"
            || situacaoValidade === "vence_em_breve"
          );

          if (!exigeAtencao) {
            return false;
          }
        }

        if (!termo) {
          return true;
        }

        const texto = normalizarTextoBusca([
          cartao.nome,
          cartao.identificador,
          cartao.tipo,
          cartao.emissor ?? "",
          cartao.ultimos_quatro ?? "",
        ].join(" "));

        return texto.includes(termo);
      });
    }, [
      cartoes,
      filtroContextual,
      pesquisa,
    ]);

    function abrirNovo() {
      setFormulario(formularioInicial);
      setCartaoEmEdicao(null);
      setMostrarFormulario(true);
      setErro(null);
    }

    function abrirEdicao(cartao: Cartao) {
      setFormulario({
        nome: cartao.nome,
        identificador: cartao.identificador,
        tipo: cartao.tipo,
        emissor: cartao.emissor ?? "",
        ultimos_quatro: cartao.ultimos_quatro ?? "",
        validade_mes:
          cartao.validade_mes?.toString() ?? "",
        validade_ano:
          cartao.validade_ano?.toString() ?? "",
        estado: cartao.estado,
        observacoes: cartao.observacoes ?? "",
      });

      setCartaoEmEdicao(cartao.id);
      setMostrarFormulario(true);
      setErro(null);
    }

    function cancelar() {
      setFormulario(formularioInicial);
      setCartaoEmEdicao(null);
      setMostrarFormulario(false);
      setErro(null);
    }

    function validarFormulario(): string | null {
      if (!formulario.nome.trim()) {
        return "Informe o nome do cartão.";
      }

      if (!formulario.identificador.trim()) {
        return "Informe o identificador do cartão.";
      }

      if (
        formulario.ultimos_quatro
        && !/^\d{4}$/.test(formulario.ultimos_quatro)
      ) {
        return (
          "Os últimos quatro dígitos devem conter "
          + "exatamente quatro números."
        );
      }

      const temMes = Boolean(formulario.validade_mes);
      const temAno = Boolean(formulario.validade_ano);

      if (temMes !== temAno) {
        return (
          "Mês e ano da validade devem ser "
          + "informados em conjunto."
        );
      }

      if (temMes) {
        const mes = Number(formulario.validade_mes);

        if (mes < 1 || mes > 12) {
          return "O mês da validade deve estar entre 1 e 12.";
        }
      }

      if (temAno) {
        const ano = Number(formulario.validade_ano);

        if (ano < 2000 || ano > 2100) {
          return "O ano da validade deve estar entre 2000 e 2100.";
        }
      }

      return null;
    }

    async function salvar() {
      const erroValidacao = validarFormulario();

      if (erroValidacao) {
        setErro(erroValidacao);
        return;
      }

      try {
        setSalvando(true);
        setErro(null);

        const payload = {
          nome: formulario.nome,
          identificador: formulario.identificador,
          tipo: formulario.tipo,
          emissor: formulario.emissor.trim() || null,
          ultimos_quatro:
            formulario.ultimos_quatro.trim() || null,
          validade_mes: formulario.validade_mes
            ? Number(formulario.validade_mes)
            : null,
          validade_ano: formulario.validade_ano
            ? Number(formulario.validade_ano)
            : null,
          estado: formulario.estado,
          observacoes:
            formulario.observacoes.trim() || null,
        };

        if (cartaoEmEdicao !== null) {
          await atualizarCartao(
            cartaoEmEdicao,
            payload,
          );
        } else {
          await criarCartao(payload);
        }

        cancelar();
        await carregar();
      } catch (error) {
        setErro(obterMensagemErro(error));
      } finally {
        setSalvando(false);
      }
    }

    return (
      <section className="space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-700" />

              <h2 className="text-xl font-semibold text-gray-900">
                Cartões
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Cartões bancários, de combustível e
              Via Verde.
            </p>
          </div>

          <Button
            className="btn-bg-green-600 text-white"
            onClick={abrirNovo}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo cartão
          </Button>
        </header>

        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

          <p>
            Por segurança, guarde somente os últimos
            quatro dígitos. Nunca introduza o número
            completo, PIN ou CVV.
          </p>
        </div>

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
              {cartaoEmEdicao !== null
                ? "Editar cartão"
                : "Novo cartão"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cartao-nome">
                  Nome
                </Label>

                <Input
                  id="cartao-nome"
                  value={formulario.nome}
                  maxLength={100}
                  placeholder="Ex.: Cartão combustível 01"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      nome: event.target.value,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-identificador">
                  Identificador
                </Label>

                <Input
                  id="cartao-identificador"
                  value={formulario.identificador}
                  maxLength={50}
                  placeholder="Código interno ou referência"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      identificador: event.target.value,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-tipo">
                  Tipo
                </Label>

                <select
                  id="cartao-tipo"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={formulario.tipo}
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      tipo: event.target.value as TipoCartao,
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

              <div className="space-y-2">
                <Label htmlFor="cartao-emissor">
                  Emissor
                </Label>

                <Input
                  id="cartao-emissor"
                  value={formulario.emissor}
                  maxLength={100}
                  placeholder="Banco ou empresa emissora"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      emissor: event.target.value,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-final">
                  Últimos quatro dígitos
                </Label>

                <Input
                  id="cartao-final"
                  value={formulario.ultimos_quatro}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="1234"
                  onChange={(event) => {
                    const valor = event.target.value.replace(
                      /\D/g,
                      "",
                    );

                    setFormulario((anterior) => ({
                      ...anterior,
                      ultimos_quatro: valor,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-estado">
                  Estado
                </Label>

                <select
                  id="cartao-estado"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={formulario.estado}
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      estado: event.target.value as EstadoCartao,
                    }));
                  }}
                >
                  {Object.entries(nomesEstados).map(
                    ([valor, nome]) => (
                      <option key={valor} value={valor}>
                        {nome}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-validade-mes">
                  Mês da validade
                </Label>

                <Input
                  id="cartao-validade-mes"
                  type="number"
                  min={1}
                  max={12}
                  value={formulario.validade_mes}
                  placeholder="MM"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      validade_mes: event.target.value,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-validade-ano">
                  Ano da validade
                </Label>

                <Input
                  id="cartao-validade-ano"
                  type="number"
                  min={2000}
                  max={2100}
                  value={formulario.validade_ano}
                  placeholder="AAAA"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      validade_ano: event.target.value,
                    }));
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cartao-observacoes">
                  Observações
                </Label>

                <Textarea
                  id="cartao-observacoes"
                  value={formulario.observacoes}
                  rows={3}
                  placeholder="Informações adicionais"
                  onChange={(event) => {
                    setFormulario((anterior) => ({
                      ...anterior,
                      observacoes: event.target.value,
                    }));
                  }}
                />
              </div>
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

        {filtroContextual === "atencao" && (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Filtro do resumo: cartões que exigem atenção
              </p>

              <p className="text-xs text-amber-700">
                Mostra cartões inativos, expirados ou próximos
                da validade.
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
            />

            <Input
              value={pesquisa}
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm"
                placeholder="Pesquisar cartão"
                onChange={(event) => {
                  setPesquisa(event.target.value);
                }}
              />
          </div>

          <select
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            value={estadoFiltro}
            onChange={(event) => {
              setEstadoFiltro(
                event.target.value as EstadoCartao | "",
              );
            }}
          >
            <option value="">
              Todos os estados
            </option>

            {Object.entries(nomesEstados).map(
              ([valor, nome]) => (
                <option key={valor} value={valor}>
                  {nome}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Cartão</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Emissor</th>
                <th className="px-4 py-3">Final</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {cartoesFiltrados.map((cartao) => (
                <tr key={cartao.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      {cartao.nome}
                    </div>

                    <div className="text-xs text-gray-500">
                      {cartao.identificador}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {nomesTipos[cartao.tipo]}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {cartao.emissor || "—"}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {cartao.ultimos_quatro
                      ? `•••• ${cartao.ultimos_quatro}`
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    <ValidadeCartao cartao={cartao} />
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2 py-1 text-xs font-medium "
                        + classesEstados[cartao.estado]
                      }
                    >
                      {nomesEstados[cartao.estado]}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      onClick={() => abrirEdicao(cartao)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}

              {!carregando
                && cartoesFiltrados.length === 0
                && (
                  <tr>
                    <td
                      colSpan={7}
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
                message="A carregar cartões..."
                compact
            />
          )}
        </div>
      </section>
    );
  }