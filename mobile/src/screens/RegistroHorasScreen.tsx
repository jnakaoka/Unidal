import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function RegistroHorasScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827" }}>
            Registo de Trabalho
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#16a34a",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 18,
            elevation: 2,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
            Estrutura mobile em preparação
          </Text>
          <Text style={{ color: "#4b5563", lineHeight: 22 }}>
            Esta tela será adaptada da versão web para mobile com cards, filtros e formulário por
            secções.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 18,
                elevation: 2,
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 16, color: "#111827", marginBottom: 6 }}>
                Cliente Exemplo {item}
              </Text>
              <Text style={{ color: "#6b7280", marginBottom: 4 }}>Obra: Obra {item}</Text>
              <Text style={{ color: "#6b7280", marginBottom: 4 }}>Data: 2026-04-16</Text>
              <Text style={{ color: "#6b7280" }}>Equipa: user1, user2</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}