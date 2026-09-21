import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import RegistroHorasScreen from "../screens/RegistroHorasScreen";
import FaceEnrollmentScreen from "../screens/FaceEnrollmentScreen";
import WebModuleScreen from "../screens/WebModuleScreen";

const Stack = createNativeStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#ed0000" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#f5f6f8" },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WebModule"
        component={WebModuleScreen}
        options={({ route }: any) => ({
          title: route?.params?.title || "Unidal",
        })}
      />

      {/* Mantidos durante a recuperação para não perder funcionalidades já implementadas. */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <Stack.Screen
        name="RegistroHoras"
        component={RegistroHorasScreen}
        options={{ title: "Registro de Horas" }}
      />
      <Stack.Screen
        name="FaceEnrollment"
        component={FaceEnrollmentScreen}
        options={{ title: "Cadastro Facial" }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ed0000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppStack />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
