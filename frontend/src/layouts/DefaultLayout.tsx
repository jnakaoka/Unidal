import type { FC } from "react";
import { Outlet } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useLayout } from "@/context/LayoutContext";

const DefaultLayout: FC = () => {
  const {
    isSidebarOpen,
    closeSidebar,
  } = useLayout();

  return (
    <div className="min-h-screen bg-gray-100">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar />

      <div
        className={[
          "flex min-h-screen flex-col",
          "transition-[margin] duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-0",
        ].join(" ")}
      >
        <Header />

        <main className="flex-1 bg-gray-50 p-4">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DefaultLayout;