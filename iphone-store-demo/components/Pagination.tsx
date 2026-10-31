'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createPageURL = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', pageNumber.toString());
      return `${pathname}?${params.toString()}`;
    },
    [searchParams, pathname]
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      router.push(createPageURL(page));
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div data-testid="pagination" className="flex justify-center mt-8 gap-2">
      <button
        data-testid="pagination-prev-button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* Basic pagination for now - can be improved with ellipsis later if needed */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          data-testid={`pagination-page-button-${page}`}
          onClick={() => handlePageChange(page)}
          className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors cursor-pointer
            ${
              currentPage === page
                ? 'bg-[#0071e3] text-white'
                : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
        >
          {page}
        </button>
      ))}

      <button
        data-testid="pagination-next-button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}
