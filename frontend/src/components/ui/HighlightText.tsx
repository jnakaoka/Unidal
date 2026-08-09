import React from "react";

type HighlightTextType = "warning" | "info" | "success" | "danger";

interface HighlightTextProps {
  type?: HighlightTextType;
  children: React.ReactNode;
  className?: string;
}

export default function HighlightText({
  type = "warning",
  children,
  className = "",
}: HighlightTextProps) {
  const colors: Record<HighlightTextType, string> = {
    warning: "text-orange-600",
    info: "text-blue-600",
    success: "text-green-600",
    danger: "text-red-600",
  };

  return (
    <span
      style={{
        color: "#ea580c",
        fontWeight: 700,
        fontStyle: "italic",
      }}
      className={className}
    >
      {children}
    </span>
  );
}