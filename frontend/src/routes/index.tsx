// src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import OperadorDashboard from "../pages/OperadorDashboard";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import PrivateRoute from "./PrivateRoute";
import Projetos from "../pages/Projetos";
import RegistroHoras from "../pages/RegistroHoras";
import Relatorios from "../pages/Relatorios";
import RelatoriosMotorista from "../pages/RelatoriosMotorista";
import RelatorioDiasTrabalhados from "../pages/RelatorioDiasTrabalhados";
import ChangePassword from "@/pages/ChangePassword";
import Maquinas from "@/pages/Maquinas";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute allowedProfiles={["admin", "operador", "motorista"]}>
        <DefaultLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "/", element: <Dashboard /> },

      { path: "/registro-horas", element: (
        <PrivateRoute allowedProfiles={["operador", "motorista", "admin"]}>
          <RegistroHoras />
        </PrivateRoute>
      )},

      { path: "/relatorios", element: (
        <PrivateRoute allowedProfiles={["admin"]}>
          <Relatorios />
        </PrivateRoute>
      )},

      // ✅ AQUI: rota do motorista dentro do layout
      { path: "/RelatoriosMotorista", element: (
        <PrivateRoute allowedProfiles={["admin"]}>
          <RelatoriosMotorista />
        </PrivateRoute>
      )},

      { path: "/relatorios/dias-trabalhados", element: (
        <PrivateRoute allowedProfiles={["admin"]}>
          <RelatorioDiasTrabalhados />
        </PrivateRoute>
      )},
      { path: "/maquinas", element: <PrivateRoute allowedProfiles={["admin"]}><Maquinas /></PrivateRoute> },
    ],
  },

  { path: "/login", element: <Login /> },
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "*", element: <NotFound /> },
]);


// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: (
//       <PrivateRoute allowedProfiles={["admin", "operador", "motorista"]}>
//         <DefaultLayout />
//       </PrivateRoute>
//     ),
//     children: [
//       {
//         path: "/",
//         element: <Dashboard />,
//       },
//     ],
//   },
//   {
//     path: "/dashboard",
//     element: (
//       <PrivateRoute allowedProfiles={["admin"]}>
//         <Dashboard />
//       </PrivateRoute>
//     ),
//   },
//   {
//     path: "/operador-dashboard",
//     element: (
//       <PrivateRoute allowedProfiles={["operador", "motorista"]}>
//         <OperadorDashboard />
//       </PrivateRoute>
//     ),
//   },
//   {
//     path: "/projetos",
//     element: (
//         <PrivateRoute allowedProfiles={["admin"]}>
//         <Projetos />
//         </PrivateRoute>
//     ),
//     },
//     {
//     path: "/registro-horas",
//     element: (
//         <PrivateRoute allowedProfiles={["operador", "motorista"]}>
//         <RegistroHoras />
//         </PrivateRoute>
//     ),
//   },
//   {path: "/relatorios",
//     element: (
//         <PrivateRoute allowedProfiles={['admin', 'operador', 'motorista']}>
//         <Relatorios />
//         </PrivateRoute>
//     ),
//   },
//   { path: "/RelatoriosMotorista", element: (
//         <PrivateRoute allowedProfiles={["admin"]}>
//           <RelatoriosMotorista />
//         </PrivateRoute>
//       )
//     },
//   {
//     path: "/change-password",
//     element: (
//         <PrivateRoute allowedProfiles={['admin', 'operador', 'motorista']}>
//         <ChangePassword />
//         </PrivateRoute>
//     ),
//   },
//   {
//     path: "/login",
//     element: <Login />,
//   },
//   {
//     path: "/unauthorized",
//     element: <Unauthorized />,
//   },
//   {
//     path: "*",
//     element: <NotFound />,
//   },
// ]);

export default router;
