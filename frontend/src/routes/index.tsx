import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/Dashboard";
import OperadorDashboard from "../pages/OperadorDashboard";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import PrivateRoute from "./PrivateRoute";
import Projetos from "../pages/Projetos";
import RegistroHoras from "../pages/RegistroHoras";
import Relatorios from "../pages/Relatorios";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute allowedProfiles={["admin", "operador"]}>
        <DefaultLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
    ],
  },
  {
    path: "/admin-dashboard",
    element: (
      <PrivateRoute allowedProfiles={["admin"]}>
        <AdminDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/operador-dashboard",
    element: (
      <PrivateRoute allowedProfiles={["operador"]}>
        <OperadorDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/projetos",
    element: (
        <PrivateRoute allowedProfiles={["admin"]}>
        <Projetos />
        </PrivateRoute>
    ),
    },
    {
    path: "/registro-horas",
    element: (
        <PrivateRoute allowedProfiles={["operador"]}>
        <RegistroHoras />
        </PrivateRoute>
    ),
  },
  {
    path: "/relatorios",
    element: (
        <PrivateRoute allowedProfiles={['admin', 'operador']}>
        <Relatorios />
        </PrivateRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
