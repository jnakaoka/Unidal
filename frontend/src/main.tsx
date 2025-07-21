// import React from "react";
// import ReactDOM from "react-dom/client";
// import { RouterProvider } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";
// import router from "./routes";

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <AuthProvider>
//       <RouterProvider router={router} />
//     </AuthProvider>
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import router from "./routes";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LayoutProvider } from "./context/LayoutContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <App />
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);