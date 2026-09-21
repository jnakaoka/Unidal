import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

type ModuleItem = {
  title: string;
  subtitle: string;
  path: string;
  icon: string;
  perfis: string[];
};

const MODULES: ModuleItem[] = [
  {
    title: "Registo de trabalho",
    subtitle: "Apontamentos, equipa e produção",
    path: "/registro-horas",
    icon: "◷",
    perfis: ["admin", "operador", "motorista"],
  },
  {
    title: "Obras e produção",
    subtitle: "Relatório operacional",
    path: "/relatorios",
    icon: "▥",
    perfis: ["admin"],
  },
  {
    title: "Motoristas",
    subtitle: "Transportes e quilómetros",
    path: "/relatoriosmotorista",
    icon: "▣",
    perfis: ["admin"],
  },
  {
    title: "Dias trabalhados",
    subtitle: "Dias e Double Journeys",
    path: "/relatorios/dias-trabalhados",
    icon: "✓",
    perfis: ["admin"],
  },
  {
    title: "Utilizadores",
    subtitle: "Perfis e acessos",
    path: "/usuarios",
    icon: "♙",
    perfis: ["admin"],
  },
  {
    title: "Clientes",
    subtitle: "Cadastro de clientes",
    path: "/clientes",
    icon: "⊙",
    perfis: ["admin"],
  },
  {
    title: "Obras",
    subtitle: "Cadastro e organização",
    path: "/obras",
    icon: "⌂",
    perfis: ["admin"],
  },
  {
    title: "Cartões",
    subtitle: "Cartões, veículos e condutores",
    path: "/users/controle-cartoes",
    icon: "▬",
    perfis: ["admin"],
  },
  {
    title: "Máquinas",
    subtitle: "Catálogo de equipamentos",
    path: "/maquinas",
    icon: "⚙",
    perfis: ["admin"],
  },
  {
    title: "Alterar palavra-passe",
    subtitle: "Segurança da conta",
    path: "/change-password",
    icon: "◆",
    perfis: ["admin", "operador", "motorista"],
  },
];

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();

  const perfil = user?.perfil?.nome?.trim().toLocaleLowerCase("pt") || "";
  const visibleModules = MODULES.filter((item) => item.perfis.includes(perfil));
  const isAdmin = perfil === "admin";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#ed0000" />

      <View style={styles.header}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>Unidal</Text>
          <Text style={styles.brandSubtitle}>Plataforma operacional</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeAccent} />
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Olá, {user?.name || "Utilizador"}</Text>
            <Text style={styles.welcomeMeta}>
              {user?.perfil?.nome || "Sem perfil"} · {user?.email || ""}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Funcionalidades</Text>

        {visibleModules.map((item) => (
          <TouchableOpacity
            key={item.path}
            activeOpacity={0.75}
            style={styles.moduleCard}
            onPress={() =>
              navigation.navigate("WebModule", {
                title: item.title,
                path: item.path,
              })
            }
          >
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <View style={styles.moduleText}>
              <Text style={styles.moduleTitle}>{item.title}</Text>
              <Text style={styles.moduleSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {isAdmin && (
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.moduleCard}
            onPress={() => navigation.navigate("FaceEnrollment")}
          >
            <View style={styles.faceIconBox}>
              <Text style={styles.iconText}>◎</Text>
            </View>
            <View style={styles.moduleText}>
              <Text style={styles.moduleTitle}>Cadastro facial</Text>
              <Text style={styles.moduleSubtitle}>Biometria dos colaboradores</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ed0000",
  },
  header: {
    minHeight: 112,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#ed0000",
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    resizeMode: "contain",
  },
  brand: {
    flex: 1,
    marginLeft: 14,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  brandSubtitle: {
    color: "#ffffff",
    fontSize: 17,
    marginTop: 3,
  },
  logoutButton: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginLeft: 10,
  },
  logoutText: {
    color: "#a70000",
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#f4f5f7",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  welcomeCard: {
    minHeight: 118,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 24,
    elevation: 3,
  },
  welcomeAccent: {
    width: 8,
    backgroundColor: "#ed0000",
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  welcomeTitle: {
    color: "#1f2937",
    fontSize: 28,
    fontWeight: "800",
  },
  welcomeMeta: {
    color: "#6b7280",
    fontSize: 17,
    marginTop: 10,
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 14,
  },
  moduleCard: {
    minHeight: 108,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: "#ffe0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  faceIconBox: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: "#ffe0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#bd1e24",
    fontSize: 31,
    fontWeight: "700",
  },
  moduleText: {
    flex: 1,
    marginLeft: 16,
  },
  moduleTitle: {
    color: "#1f2937",
    fontSize: 22,
    fontWeight: "800",
  },
  moduleSubtitle: {
    color: "#7a8089",
    fontSize: 16,
    marginTop: 5,
  },
  chevron: {
    color: "#737b84",
    fontSize: 42,
    lineHeight: 44,
    marginLeft: 8,
  },
});
