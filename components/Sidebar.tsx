'use client';

interface SidebarProps {
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export default function Sidebar({ numPages, currentPage, onPageSelect }: SidebarProps) {
  return (
    <div className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Pages</h3>
        <div className="space-y-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageSelect(pageNum)}
              className={`w-full p-3 rounded-md border-2 transition-all ${
                currentPage === pageNum
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="aspect-[8.5/11] bg-white border border-gray-200 rounded flex items-center justify-center mb-2">
                <span className="text-xs text-gray-400">Page {pageNum}</span>
              </div>
              <div className="text-xs text-center text-gray-600">{pageNum}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
