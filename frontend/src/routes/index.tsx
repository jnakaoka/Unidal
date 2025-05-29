import { ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({ element }: { element: ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <PrivateRoute element={<Dashboard />} /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "*", element: <NotFound /> },
]);

export default router;
