// DefaultLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";

const DefaultLayoutContent: React.FC = () => {
  const { isSidebarOpen, closeSidebar } = useLayout();

  const handleWrapperClick = () => {
    //console.log('deve fechar', isSidebarOpen);
    //if ((isSidebarOpen && window.innerWidth < 768)) {
      closeSidebar();
    //}
  };

  return (
    <div className="relative min-h-screen flex bg-gray-100">
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <Sidebar />
      <div className="flex flex-col flex-1 z-10">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
            onClick={handleWrapperClick}
          />
        )}
        <Header />
        <main className="flex-1 p-4 md:ml-64 bg-gray-50 min-h-screen" onClick={handleWrapperClick}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

const DefaultLayout: React.FC = () => (
  <LayoutProvider>
    <DefaultLayoutContent />
  </LayoutProvider>
);

export default DefaultLayout;



// import React from "react";
// import { Outlet } from "react-router-dom";
// import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";

// const DefaultLayout: React.FC = () => {
//   return (
//     <div className="flex h-screen">
//       <Sidebar />
//       <div className="flex flex-col flex-1">
//         <Header />
//         <main className="flex-1 p-4 overflow-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default DefaultLayout;

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
