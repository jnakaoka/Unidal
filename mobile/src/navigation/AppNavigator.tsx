import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import RegistroHorasScreen from "../screens/RegistroHorasScreen";

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



// import React from "react";
// import { ActivityIndicator, View } from "react-native";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
// import { useAuth } from "../contexts/AuthContext";
// import LoginScreen from "../screens/LoginScreen";
// import HomeScreen from "../screens/HomeScreen";
// import DashboardScreen from "../screens/DashboardScreen";
// import RegistroHorasScreen from "../screens/RegistroHorasScreen";

// const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();

// function CustomDrawerContent(props: any) {
//   const { user, signOut } = useAuth();

//   const perfil =
//     user?.perfil?.nome?.toLowerCase?.() ||
//     String(user?.perfil || "").toLowerCase();

//   const menuItems = [
//     {
//       label: "Dashboard",
//       name: "Dashboard",
//       visible: ["admin"],
//     },
//     {
//       label: "Registro de Horas",
//       name: "RegistroHoras",
//       visible: ["admin", "operador", "motorista"],
//     },
//     {
//       label: "Home",
//       name: "Home",
//       visible: ["admin", "operador", "motorista"],
//     },
//   ];

//   const visibleItems = menuItems.filter((item) => item.visible.includes(perfil));

//   return (
//     <DrawerContentScrollView {...props}>
//       {visibleItems.map((item) => (
//         <DrawerItem
//           key={item.name}
//           label={item.label}
//           onPress={() => props.navigation.navigate(item.name)}
//         />
//       ))}

//       <DrawerItem label="Sair" onPress={signOut} />
//     </DrawerContentScrollView>
//   );
// }

// function AppDrawer() {
//   return (
//     <Drawer.Navigator
//       initialRouteName="Home"
//       screenOptions={{
//         headerTitle: "Unidal",
//       }}
//       drawerContent={(props: any) => <CustomDrawerContent {...props} />}
//     >
//       <Drawer.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
//       <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
//       <Drawer.Screen name="RegistroHoras" component={RegistroHorasScreen} options={{ title: "Registro de Horas" }} />
//     </Drawer.Navigator>
//   );
// }

// export default function AppNavigator() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       {user ? (
//         <AppDrawer />
//       ) : (
//         <Stack.Navigator>
//           <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Entrar" }} />
//         </Stack.Navigator>
//       )}
//     </NavigationContainer>
//   );
// }