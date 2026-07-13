import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import {
  clientesApi,
  obrasApi,
  registrosHorasApi,
} from "../services/api";

type Cliente = {
  id: number;
  nome: string;
  is_active?: boolean;
};

type Obra = {
  id: number;
  nome: string;
  descricao?: string | null;
  cliente_id: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  empresa?: string;
};

type RegistroEquipa = {
  user: User;
  intemperie?: boolean;
};

type RegistroHora = {
  id: number;
  usuario_id: number;
  projeto_id?: number;

  data: string;
  horas: number | string;

  cliente_id?: number | null;
  obra_id?: number | null;

  cliente?: Cliente | null;
  obra?: Obra | null;

  metros_quadrados?: string | number | null;

  preparacao?: boolean;
  bruto?: boolean;
  colagem?: boolean;
  acabamento?: boolean;
  serragem?: boolean;
  coli?: boolean;
  intervencao_maquinas?: boolean;

  equipa?: RegistroEquipa[];
};

type ServicosState = {
  preparacao: boolean;
  bruto: boolean;
  colagem: boolean;
  acabamento: boolean;
  serragem: boolean;
  coli: boolean;
};

const servicosIniciais: ServicosState = {
  preparacao: false,
  bruto: false,
  colagem: false,
  acabamento: false,
  serragem: false,
  coli: false,
};

