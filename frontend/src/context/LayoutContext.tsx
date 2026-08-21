import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface LayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const LayoutContext = createContext<
  LayoutContextType | undefined
>(undefined);

export function LayoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => (
      typeof window !== "undefined"
      && window.innerWidth >= 768
    ),
  );

  function toggleSidebar() {
    setIsSidebarOpen((anterior) => !anterior);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <LayoutContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error(
      "useLayout deve ser usado dentro de LayoutProvider",
    );
  }

  return context;
}