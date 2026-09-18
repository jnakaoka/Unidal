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

const Stack = createNativeStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Unidal" }} />
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
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppStack />
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Entrar" }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
