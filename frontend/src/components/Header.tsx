import { Menu } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useLayout } from "@/context/LayoutContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();

  return (
    <header
      className={[
        "sticky top-0 z-20",
        "grid h-16 grid-cols-[auto_1fr_auto]",
        "items-center gap-4",
        "border-b border-red-700",
        "bg-[#e60000] px-4 shadow-sm",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Abrir ou fechar menu lateral"
        title="Abrir ou fechar menu"
        className={[
          "inline-flex h-11 w-11 shrink-0 p-0",
          "items-center justify-center rounded-lg",
          "border border-red-800",
          "bg-red-700 text-white shadow-sm",
          "transition-colors hover:bg-red-800",
          "focus:outline-none focus:ring-2",
          "focus:ring-white focus:ring-offset-2",
          "focus:ring-offset-red-600",
        ].join(" ")}
      >
        <Menu
          size={26}
          strokeWidth={2.5}
          className="shrink-0"
          aria-hidden="true"
        />
      </button>

      <div className="flex items-center justify-self-center gap-2">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center",
            "rounded-lg bg-white p-0.5 shadow-sm",
          ].join(" ")}
        >
          <img
            src="/logo_unidal_editado.png"
            alt="Unidal"
            className="h-11 w-11 object-contain"
          />
        </div>

        <span className="hidden text-lg font-semibold text-white sm:inline">
          Unidal
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-white md:inline">
          Olá, {user?.name || "Utilizador"}
        </span>

        <button
          type="button"
          onClick={logout}
          className={[
            "rounded-lg bg-white px-4 py-2",
            "text-sm font-medium text-red-700",
            "hover:bg-red-50",
          ].join(" ")}
        >
          Sair
        </button>
      </div>
    </header>
  );
}