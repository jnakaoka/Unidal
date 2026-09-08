import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { WebView } from "react-native-webview";

import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme";

const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL || "https://apontamento.unidal.pt";
const ACCESS_KEY = "unidal_access_token";
const REFRESH_KEY = "unidal_refresh_token";

export default function WebModuleScreen({ route }: any) {
  const { user, signOut } = useAuth();
  const [tokens, setTokens] = useState<{ access: string; refresh: string } | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]).then(([access, refresh]) => {
      if (!access || !refresh) {
        void signOut();
        return;
      }
      setTokens({ access, refresh });
    }).catch(() => setErro("Não foi possível abrir o módulo."));
    // A sessão é recarregada ao trocar de utilizador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const perfil = user?.perfil?.nome?.trim().toLocaleLowerCase("pt") || "";
  const scriptSessao = useMemo(() => {
    if (!tokens || !user) return "";
    const valores: Record<string, string> = {
      access_token: tokens.access,
      refresh_token: tokens.refresh,
      userId: String(user.id),
      userName: user.name || "",
      userEmail: user.email || "",
      userPerfil: perfil,
    };
    return `${Object.entries(valores)
      .map(([chave, valor]) => `localStorage.setItem(${JSON.stringify(chave)}, ${JSON.stringify(valor)});`)
      .join("")} true;`;
  }, [perfil, tokens, user]);

  if (erro) {
    return <SafeAreaView style={styles.center}><Text style={styles.error}>{erro}</Text></SafeAreaView>;
  }
  if (!tokens) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: `${WEB_BASE_URL}${route.params.path}` }}
        injectedJavaScriptBeforeContentLoaded={scriptSessao}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        pullToRefreshEnabled
        startInLoadingState
        renderLoading={() => <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>A carregar {route.params.title}...</Text></View>}
        onHttpError={({ nativeEvent }) => nativeEvent.statusCode >= 500 && setErro("A plataforma está temporariamente indisponível.")}
        onError={() => setErro("Sem ligação à plataforma Unidal.")}
        onNavigationStateChange={(estado) => {
          if (/\/login(?:\?|$)/.test(estado.url)) {
            Alert.alert("Sessão terminada", "Entre novamente para continuar.");
            void signOut();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.muted },
  error: { color: colors.danger, fontSize: 16, textAlign: "center" },
});
