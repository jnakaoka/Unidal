//app.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OperadorDashboard from "./pages/OperadorDashboard";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./routes/PrivateRoute";
import Relatorio from "./pages/Relatorios";
import RelatorioMotorista from "./pages/RelatoriosMotorista";
import RelatorioDiasTrabalhados from "./pages/RelatorioDiasTrabalhados";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import DefaultLayout from "./layouts/DefaultLayout";
//import Projetos from "./pages/Projetos";
import RegistroHoras from "./pages/RegistroHoras";
import Clientes from "./pages/Clientes";
import Obras from "./pages/Obras";
import ChangePassword from "./pages/ChangePassword";
import ControleCartoes from "./pages/ControleCartoes";
import Maquinas from "./pages/Maquinas";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Layout com sidebar, aplicado somente para usuários autenticados */}
      <Route
        path="/"
        element={
          <PrivateRoute allowedProfiles={["admin", "operador","motorista"]}>
            <DefaultLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="operador-dashboard" element={<OperadorDashboard />} />
        <Route path="relatorios" element={<Relatorio />} />
        <Route path="relatoriosmotorista" element={<RelatorioMotorista />} />
        <Route
          path="relatorios/dias-trabalhados"
          element={
            <PrivateRoute allowedProfiles={["admin"]}>
              <RelatorioDiasTrabalhados />
            </PrivateRoute>
          }
        />
        <Route path="usuarios" element={<GestaoUsuarios />} />
        <Route path="registro-horas" element={<RegistroHoras />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="obras" element={<Obras />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="controle-cartoes" element={<PrivateRoute allowedProfiles={["admin"]}><ControleCartoes /></PrivateRoute>}/>
        <Route path="maquinas" element={<PrivateRoute allowedProfiles={["admin"]}><Maquinas /></PrivateRoute>}/>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;


// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import OperadorDashboard from "./pages/OperadorDashboard";
// import { useAuth } from "./context/AuthContext";
// import NotFound from "./pages/NotFound"; // (crie essa página ou mude conforme sua estrutura)
// import PrivateRoute from "./routes/PrivateRoute";
// import Relatorio from "./pages/Relatorios";
// import GestaoUsuarios from "./pages/GestaoUsuarios";
// import DefaultLayout from "./layouts/DefaultLayout";

// const App: React.FC = () => {
//   return (
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route
//         path="/"
//         element={
//           <PrivateRoute allowedProfiles={["admin", "operador"]}>
//             <DefaultLayout />
//           </PrivateRoute>
//         }
//       ></Route>
//       <Route path="/admin-dashboard" element={
//         <PrivateRoute allowedProfiles={['admin']}>
//           <Dashboard />
//         </PrivateRoute>
//       } />
//       <Route path="/operador-dashboard" element={
//         <PrivateRoute allowedProfiles={['operador']}>
//           <OperadorDashboard />
//         </PrivateRoute>
//       } />
//       <Route path="/relatorios" element={
//         <PrivateRoute allowedProfiles={['admin', 'operador']}>
//           <Relatorio />
//         </PrivateRoute>
//       } />

//       <Route path="/usuarios" element={
//         <PrivateRoute allowedProfiles={['admin']}>
//           <GestaoUsuarios />
//         </PrivateRoute>
//       } />

//       {/* <Route path="/home" element={<Home />} /> */}
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// };

// export default App;
