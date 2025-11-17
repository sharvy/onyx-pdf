'use client';

import { Search, Printer, Download, Check, HelpCircle } from 'lucide-react';

interface TopBarProps {
  filename: string;
  onSearch?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onDone?: () => void;
  onHelp?: () => void;
}

export default function TopBar({
  filename,
  onSearch,
  onPrint,
  onDownload,
  onDone,
  onHelp
}: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Logo and Filename */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold font-serif tracking-tighter">
            <span className="text-black">Onyx</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span>{filename}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSearch}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onHelp}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-blue-600"
          title="How to use"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={onPrint}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Print"
        >
          <Printer className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onDownload}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onDone}
          className="ml-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md flex items-center gap-2 transition-colors font-medium"
        >
          <Check className="w-4 h-4" />
          Done
        </button>
      </div>
    </div>
  );
}
