import React, { useEffect, useMemo, useState } from "react";

export const DOTS = "…" as const;

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => i + start);

export function getPaginationRange({
  totalPages,
  currentPage,
  siblingCount = 1,
  boundaryCount = 1,
}: {
  totalPages: number;
  currentPage: number;
  siblingCount?: number;   // vizinhos de cada lado
  boundaryCount?: number;  // páginas fixas no começo/fim
}): (number | typeof DOTS)[] {
  const totalNumbers = boundaryCount * 2 + siblingCount * 2 + 3;
  if (totalPages <= totalNumbers) return range(1, totalPages);

  const leftBound  = Math.max(currentPage - siblingCount, boundaryCount + 2);
  const rightBound = Math.min(currentPage + siblingCount, totalPages - boundaryCount - 1);

  const showLeftDots  = leftBound  > boundaryCount + 2;
  const showRightDots = rightBound < totalPages   - boundaryCount - 1;

  const firstPages = range(1, boundaryCount);
  const lastPages  = range(totalPages - boundaryCount + 1, totalPages);

  if (!showLeftDots && showRightDots) {
    const leftRange = range(1, rightBound + 1);
    return [...leftRange, DOTS, ...lastPages];
  }
  if (showLeftDots && !showRightDots) {
    const rightRange = range(leftBound - 1, totalPages);
    return [...firstPages, DOTS, ...rightRange];
  }
  const middleRange = range(leftBound, rightBound);
  return [...firstPages, DOTS, ...middleRange, DOTS, ...lastPages];
}

/** Hook genérico para paginar QUALQUER array */
export function usePagination<T>(
  items: T[],
  pageSize: number,
  initialPage = 1,
  opts?: { siblingCount?: number; boundaryCount?: number }
) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // clamp quando items ou pageSize mudam
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const pages = useMemo(
    () =>
      getPaginationRange({
        totalPages,
        currentPage,
        siblingCount: opts?.siblingCount ?? 1,
        boundaryCount: opts?.boundaryCount ?? 1,
      }),
    [totalPages, currentPage, opts?.siblingCount, opts?.boundaryCount]
  );

  return { currentPage, setCurrentPage, totalPages, pageItems, pages };
}

/** Componente de paginação (somente UI) */
export interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  className?: string;
}

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  className = "",
}: PaginationProps) {
  const pages = getPaginationRange({
    totalPages,
    currentPage,
    siblingCount,
    boundaryCount,
  });

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <nav aria-label="Paginação" className={`w-full ${className}`}>
      {/* Mobile */}
      <div className="flex items-center justify-between sm:hidden gap-2">
        <button
          type="button"
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          disabled={!canPrev}
          className="px-3 py-2 rounded border text-sm disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm font-medium">
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => canNext && onPageChange(currentPage + 1)}
          disabled={!canNext}
          className="px-3 py-2 rounded border text-sm disabled:opacity-50"
        >
          Próxima
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center">
        <div className="max-w-full overflow-x-auto">
          <ul className="flex items-center gap-1 whitespace-nowrap p-1">
            <li>
              <button
                type="button"
                onClick={() => canPrev && onPageChange(currentPage - 1)}
                disabled={!canPrev}
                className="px-3 py-2 rounded-xl border text-sm disabled:opacity-50"
              >
                Anterior
              </button>
            </li>

            {pages.map((p, idx) => (
              <li key={`${p}-${idx}`}>
                {p === DOTS ? (
                  <span className="px-3 py-2 text-sm select-none">{DOTS}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPageChange(p as number)}
                    aria-current={p === currentPage ? "page" : undefined}
                    className={
                      "px-3 py-2 rounded-xl border text-sm font-medium " +
                      (p === currentPage
                        ? "bg-blue-600 text-white border-blue-600 cursor-default"
                        : "bg-white text-gray-800 hover:bg-gray-100")
                    }
                  >
                    {p}
                  </button>
                )}
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={() => canNext && onPageChange(currentPage + 1)}
                disabled={!canNext}
                className="px-3 py-2 rounded-xl border text-sm disabled:opacity-50"
              >
                Próxima
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Pagination;
