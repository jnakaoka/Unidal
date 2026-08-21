import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
}

export default function LoadingState({
  message = "A carregar dados...",
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex w-full flex-col items-center",
        "justify-center gap-3 text-gray-600",
        compact ? "min-h-24 py-4" : "min-h-48 py-8",
      ].join(" ")}
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-8 w-8 animate-spin text-red-600"
      />

      <span className="text-sm font-medium">
        {message}
      </span>
    </div>
  );
}