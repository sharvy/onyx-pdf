'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import Toolbar, { ToolType } from '@/components/Toolbar';
import Sidebar from '@/components/Sidebar';
import HelpModal from '@/components/HelpModal';

import type { PDFEditorRef } from '@/components/PDFEditor';

const PDFEditor = dynamic(() => import('@/components/PDFEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading PDF Editor...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [helpOpen, setHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfEditorRef = useRef<PDFEditorRef>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setCurrentPage(1);
    }
  };

  const handleDownload = () => {
    // This will be handled by the PDFEditor component
    const event = new CustomEvent('pdf-download');
    window.dispatchEvent(event);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Upload screen when no PDF is loaded
  if (!pdfFile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar
          filename="No file selected"
          onDownload={() => { }}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-12 max-w-md">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-4xl font-bold mb-2 font-serif tracking-tighter">
                  <span className="text-black">Onyx</span>
                </div>
                <p className="text-gray-600">The premium PDF editor for professionals.</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-6 py-4 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload PDF
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Click to select a PDF file to edit
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main editor view
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        filename={pdfFile.name}
        onDownload={handleDownload}
        onHelp={() => setHelpOpen(true)}
        onDone={() => {
          setPdfFile(null);
          setCurrentPage(1);
        }}
      />
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onUndo={() => pdfEditorRef.current?.undo()}
        onRedo={() => pdfEditorRef.current?.redo()}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          numPages={numPages}
          currentPage={currentPage}
          onPageSelect={setCurrentPage}
        />
        <div className="flex-1 overflow-auto bg-gray-100">
          <PDFEditor
            ref={pdfEditorRef}
            pdfFile={pdfFile}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onNumPagesChange={setNumPages}
            activeTool={activeTool}
          />
        </div>
      </div>
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

