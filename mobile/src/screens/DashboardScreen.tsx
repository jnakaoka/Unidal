import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function DashboardScreen() {
  const stats = {
    projetosAtivos: 12,
    horasMes: 340,
    operadoresAtivos: 5,
  };

  const dadosHorasPorProjeto = [
    { projeto: "Projeto A", horas: 120 },
    { projeto: "Projeto B", horas: 80 },
    { projeto: "Projeto C", horas: 60 },
    { projeto: "Projeto D", horas: 40 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 20 }}>
          Dashboard
        </Text>

        <View style={{ gap: 14, marginBottom: 20 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 18,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 14, color: "#6b7280" }}>Projetos Ativos</Text>
            <Text style={{ fontSize: 30, fontWeight: "700", color: "#2563eb", marginTop: 8 }}>
              {stats.projetosAtivos}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#ecfdf5",
              borderRadius: 16,
              padding: 18,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 14, color: "#047857" }}>Horas no Mês</Text>
            <Text style={{ fontSize: 30, fontWeight: "700", color: "#065f46", marginTop: 8 }}>
              {stats.horasMes}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#f5f3ff",
              borderRadius: 16,
              padding: 18,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 14, color: "#7c3aed" }}>Operadores Ativos</Text>
            <Text style={{ fontSize: 30, fontWeight: "700", color: "#5b21b6", marginTop: 8 }}>
              {stats.operadoresAtivos}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 18,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 }}>
            Horas por Projeto
          </Text>

          {dadosHorasPorProjeto.map((item) => (
            <View key={item.projeto} style={{ marginBottom: 14 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: "#374151" }}>{item.projeto}</Text>
                <Text style={{ color: "#374151", fontWeight: "600" }}>{item.horas}h</Text>
              </View>

              <View
                style={{
                  height: 10,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.min((item.horas / 120) * 100, 100)}%`,
                    height: 10,
                    backgroundColor: "#3b82f6",
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}