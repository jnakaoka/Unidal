import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Erro no login", e?.message || "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center", padding: 24 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text style={{ fontSize: 40, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
            Unidal
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#374151" }}>
            Login
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 16,
            elevation: 3,
            gap: 16,
          }}
        >
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
              Email
            </Text>
            <TextInput
              placeholder="Digite seu email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                padding: 12,
                backgroundColor: "#fff",
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
              Senha
            </Text>
            <TextInput
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                padding: 12,
                backgroundColor: "#fff",
              }}
            />
          </View>

          <TouchableOpacity
            onPress={onLogin}
            disabled={loading}
            style={{
              backgroundColor: "#2563eb",
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// import React, { useState } from "react";
// import { Alert, Button, SafeAreaView, Text, TextInput, View } from "react-native";
// import { useAuth } from "../contexts/AuthContext";

// export default function LoginScreen() {
//   const { signIn } = useAuth();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function onLogin() {
//     setLoading(true);
//     try {
//       await signIn(email.trim(), password);
//     } catch (e: any) {
//       Alert.alert("Erro no login", e?.message || "Falha ao autenticar");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: "center" }}>
//       <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 16 }}>Unidal</Text>

//       <View style={{ gap: 12 }}>
//         <TextInput
//           placeholder="Email"
//           value={email}
//           onChangeText={setEmail}
//           autoCapitalize="none"
//           keyboardType="email-address"
//           style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
//         />
//         <TextInput
//           placeholder="Senha"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//           style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
//         />
//         <Button title={loading ? "Entrando..." : "Entrar"} onPress={onLogin} disabled={loading} />
//       </View>
//     </SafeAreaView>
//   );
// }
