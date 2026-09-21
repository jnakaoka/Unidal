import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { WebView } from "react-native-webview";
import { useAuth } from "../contexts/AuthContext";

const WEB_BASE_URL = "https://apontamento.unidal.pt";
const ACCESS_KEY = "unidal_access_token";
const REFRESH_KEY = "unidal_refresh_token";

type Tokens = {
  access: string;
  refresh: string;
};

export default function WebModuleScreen({ route }: any) {
  const { user, signOut } = useAuth();
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [error, setError] = useState("");

  const path = route?.params?.path || "/";
  const title = route?.params?.title || "Unidal";

  useEffect(() => {
    let active = true;

    Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ])
      .then(([access, refresh]) => {
        if (!active) return;
        if (!access || !refresh) {
          signOut();
          return;
        }
        setTokens({ access, refresh });
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível preparar o acesso à plataforma.");
        }
      });

    return () => {
      active = false;
    };
  }, [signOut, user?.id]);

  const injectedJavaScript = useMemo(() => {
    if (!tokens || !user) return "";

    const perfil = user?.perfil?.nome?.trim().toLocaleLowerCase("pt") || "";
    const values: Record<string, string> = {
      access_token: tokens.access,
      refresh_token: tokens.refresh,
      userId: String(user.id),
      userName: user.name || "",
      userEmail: user.email || "",
      userPerfil: perfil,
    };

    return (
      Object.entries(values)
        .map(
          ([key, value]) =>
            `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`
        )
        .join("") + " true;"
    );
  }, [tokens, user]);

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!tokens) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e60000" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: `${WEB_BASE_URL}${path}` }}
      injectedJavaScript={injectedJavaScript}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e60000" />
          <Text style={styles.loadingText}>A carregar {title}...</Text>
        </View>
      )}
      onHttpError={({ nativeEvent }) => {
        if (nativeEvent.statusCode >= 500) {
          setError("A plataforma está temporariamente indisponível.");
        }
      }}
      onError={() => {
        setError("Sem ligação à plataforma. Verifique a internet e tente novamente.");
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f6f8",
  },
  loading: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6f8",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4b5563",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "#374151",
  },
});
