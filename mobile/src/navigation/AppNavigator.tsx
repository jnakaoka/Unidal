import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import WebModuleScreen from "../screens/WebModuleScreen";
import { colors } from "../theme";
import type { RootStackParamList } from "../types/navigation";

const AppStack = createNativeStackNavigator<RootStackParamList>();
const LoginStack = createNativeStackNavigator();

function AuthenticatedStack() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AppStack.Screen name="Home" component={HomeScreen} options={{ title: "Unidal", headerShown: false }} />
      <AppStack.Screen name="WebModule" component={WebModuleScreen} options={({ route }) => ({ title: route.params.title })} />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedStack /> : (
        <LoginStack.Navigator screenOptions={{ headerShown: false }}>
          <LoginStack.Screen name="Login" component={LoginScreen} />
        </LoginStack.Navigator>
      )}
    </NavigationContainer>
  );
}
