import React from "react";
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

type Modulo = {
  title: string;
  subtitle: string;
  path: string;
  icon: string;
  perfis: string[];
};

const modulos: Modulo[] = [
  { title: "Registo de trabalho", subtitle: "Apontamentos, equipa e produção", path: "/registro-horas", icon: "◷", perfis: ["admin", "operador", "motorista"] },
  { title: "Obras e produção", subtitle: "Relatório operacional", path: "/relatorios", icon: "▥", perfis: ["admin"] },
  { title: "Motoristas", subtitle: "Transportes e quilómetros", path: "/relatoriosmotorista", icon: "▣", perfis: ["admin"] },
  { title: "Dias trabalhados", subtitle: "Dias e Double Journeys", path: "/relatorios/dias-trabalhados", icon: "✓", perfis: ["admin"] },
  { title: "Utilizadores", subtitle: "Perfis e acessos", path: "/usuarios", icon: "♙", perfis: ["admin"] },
  { title: "Clientes", subtitle: "Cadastro de clientes", path: "/clientes", icon: "◎", perfis: ["admin"] },
  { title: "Obras", subtitle: "Cadastro e organização", path: "/obras", icon: "⌂", perfis: ["admin"] },
  { title: "Cartões", subtitle: "Cartões, veículos e condutores", path: "/controle-cartoes", icon: "▰", perfis: ["admin"] },
  { title: "Máquinas", subtitle: "Catálogo de equipamentos", path: "/maquinas", icon: "⚙", perfis: ["admin"] },
  { title: "Alterar palavra-passe", subtitle: "Segurança da conta", path: "/change-password", icon: "◆", perfis: ["admin", "operador", "motorista"] },
];

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const perfil = user?.perfil?.nome?.trim().toLocaleLowerCase("pt") || "";
  const modulosVisiveis = modulos.filter((modulo) => modulo.perfis.includes(perfil));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image source={require("../../assets/logo-unidal.png")} style={styles.logo} resizeMode="contain" />
          <View><Text style={styles.brandTitle}>Unidal</Text><Text style={styles.brandSubtitle}>Plataforma operacional</Text></View>
        </View>
        <TouchableOpacity onPress={() => void signOut()} style={styles.exitButton}><Text style={styles.exitText}>Sair</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.greeting}>Olá, {user?.name || "Utilizador"}</Text>
          <Text style={styles.profile}>{user?.perfil?.nome || "Sem perfil"} · {user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Funcionalidades</Text>
        <View style={styles.grid}>
          {modulosVisiveis.map((modulo) => (
            <TouchableOpacity
              key={modulo.path}
              activeOpacity={0.75}
              style={styles.moduleCard}
              onPress={() => navigation.navigate("WebModule", { title: modulo.title, path: modulo.path })}
            >
              <View style={styles.iconBox}><Text style={styles.icon}>{modulo.icon}</Text></View>
              <View style={styles.moduleText}><Text style={styles.moduleTitle}>{modulo.title}</Text><Text style={styles.moduleSubtitle}>{modulo.subtitle}</Text></View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 4 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 48, height: 48, backgroundColor: "#fff", borderRadius: 10 },
  brandTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  brandSubtitle: { color: "#fee2e2", fontSize: 12 },
  exitButton: { backgroundColor: "#fff", borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  exitText: { color: colors.primaryDark, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 36 },
  welcomeCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 22, borderLeftWidth: 5, borderLeftColor: colors.primary, elevation: 2 },
  greeting: { color: colors.text, fontSize: 22, fontWeight: "800" },
  profile: { color: colors.muted, fontSize: 13, marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  grid: { gap: 11 },
  moduleCard: { minHeight: 82, backgroundColor: colors.surface, borderRadius: 15, padding: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, elevation: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  icon: { color: colors.primaryDark, fontSize: 24, fontWeight: "700" },
  moduleText: { flex: 1, marginLeft: 13 },
  moduleTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  moduleSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 30, lineHeight: 30 },
});
