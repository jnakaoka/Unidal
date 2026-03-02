import React from "react";
import { Button, SafeAreaView, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 18 }}>Olá, {user?.name}</Text>
        <Text>Email: {user?.email}</Text>
        <Text>Perfil: {user?.perfil?.nome ?? "—"}</Text>
        <Button title="Sair" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
