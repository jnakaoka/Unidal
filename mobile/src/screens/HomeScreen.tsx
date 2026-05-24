import React from "react";
import { ScrollView, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();

  const perfil =
    user?.perfil?.nome?.toLowerCase?.() ||
    String(user?.perfil || "").toLowerCase();

  const menuItems = [
    {
      title: "Registro de Horas",
      screen: "RegistroHoras",
      visible: ["admin", "operador", "motorista"],
    },
    {
      title: "Dashboard",
      screen: "Dashboard",
      visible: ["admin"],
    },
  ];

  const visibleItems = menuItems.filter((item) => item.visible.includes(perfil));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            elevation: 2,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
            Unidal
          </Text>
          <Text style={{ fontSize: 22, color: "#374151", marginBottom: 8 }}>
            Olá, {user?.name}
          </Text>
          <Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 4 }}>
            Email: {user?.email}
          </Text>
          <Text style={{ fontSize: 16, color: "#6b7280" }}>
            Perfil: {user?.perfil?.nome ?? "—"}
          </Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" }}>
          Acesso rápido
        </Text>

        <View style={{ gap: 12 }}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => navigation.navigate(item.screen)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 18,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={signOut}
            style={{
              backgroundColor: "#2563eb",
              borderRadius: 14,
              padding: 18,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Sair
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


// import React from "react";
// import { ScrollView, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
// import { useAuth } from "../contexts/AuthContext";

// export default function HomeScreen({ navigation }: any) {
//   const { user, signOut } = useAuth();

//   const perfil =
//     user?.perfil?.nome?.toLowerCase?.() ||
//     String(user?.perfil || "").toLowerCase();

//   const menuItems = [
//     {
//       title: "Registro de Horas",
//       screen: "RegistroHoras",
//       visible: ["admin", "operador", "motorista"],
//     },
//     {
//       title: "Dashboard",
//       screen: "Dashboard",
//       visible: ["admin"],
//     },
//   ];

//   const visibleItems = menuItems.filter((item) => item.visible.includes(perfil));

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
//       <ScrollView contentContainerStyle={{ padding: 16 }}>
//         <View
//           style={{
//             backgroundColor: "#fff",
//             borderRadius: 16,
//             padding: 20,
//             elevation: 2,
//             marginBottom: 20,
//           }}
//         >
//           <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
//             Unidal
//           </Text>
//           <Text style={{ fontSize: 22, color: "#374151", marginBottom: 8 }}>
//             Olá, {user?.name}
//           </Text>
//           <Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 4 }}>
//             Email: {user?.email}
//           </Text>
//           <Text style={{ fontSize: 16, color: "#6b7280" }}>
//             Perfil: {user?.perfil?.nome ?? "—"}
//           </Text>
//         </View>

//         <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" }}>
//           Acesso rápido
//         </Text>

//         <View style={{ gap: 12 }}>
//           {visibleItems.map((item) => (
//             <TouchableOpacity
//               key={item.title}
//               onPress={() => navigation.navigate(item.screen)}
//               style={{
//                 backgroundColor: "#fff",
//                 borderRadius: 14,
//                 padding: 18,
//                 elevation: 2,
//               }}
//             >
//               <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}>
//                 {item.title}
//               </Text>
//             </TouchableOpacity>
//           ))}

//           <TouchableOpacity
//             onPress={signOut}
//             style={{
//               backgroundColor: "#2563eb",
//               borderRadius: 14,
//               padding: 18,
//               marginTop: 8,
//             }}
//           >
//             <Text
//               style={{
//                 color: "#fff",
//                 fontSize: 16,
//                 fontWeight: "700",
//                 textAlign: "center",
//               }}
//             >
//               Sair
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// // import React from "react";
// // import { Button, SafeAreaView, Text, View } from "react-native";
// // import { useAuth } from "../contexts/AuthContext";

// // export default function HomeScreen() {
// //   const { user, signOut } = useAuth();

// //   return (
// //     <SafeAreaView style={{ flex: 1, padding: 16 }}>
// //       <View style={{ gap: 12 }}>
// //         <Text style={{ fontSize: 18 }}>Olá, {user?.name}</Text>
// //         <Text>Email: {user?.email}</Text>
// //         <Text>Perfil: {user?.perfil?.nome ?? "—"}</Text>
// //         <Button title="Sair" onPress={signOut} />
// //       </View>
// //     </SafeAreaView>
// //   );
// // }
