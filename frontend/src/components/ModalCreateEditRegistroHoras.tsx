// src/components/ModalPortal.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

type Props = {
  open: boolean;
  onClose?: () => void;
  /** Largura máxima do conteúdo (mapeia para classes Tailwind) */
  size?: ModalSize;
  /** Z-index do overlay (default 10000) */
  zIndex?: number;
  /** Trava o scroll do body enquanto o modal está aberto (default true) */
  lockScroll?: boolean;
  /** Fecha ao clicar no backdrop (default true) */
  closeOnBackdrop?: boolean;
  /** Classes extras para o container do conteúdo */
  className?: string;
  children: React.ReactNode;
};

const sizeToMaxW: Record<ModalSize, string> = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  full: "max-w-[98vw]",
};

export default function ModalPortal({
  open,
  onClose,
  size = "3xl",
  zIndex = 10000,
  lockScroll = true,
  closeOnBackdrop = true,
  className = "",
  children,
}: Props) {
  // trava/destrava o scroll do body
  useEffect(() => {
    if (!lockScroll || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, lockScroll]);

  // ESC para fechar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = () => {
    if (closeOnBackdrop) onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdrop}
        aria-hidden="true"
      />
      {/* Content wrapper */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "bg-white w-full",
            sizeToMaxW[size],
            "max-h-[90vh] rounded-xl shadow-xl flex flex-col overflow-hidden",
            className,
          ].join(" ")}
          onClick={(e) => e.stopPropagation()} // impede fechar ao clicar dentro
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
