'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { findPositionsForKeywords, TextItem } from '@/utils/smartContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TextAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
}

interface ImageAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  imageData: string;
  width: number;
  height: number;
}

interface DragState {
  type: 'text' | 'image';
  id: string;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  id: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number;
  corner: 'nw' | 'ne' | 'sw' | 'se';
}

interface PDFEditorProps {
  pdfFile: File;
  currentPage: number;
  onPageChange: (page: number) => void;
  onNumPagesChange: (numPages: number) => void;
  activeTool: string;
}

export interface PDFEditorRef {
  undo: () => void;
  redo: () => void;
}

const PDFEditor = forwardRef<PDFEditorRef, PDFEditorProps>(({
  pdfFile,
  currentPage,
  onPageChange,
  onNumPagesChange,
  activeTool,
}, ref) => {
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number; originalWidth: number; originalHeight: number } | null>(null);
  const [pageTextItems, setPageTextItems] = useState<TextItem[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([]);
  const [editMode, setEditMode] = useState<'select' | 'text' | 'image' | 'magic' | null>('select');
  const [selectedAnnotation, setSelectedAnnotation] = useState<{ type: 'text' | 'image'; id: string } | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const smartImageInputRef = useRef<HTMLInputElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Smart Assistant State
  const [showSmartDialog, setShowSmartDialog] = useState(false);
  const [smartClickPos, setSmartClickPos] = useState<{ x: number, y: number } | null>(null);
  const [smartCommand, setSmartCommand] = useState('');
  const [smartImage, setSmartImage] = useState<string | null>(null);

  // History management
  const [history, setHistory] = useState<{ text: TextAnnotation[]; image: ImageAnnotation[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        const prevState = history[prevIndex];
        setTextAnnotations(prevState.text);
        setImageAnnotations(prevState.image);
        setHistoryIndex(prevIndex);
      }
    },
    redo: () => {
      if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        const nextState = history[nextIndex];
        setTextAnnotations(nextState.text);
        setImageAnnotations(nextState.image);
        setHistoryIndex(nextIndex);
      }
    },
  }));

  // Auto-save history
  useEffect(() => {
    if (dragState || resizeState) return;

    const currentEntry = { text: textAnnotations, image: imageAnnotations };

    // Initial state
    if (history.length === 0) {
      setHistory([currentEntry]);
      setHistoryIndex(0);
      return;
    }

    const lastEntry = history[historyIndex];

    // Check if changed (simple JSON serialization check)
    // Avoid creating history if nothing changed
    if (lastEntry && JSON.stringify(lastEntry) === JSON.stringify(currentEntry)) {
      return;
    }

    // If we are in the middle of history and make a change, discard future
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [textAnnotations, imageAnnotations, dragState, resizeState, historyIndex]); // check deps

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected annotation with Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotation && editMode === 'select') {
        e.preventDefault();
        const { type, id } = selectedAnnotation;

        if (type === 'text') {
          setTextAnnotations((prev) => prev.filter((ann) => ann.id !== id));
        } else {
          setImageAnnotations((prev) => prev.filter((ann) => ann.id !== id));
        }
        setSelectedAnnotation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, editMode]);

  // Load PDF file when it changes
  useEffect(() => {
    const loadPDF = async () => {
      if (pdfFile) {
        const arrayBuffer = await pdfFile.arrayBuffer();
        setPdfArrayBuffer(arrayBuffer);
      }
    };
    loadPDF();
  }, [pdfFile]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onNumPagesChange(numPages);
  };

  const onPageLoadSuccess = async (page: any) => {
    setPageDimensions({
      width: page.width,
      height: page.height,
      originalWidth: page.originalWidth,
      originalHeight: page.originalHeight,
    });

    // Extract text content for AI context
    try {
      const textContent = await page.getTextContent();
      // Filter out empty strings and whitespace-only items
      const items = textContent.items.filter((item: any) => item.str.trim().length > 0);
      setPageTextItems(items);
    } catch (e) {
      console.error("Failed to load text content", e);
    }
  };

  // Update edit mode based on active tool
  const prevActiveToolRef = useRef<string>(activeTool);
  useEffect(() => {
    const prevActiveTool = prevActiveToolRef.current;

    if (activeTool === 'text') {
      setEditMode('text');
      // Only add text annotation when switching TO text mode (not when already in text mode)
      if (prevActiveTool !== 'text' && pageDimensions) {
        // Automatically add "change text" annotation when text tool is activated
        const scaleX = pageDimensions.originalWidth / pageDimensions.width;
        const scaleY = pageDimensions.originalHeight / pageDimensions.height;

        // Center in PDF coordinates
        const pdfX = (pageDimensions.originalWidth / 2) - 50 * scaleX;
        const pdfY = pageDimensions.originalHeight / 2;

        const hexColor = textColor.replace('#', '');
        const r = parseInt(hexColor.substring(0, 2), 16) / 255;
        const g = parseInt(hexColor.substring(2, 4), 16) / 255;
        const b = parseInt(hexColor.substring(4, 6), 16) / 255;

        const newId = Date.now().toString();
        setTextAnnotations((prev) => [
          ...prev,
          {
            id: newId,
            page: currentPage,
            x: pdfX,
            y: pdfY,
            text: 'change text',
            fontSize,
            color: { r, g, b },
          },
        ]);
        // Automatically select and start editing the new text
        setSelectedAnnotation({ type: 'text', id: newId });
        setEditingTextId(newId);
      }
    } else if (activeTool === 'image') {
      setEditMode('image');
      // Don't auto-trigger file input to allow multiple image additions
    } else if (activeTool === 'magic') {
      setEditMode('magic');
    } else {
      setEditMode('select');
    }

    prevActiveToolRef.current = activeTool;
  }, [activeTool, currentPage, fontSize, textColor]);

  // Listen for download event
  useEffect(() => {
    const handleDownload = () => {
      downloadPDF();
    };
    window.addEventListener('pdf-download', handleDownload);
    return () => window.removeEventListener('pdf-download', handleDownload);
  }, [pdfArrayBuffer, textAnnotations, imageAnnotations]);

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || dragState) return;

    // Deselect when clicking on empty space in select mode
    if (editMode === 'select') {
      setSelectedAnnotation(null);
      setEditingTextId(null);
      return;
    }

    // Trigger image upload when in image mode
    if (editMode === 'image') {
      imageInputRef.current?.click();
      return;
    }

    // Smart AI Mode
    if (editMode === 'magic' && pageContainerRef.current && pageDimensions) {
      const rect = pageContainerRef.current.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      const relativeY = event.clientY - rect.top;

      const unzoomedX = relativeX / zoom;
      const unzoomedY = relativeY / zoom;

      // Convert to PDF coordinates for analysis
      const scaleX = pageDimensions.originalWidth / pageDimensions.width;
      const scaleY = pageDimensions.originalHeight / pageDimensions.height;

      const pdfX = unzoomedX * scaleX;
      // PDF Y is bottom-up
      const pdfY = pageDimensions.originalHeight - (unzoomedY * scaleY);

      setSmartClickPos({ x: pdfX, y: pdfY });
      setShowSmartDialog(true);
      return;
    }
  };

  const handleAnnotationClick = (
    event: React.MouseEvent,
    type: 'text' | 'image',
    id: string
  ) => {
    event.stopPropagation();

    if (editMode === 'select') {
      // Single click selects
      if (selectedAnnotation?.id !== id || selectedAnnotation?.type !== type) {
        setSelectedAnnotation({ type, id });
        setEditingTextId(null);
      }
      // Note: We don't toggle edit mode here anymore. Double click handles that.
    }
  };

  const handleAnnotationDoubleClick = (
    event: React.MouseEvent,
    type: 'text',
    id: string
  ) => {
    event.stopPropagation();
    if (editMode === 'select' && type === 'text') {
      setSelectedAnnotation({ type: 'text', id });
      setEditingTextId(id);
    }
  };

  const handleAnnotationMouseDown = (
    event: React.MouseEvent,
    type: 'text' | 'image',
    id: string
  ) => {
    // Allow dragging immediately if in select mode
    if (editMode !== 'select') return;

    // Select immediately on mouse down to allow dragging
    if (!selectedAnnotation || selectedAnnotation.type !== type || selectedAnnotation.id !== id) {
      setSelectedAnnotation({ type, id });
      setEditingTextId(null);
    }

    event.stopPropagation();
    event.preventDefault();

    if (!pageContainerRef.current) return;

    const pageRect = pageContainerRef.current.getBoundingClientRect();
    const elementRect = event.currentTarget.getBoundingClientRect();

    // Calculate offset from mouse to element's top-left corner
    const offsetX = event.clientX - elementRect.left;
    const offsetY = event.clientY - elementRect.top;

    setDragState({ type, id, offsetX, offsetY });
  };

  const handleResizeMouseDown = (
    event: React.MouseEvent,
    id: string,
    corner: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    event.stopPropagation();
    event.preventDefault();

    const annotation = imageAnnotations.find((a) => a.id === id);
    if (!annotation) return;

    setResizeState({
      id,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: annotation.width,
      startHeight: annotation.height,
      aspectRatio: annotation.width / annotation.height,
      corner,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // Handle resize
    if (resizeState && pageContainerRef.current && pageDimensions) {
      const scaleX = pageDimensions.originalWidth / pageDimensions.width;
      const scaleY = pageDimensions.originalHeight / pageDimensions.height;

      // Calculate delta in unzoomed screen pixels
      // event.clientX is global. resizeState.startX is global.
      // Difference is screen pixels.
      // divide by zoom to get "unzoomed visual pixels"
      // multiply by scaleX/Y to get PDF points

      const rawDeltaX = event.clientX - resizeState.startX;
      const rawDeltaY = event.clientY - resizeState.startY;

      const deltaX = (rawDeltaX / zoom) * scaleX;
      const deltaY = (rawDeltaY / zoom) * scaleY; // Y direction on screen matches Y direction of height change usually?
      // Wait, increasing Y on screen = downwards.
      // Increasing Height usually means extending downwards.
      // So +deltaY on screen means +Height in our logic?
      // Let's check logic below.

      // logic: Math.max(deltaX / resizeState.startWidth ...)
      // startWidth is in points. deltaX is in points. Good.

      // Note: In PDF coords, Y is bottom-up.
      // But height is scalar.
      // If I drag SE corner down, screen Y increases.
      // Height should increase.
      // Y position (bottom-left) should DECREASE (move down).

      // Let's see current implementation:
      // if (resizeState.corner === 'se') {
      //   newWidth = ... + deltaX
      //   newHeight = ...
      // }
      // This logic assumes +delta means expansion.
      // Screen X right = +, expansion. Correct.
      // Screen Y down = +, expansion. Correct.

      // Calculate the dominant delta for aspect-ratio-locked resize
      let newWidth = resizeState.startWidth;
      let newHeight = resizeState.startHeight;

      const scaleFactor = resizeState.corner === 'se' || resizeState.corner === 'ne'
        ? Math.max(deltaX / resizeState.startWidth, deltaY / resizeState.startHeight)
        : resizeState.corner === 'sw' || resizeState.corner === 'nw'
          ? Math.max(-deltaX / resizeState.startWidth, deltaY / resizeState.startHeight)
          : 0;

      // Logic below seems to handle aspect ratio.
      // But verify directions.
      // SE: +deltaX -> +Width. +deltaY -> +Height.
      // SW: -deltaX -> +Width. +deltaY -> +Height.
      // NE: +deltaX -> +Width. -deltaY -> +Height. 
      // NW: -deltaX -> +Width. -deltaY -> +Height.

      // Wait, in `deltaY` calculation above:
      // `rawDeltaY` is positive when moving DOWN.
      // If I drag NE corner UP, rawDeltaY is negative.
      // So -deltaY is positive. Height increases.
      // Correct.

      if (resizeState.corner === 'se') {
        newWidth = Math.max(30, resizeState.startWidth + deltaX);
        newHeight = newWidth / resizeState.aspectRatio;
      } else if (resizeState.corner === 'sw') {
        newWidth = Math.max(30, resizeState.startWidth - deltaX);
        newHeight = newWidth / resizeState.aspectRatio;
      } else if (resizeState.corner === 'ne') {
        newWidth = Math.max(30, resizeState.startWidth + deltaX);
        newHeight = newWidth / resizeState.aspectRatio;
      } else if (resizeState.corner === 'nw') {
        newWidth = Math.max(30, resizeState.startWidth - deltaX);
        newHeight = newWidth / resizeState.aspectRatio;
      }

      setImageAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id !== resizeState.id) return ann;

          let newX = ann.x;
          let newY = ann.y;

          // Adjust position based on corner being dragged
          // X adjustment
          if (resizeState.corner === 'nw' || resizeState.corner === 'sw') {
            // Moving left edge. x must change.
            // If width increased by 10, x must decrease by 10.
            newX = ann.x + (ann.width - newWidth);
          }

          // Y adjustment
          // PDF Y is bottom-left.
          // If I change height by moving TOP edge (NE/NW):
          // Bottom stays same? Y stays same.
          // Let's check:
          // Moving NE/NW corner (TOP edge on screen):
          // Screen Y changes.
          // PDF Y (Bottom) should stay same. Height increases.
          // So newY = ann.y. Correct.

          if (resizeState.corner === 'sw' || resizeState.corner === 'se') {
            // Moving BOTTOM edge on screen.
            // Screen Y changes.
            // PDF Y (Bottom) must change relative to top?
            // No, wait.
            // If I drag SE corner DOWN (screen):
            // Visual Bottom moves DOWN.
            // PDF Y (Bottom) refers to this new lower position.
            // So PDF Y must DECREASE.
            // newY = ann.y + (ann.height - newHeight).
            // If newHeight > oldHeight (expanded), ann.height - newHeight is negative. 
            // So Y decreases. Correct.
            newY = ann.y + (ann.height - newHeight);
          }

          return {
            ...ann,
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
          };
        })
      );
      return;
    }

    // Handle drag
    if (!dragState || !pageContainerRef.current || !pageDimensions) return;

    // We used to double-divide by zoom (unzoomedX was relativeX/zoom, scaleX was original/rendered).
    // rendered width IS zoomed width.
    // So scaleX converts "zoomed/screen pixels" to "PDF points" directly.

    const rect = pageContainerRef.current.getBoundingClientRect();

    // Mouse position relative to container (visual text-selection/cursor space)
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    // Convert to PDF coordinates
    // scaleX = originalWidth / renderedWidth
    // renderedWidth includes zoom.

    const scaleX = pageDimensions.originalWidth / pageDimensions.width;
    const scaleY = pageDimensions.originalHeight / pageDimensions.height;

    // We calculate the new top-left of the element in SCREEN pixels first
    // Then convert to PDF.

    const visualLeft = relativeX - dragState.offsetX;
    const visualTop = relativeY - dragState.offsetY;

    // Convert to PDF Points
    const newPdfX = visualLeft * scaleX;

    // PDF Y is inverted (bottom-up)
    // pdfY = height - (screenTop * scale) - elementHeight

    if (dragState.type === 'text') {
      setTextAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id !== dragState.id) return ann;

          const newPdfY = pageDimensions.originalHeight - (visualTop * scaleY) - ann.fontSize;

          return {
            ...ann,
            x: newPdfX,
            y: newPdfY
          };
        })
      );
    } else {
      setImageAnnotations((prev) =>
        prev.map((ann) => {
          if (ann.id !== dragState.id) return ann;
          const newPdfY = pageDimensions.originalHeight - (visualTop * scaleY) - ann.height;

          return {
            ...ann,
            x: newPdfX,
            y: newPdfY
          };
        })
      );
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setResizeState(null);
  };

  const deleteAnnotation = (type: 'text' | 'image', id: string) => {
    if (type === 'text') {
      setTextAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    } else {
      setImageAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    }
    // Clear selection if deleted item was selected
    if (selectedAnnotation?.type === type && selectedAnnotation?.id === id) {
      setSelectedAnnotation(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        // Store image data, will be placed on click
        const img = new Image();
        img.onload = () => {
          if (!pageDimensions) return;

          // Work with PDF points directly
          // Max width 200 points
          const scale = Math.min(200 / img.width, 200 / img.height);
          const width = img.width * scale;
          const height = img.height * scale;

          const centerX = (pageDimensions.originalWidth / 2) - (width / 2);
          const centerY = (pageDimensions.originalHeight / 2) - (height / 2);

          // Add image at center of current view
          setImageAnnotations((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              page: currentPage,
              x: centerX,
              y: centerY,
              imageData,
              width,
              height,
            },
          ]);
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow uploading the same file again or multiple different files
    event.target.value = '';
  };

  const downloadPDF = async () => {
    if (!pdfArrayBuffer) return;

    try {
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Add text annotations
      for (const annotation of textAnnotations) {
        const page = pages[annotation.page - 1];
        page.drawText(annotation.text, {
          x: annotation.x,
          y: annotation.y,
          size: annotation.fontSize,
          font,
          color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
        });
      }

      // Add image annotations
      for (const annotation of imageAnnotations) {
        const page = pages[annotation.page - 1];

        // Convert base64 to bytes
        const imageBytes = await fetch(annotation.imageData).then((res) =>
          res.arrayBuffer()
        );

        let image;
        if (annotation.imageData.includes('image/png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (annotation.imageData.includes('image/jpeg') || annotation.imageData.includes('image/jpg')) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          continue; // Skip unsupported formats
        }

        page.drawImage(image, {
          x: annotation.x,
          y: annotation.y,
          width: annotation.width,
          height: annotation.height,
        });
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Generate filename with timestamp
      const now = new Date();
      const pad = (num: number) => num.toString().padStart(2, '0');
      const timestamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

      const originalName = pdfFile?.name || 'document.pdf';
      const baseName = originalName.replace(/\.[^/.]+$/, "");
      const finalFileName = `${baseName}- ${timestamp}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('Error creating PDF. Please try again.');
    }
  };

  const clearAnnotations = () => {
    setTextAnnotations([]);
    setImageAnnotations([]);
    setSelectedAnnotation(null);
  };

  return (
    <div className="min-h-full flex flex-col items-center p-8 pb-40 relative">
      {/* Hidden image input */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <input
        type="file"
        ref={smartImageInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              setSmartImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Smart Assistant Dialog */}
      {showSmartDialog && smartClickPos && (
        <div className="absolute z-50 bg-white rounded-lg shadow-xl p-4 w-80 border border-gray-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>✨</span> AI Assistant
            </h3>
            <button
              onClick={() => {
                setShowSmartDialog(false);
                setSmartCommand('');
                setSmartImage(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">COMMAND</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder='e.g., "Put signature and date here"'
              rows={3}
              value={smartCommand}
              onChange={(e) => setSmartCommand(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">ATTACHMENT (Optional)</label>
            <div className="flex gap-2">
              <button
                onClick={() => smartImageInputRef.current?.click()}
                className="flex-1 py-1 px-3 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-600 flex items-center justify-center gap-2"
              >
                {smartImage ? 'Change Image' : 'Upload Signature/Image'}
              </button>
              {smartImage && (
                <div className="w-8 h-8 rounded overflow-hidden border border-gray-200">
                  <img src={smartImage} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md font-medium hover:opacity-90 transition-opacity"
            onClick={() => {
              if (!smartClickPos || !pageDimensions) return;

              // Parse Command
              const lowerCmd = smartCommand.toLowerCase();
              const keywords = [];
              if (lowerCmd.includes('date')) keywords.push('date');
              if (lowerCmd.includes('sign') || lowerCmd.includes('signature')) keywords.push('signature');
              if (lowerCmd.includes('place') || lowerCmd.includes('location')) keywords.push('place');

              const positions = findPositionsForKeywords(
                pageTextItems,
                smartClickPos.x,
                smartClickPos.y,
                pageDimensions.originalHeight,
                keywords
              );

              // Apply Annotations
              positions.forEach(pos => {
                if (pos.keyword === 'date') {
                  // Add Date Text
                  const dateStr = new Date().toLocaleDateString();
                  const newId = Date.now().toString() + Math.random();
                  setTextAnnotations(prev => [...prev, {
                    id: newId,
                    page: currentPage,
                    x: pos.x,
                    y: pos.y,
                    text: dateStr,
                    fontSize: 12,
                    color: { r: 0, g: 0, b: 0 }
                  }]);
                } else if (pos.keyword === 'signature' && smartImage) {
                  // Add Signature Image with correct aspect ratio
                  const img = new Image();
                  img.onload = () => {
                    const maxWidth = 150;
                    const scale = maxWidth / img.width;
                    const width = maxWidth;
                    const height = img.height * scale;

                    const newId = Date.now().toString() + Math.random();
                    setImageAnnotations(prev => [...prev, {
                      id: newId,
                      page: currentPage,
                      x: pos.x,
                      y: pos.y, // This is baseline. We might want to move UP by height?
                      // If y is baseline, and image draws from top-left (in PDF coords?)
                      // PDF coords: x, y is bottom-left usually.
                      // But my render logic:
                      // const top = (originalHeight - y - height) * scaleY
                      // So 'y' is bottom-left of image in PDF space.
                      // Text 'y' is baseline.
                      // So placing signature at 'y' puts bottom of signature at text baseline.
                      // This is correct.
                      imageData: smartImage,
                      width: width,
                      height: height,
                    }]);
                  };
                  img.src = smartImage;
                } else if (pos.keyword === 'place') {
                  const newId = Date.now().toString() + Math.random();
                  setTextAnnotations(prev => [...prev, {
                    id: newId,
                    page: currentPage,
                    x: pos.x,
                    y: pos.y,
                    text: "Berlin, Germany", // Hardcoded or ask user?
                    fontSize: 12,
                    color: { r: 0, g: 0, b: 0 }
                  }]);
                }
              });

              setShowSmartDialog(false);
              setSmartCommand('');
              setSmartImage(null);
            }}
          >
            Run Magic Actions
          </button>
        </div>
      )}

      {/* PDF Viewer Wrapper to handle scroll area for zoomed content */}
      <div
        className="flex justify-center"
        style={{
          width: pageDimensions ? pageDimensions.width * zoom : 'auto',
          height: pageDimensions ? pageDimensions.height * zoom : 'auto',
          minWidth: '100%',
        }}
      >
        <div
          ref={pageContainerRef}
          onClick={handlePageClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative inline-block shadow-2xl ${resizeState
            ? resizeState.corner === 'nw' || resizeState.corner === 'se'
              ? 'cursor-nwse-resize'
              : 'cursor-nesw-resize'
            : editMode === 'image'
              ? 'cursor-crosshair'
              : dragState
                ? 'cursor-grabbing'
                : 'cursor-default'
            }`}
          style={{
            isolation: 'isolate',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
              <Page
                pageNumber={currentPage}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={onPageLoadSuccess}
                className="border border-gray-300"
              />
            </Document>
          </div>

          {/* Show text annotations on current page */}
          {textAnnotations
            .filter((a) => a.page === currentPage)
            .map((annotation) => {
              // Convert PDF coordinates to screen coordinates
              if (!pageDimensions) return null;

              const scaleX = pageDimensions.width / pageDimensions.originalWidth;
              const scaleY = pageDimensions.height / pageDimensions.originalHeight;

              const left = annotation.x * scaleX;
              // PDF Y is from bottom. Screen Y is top.
              // top + height = (originalHeight - y) * scaleY -> That's confusing.
              // y (PDF) is bottom of text.
              // top (Screen) = (originalHeight - y - fontSize) * scaleY
              // Wait, fontSize is in points. It also scales.
              const scaledFontSize = annotation.fontSize * scaleY;
              const top = (pageDimensions.originalHeight - annotation.y - annotation.fontSize) * scaleY;

              const isSelected = selectedAnnotation?.type === 'text' && selectedAnnotation?.id === annotation.id;
              const isEditing = editingTextId === annotation.id;

              return (
                <div
                  key={`text-${annotation.id}`}
                  className={`absolute group ${isEditing ? 'select-text' : 'select-none'
                    } ${editMode === 'select'
                      ? isSelected
                        ? 'cursor-move outline outline-3 outline-red-500'
                        : 'cursor-pointer hover:outline hover:outline-2 hover:outline-red-300'
                      : ''
                    }`}
                  style={{
                    left: left,
                    top: top,
                    fontSize: scaledFontSize,
                    color: `rgb(${annotation.color.r * 255}, ${annotation.color.g * 255}, ${annotation.color.b * 255})`,
                    userSelect: isEditing ? 'text' : 'none',
                    zIndex: isSelected ? 20 : 10,
                    minWidth: '50px',
                  }}
                  onClick={(e) => handleAnnotationClick(e, 'text', annotation.id)}
                  onDoubleClick={(e) => handleAnnotationDoubleClick(e, 'text', annotation.id)}
                  onMouseDown={(e) => {
                    if (!isEditing) {
                      handleAnnotationMouseDown(e, 'text', annotation.id);
                    }
                  }}
                >
                  {isEditing ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newText = e.currentTarget.textContent || 'change text';
                        setTextAnnotations((prev) =>
                          prev.map((ann) =>
                            ann.id === annotation.id
                              ? { ...ann, text: newText }
                              : ann
                          )
                        );
                        setEditingTextId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingTextId(null);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="outline-none bg-white/80 px-1 rounded"
                      autoFocus
                      style={{
                        minWidth: '50px',
                        display: 'inline-block',
                      }}
                    >
                      {annotation.text}
                    </div>
                  ) : (
                    annotation.text
                  )}
                  {editMode === 'select' && !isEditing && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation('text', annotation.id);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

          {/* Show image annotations on current page */}
          {imageAnnotations
            .filter((a) => a.page === currentPage)
            .map((annotation) => {
              if (!pageDimensions) return null;

              const scaleX = pageDimensions.width / pageDimensions.originalWidth;
              const scaleY = pageDimensions.height / pageDimensions.originalHeight;

              const left = annotation.x * scaleX;
              const top = (pageDimensions.originalHeight - annotation.y - annotation.height) * scaleY;

              const scaledWidth = annotation.width * scaleX;
              const scaledHeight = annotation.height * scaleY;

              const isSelected = selectedAnnotation?.type === 'image' && selectedAnnotation?.id === annotation.id;

              return (
                <div
                  key={`img-${annotation.id}`}
                  className={`absolute group select-none ${editMode === 'select'
                    ? isSelected
                      ? 'cursor-move'
                      : 'cursor-pointer'
                    : ''
                    }`}
                  style={{
                    left: left,
                    top: top,
                    userSelect: 'none',
                    zIndex: isSelected ? 20 : 10,
                  }}
                  onClick={(e) => handleAnnotationClick(e, 'image', annotation.id)}
                  onMouseDown={(e) =>
                    handleAnnotationMouseDown(
                      e,
                      'image',
                      annotation.id
                    )
                  }
                >
                  <img
                    src={annotation.imageData}
                    alt="annotation"
                    className={`${editMode === 'select'
                      ? isSelected
                        ? 'border-4 border-red-600'
                        : 'border-2 border-red-400 hover:border-red-500'
                      : 'border-2 border-red-400'
                      }`}
                    style={{
                      width: scaledWidth,
                      height: scaledHeight,
                    }}
                    draggable={false}
                  />
                  {/* Delete button */}
                  {editMode === 'select' && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation('image', annotation.id);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-30"
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                  {/* Resize handles - only show when selected */}
                  {editMode === 'select' && isSelected && (
                    <>
                      {/* NW corner */}
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize z-30"
                        style={{ top: -6, left: -6 }}
                        onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, 'nw')}
                      />
                      {/* NE corner */}
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize z-30"
                        style={{ top: -6, right: -6 }}
                        onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, 'ne')}
                      />
                      {/* SW corner */}
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize z-30"
                        style={{ bottom: -6, left: -6 }}
                        onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, 'sw')}
                      />
                      {/* SE corner */}
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize z-30"
                        style={{ bottom: -6, right: -6 }}
                        onMouseDown={(e) => handleResizeMouseDown(e, annotation.id, 'se')}
                      />
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Control Bar */}
      < div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 border border-gray-200 z-40" >
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
          Page {currentPage} / {numPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
      </div >
    </div >
  );
});

PDFEditor.displayName = 'PDFEditor';

export default PDFEditor;