export default function RegistroHorasScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [registros, setRegistros] = useState<RegistroHora[]>([]);

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [obraId, setObraId] = useState<number | null>(null);

  const [data, setData] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [horas, setHoras] = useState("");
  const [metrosQuadrados, setMetrosQuadrados] = useState("");
  const [servicos, setServicos] =
    useState<ServicosState>(servicosIniciais);

  const obrasDisponiveis = useMemo(() => {
    if (!clienteId) {
      return [];
    }

    return obras.filter((obra) => obra.cliente_id === clienteId);
  }, [obras, clienteId]);

  async function carregarDados() {
    try {
      setLoading(true);

      const [clientesData, registrosData] = await Promise.all([
        clientesApi.listar(),
        registrosHorasApi.listar(),
      ]);

      setClientes(
        Array.isArray(clientesData)
          ? clientesData.filter((cliente) => cliente.is_active !== false)
          : []
      );

      setRegistros(
        Array.isArray(registrosData) ? registrosData : []
      );
    } catch (error) {
      console.error("Erro ao carregar dados:", error);

      Alert.alert(
        "Erro",
        "Não foi possível carregar clientes e apontamentos."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function carregarObras(clienteSelecionadoId: number) {
    try {
      setObraId(null);

      const obrasData = await obrasApi.listarPorCliente(
        clienteSelecionadoId
      );

      setObras(Array.isArray(obrasData) ? obrasData : []);
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
      setObras([]);

      Alert.alert(
        "Erro",
        "Não foi possível carregar as obras deste cliente."
      );
    }
  }

  function alterarServico(
    campo: keyof ServicosState,
    valor: boolean
  ) {
    setServicos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setClienteId(null);
    setObraId(null);
    setObras([]);
    setHoras("");
    setMetrosQuadrados("");
    setServicos(servicosIniciais);
  }

  async function salvarRegistro() {
    if (!data || !clienteId || !obraId) {
      Alert.alert(
        "Atenção",
        "Preencha a data, o cliente e a obra."
      );
      return;
    }

    const horasConvertidas = Number(
      horas.replace(",", ".")
    );

    if (!horas || Number.isNaN(horasConvertidas)) {
      Alert.alert(
        "Atenção",
        "Informe uma quantidade válida de horas."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        projeto_id: 1,
        data,
        horas: horasConvertidas,

        cliente_id: clienteId,
        obra_id: obraId,

        metros_quadrados: metrosQuadrados || "",

        preparacao: servicos.preparacao,
        bruto: servicos.bruto,
        colagem: servicos.colagem,
        acabamento: servicos.acabamento,
        serragem: servicos.serragem,
        coli: servicos.coli,

        intervencao_maquinas: false,
        intervencao_maquinas_opcoes: null,

        origem: null,
        destino: null,
        matricula: null,
        km_rodados: null,
        maquinas_transportadas: null,

        equipa: [],
      };

      await registrosHorasApi.criar(payload);

      limparFormulario();
      await carregarDados();

      Alert.alert(
        "Sucesso",
        "Registo de trabalho criado com sucesso."
      );
    } catch (error: any) {
      console.error(
        "Erro ao salvar:",
        error?.response?.data ?? error
      );

      const detalhe = error?.response?.data?.detail;

      Alert.alert(
        "Erro",
        typeof detalhe === "string"
          ? detalhe
          : "Não foi possível salvar o registo."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Carregando apontamentos...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregarDados();
            }}
          />
        }
      >
        <Text style={styles.title}>
          Registo de Trabalho
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Novo apontamento
          </Text>

          <Text style={styles.label}>Data</Text>

          <TextInput
            value={data}
            onChangeText={setData}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <Text style={styles.label}>Cliente</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={clienteId}
              onValueChange={(value) => {
                const novoClienteId =
                  value === null ? null : Number(value);

                setClienteId(novoClienteId);
                setObraId(null);

                if (novoClienteId) {
                  carregarObras(novoClienteId);
                } else {
                  setObras([]);
                }
              }}
            >
              <Picker.Item
                label="Selecione um cliente"
                value={null}
              />

              {clientes.map((cliente) => (
                <Picker.Item
                  key={cliente.id}
                  label={cliente.nome}
                  value={cliente.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Obra</Text>

          <View style={styles.pickerContainer}>
            <Picker
              enabled={Boolean(clienteId)}
              selectedValue={obraId}
              onValueChange={(value) => {
                setObraId(
                  value === null ? null : Number(value)
                );
              }}
            >
              <Picker.Item
                label={
                  clienteId
                    ? "Selecione uma obra"
                    : "Selecione primeiro o cliente"
                }
                value={null}
              />

              {obrasDisponiveis.map((obra) => (
                <Picker.Item
                  key={obra.id}
                  label={obra.nome}
                  value={obra.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Horas</Text>

          <TextInput
            value={horas}
            onChangeText={setHoras}
            keyboardType="decimal-pad"
            placeholder="Ex.: 8"
            style={styles.input}
          />

          <Text style={styles.label}>
            Metros quadrados
          </Text>

          <TextInput
            value={metrosQuadrados}
            onChangeText={setMetrosQuadrados}
            keyboardType="decimal-pad"
            placeholder="Ex.: 250"
            style={styles.input}
          />

          <Text style={styles.sectionSubtitle}>
            Descrição do serviço
          </Text>

          <ServicoSwitch
            label="Preparação"
            value={servicos.preparacao}
            onValueChange={(value) =>
              alterarServico("preparacao", value)
            }
          />

          <ServicoSwitch
            label="Bruto"
            value={servicos.bruto}
            onValueChange={(value) =>
              alterarServico("bruto", value)
            }
          />

          <ServicoSwitch
            label="Colagem"
            value={servicos.colagem}
            onValueChange={(value) =>
              alterarServico("colagem", value)
            }
          />

          <ServicoSwitch
            label="Acabamento"
            value={servicos.acabamento}
            onValueChange={(value) =>
              alterarServico("acabamento", value)
            }
          />

          <ServicoSwitch
            label="Serragem"
            value={servicos.serragem}
            onValueChange={(value) =>
              alterarServico("serragem", value)
            }
          />

          <ServicoSwitch
            label="Coli"
            value={servicos.coli}
            onValueChange={(value) =>
              alterarServico("coli", value)
            }
          />

          <TouchableOpacity
            onPress={salvarRegistro}
            disabled={saving}
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Salvar apontamento
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Últimos apontamentos
        </Text>

        {registros.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhum apontamento encontrado.
            </Text>
          </View>
        ) : (
          registros.map((registro) => (
            <View
              key={registro.id}
              style={styles.recordCard}
            >
              <Text style={styles.recordTitle}>
                {registro.cliente?.nome ??
                  `Cliente ${registro.cliente_id ?? ""}`}
              </Text>

              <Text style={styles.recordSubtitle}>
                {registro.obra?.nome ??
                  `Obra ${registro.obra_id ?? ""}`}
              </Text>

              <Text style={styles.recordText}>
                Data: {registro.data}
              </Text>

              <Text style={styles.recordText}>
                Horas: {registro.horas}
              </Text>

              <Text style={styles.recordText}>
                Metros quadrados:{" "}
                {registro.metros_quadrados || "0"}
              </Text>

              <Text style={styles.recordServices}>
                {formatarServicos(registro)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ServicoSwitchProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ServicoSwitch({
  label,
  value,
  onValueChange,
}: ServicoSwitchProps) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>

      <Switch
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

function formatarServicos(registro: RegistroHora) {
  const servicos: string[] = [];

  if (registro.preparacao) servicos.push("Preparação");
  if (registro.bruto) servicos.push("Bruto");
  if (registro.colagem) servicos.push("Colagem");
  if (registro.acabamento) servicos.push("Acabamento");
  if (registro.serragem) servicos.push("Serragem");
  if (registro.coli) servicos.push("Coli");

  return servicos.length > 0
    ? servicos.join(", ")
    : "Sem descrição de serviço";
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  loadingText: {
    marginTop: 12,
    color: "#6b7280",
  },

  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 20,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 12,
  },

  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#111827",
    marginTop: 8,
    marginBottom: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 12,
    overflow: "hidden" as const,
    backgroundColor: "#fff",
  },

  switchRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  switchLabel: {
    fontSize: 15,
    color: "#374151",
  },

  saveButton: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center" as const,
    marginTop: 18,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "700" as const,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
  },

  emptyText: {
    color: "#6b7280",
    textAlign: "center" as const,
  },

  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  recordTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#111827",
  },

  recordSubtitle: {
    fontSize: 15,
    color: "#374151",
    marginTop: 2,
    marginBottom: 8,
  },

  recordText: {
    color: "#6b7280",
    marginBottom: 3,
  },

  recordServices: {
    color: "#374151",
    marginTop: 8,
    fontWeight: "600" as const,
  },
};