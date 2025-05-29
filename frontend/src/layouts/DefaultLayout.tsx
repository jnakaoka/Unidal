import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const DefaultLayout: React.FC = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DefaultLayout;

// import React from "react";
// import { Outlet } from "react-router-dom";

// const DefaultLayout: React.FC = () => {
//   return (
//     <div className="min-h-screen bg-gray-100 text-gray-900">
//       <header className="p-4 bg-white shadow">UNIDAL</header>
//       <main className="p-4">
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// export default DefaultLayout;
