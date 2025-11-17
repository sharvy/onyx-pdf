'use client';

import {
  LayoutGrid,
  Move,
  Undo,
  Redo,
  Type,
  Edit3,
  Eraser,
  Highlighter,
  Pencil,
  Image as ImageIcon,
  Circle,
  X,
  Check,
  PenTool,
  Link2,
  MoreHorizontal,
  FileText,
  Files,
} from 'lucide-react';

export type ToolType =
  | 'select'
  | 'move'
  | 'text'
  | 'edit-text'
  | 'eraser'
  | 'highlight'
  | 'pencil'
  | 'image'
  | 'ellipse'
  | 'cross'
  | 'check'
  | 'sign'
  | 'annotations'
  | 'links'
  | 'more'
  | 'magic';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPageLayout?: () => void;
  onManagePages?: () => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${active
        ? 'bg-red-50 text-red-600'
        : 'text-gray-700 hover:bg-gray-100'
        }`}
      title={label}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onPageLayout,
  onManagePages,
}: ToolbarProps) {
  return (
    <div className="h-20 bg-white border-b border-gray-200 flex items-center px-4 overflow-x-auto">
      <div className="flex items-center gap-1">
        {/* Navigation Tools */}
        <ToolButton
          icon={<LayoutGrid className="w-5 h-5" />}
          label="Thumbnails"
          active={activeTool === 'select'}
          onClick={() => onToolChange('select')}
        />
        <ToolButton
          icon={<Move className="w-5 h-5" />}
          label="Move"
          active={activeTool === 'move'}
          onClick={() => onToolChange('move')}
        />
        <button
          onClick={onUndo}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-100"
          title="Undo"
        >
          <Undo className="w-5 h-5" />
          <span className="text-xs mt-1">Undo</span>
        </button>
        <button
          onClick={onRedo}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-100"
          title="Redo"
        >
          <Redo className="w-5 h-5" />
          <span className="text-xs mt-1">Redo</span>
        </button>

        <div className="w-px h-12 bg-gray-300 mx-2" />

        {/* Editing Tools */}
        <ToolButton
          icon={<Type className="w-5 h-5" />}
          label="Add Text"
          active={activeTool === 'text'}
          onClick={() => onToolChange('text')}
        />
        <ToolButton
          icon={<Edit3 className="w-5 h-5" />}
          label="Edit Text"
          active={activeTool === 'edit-text'}
          onClick={() => onToolChange('edit-text')}
        />
        <ToolButton
          icon={<Eraser className="w-5 h-5" />}
          label="Eraser"
          active={activeTool === 'eraser'}
          onClick={() => onToolChange('eraser')}
        />
        <ToolButton
          icon={<Highlighter className="w-5 h-5" />}
          label="Highlight"
          active={activeTool === 'highlight'}
          onClick={() => onToolChange('highlight')}
        />
        <ToolButton
          icon={<Pencil className="w-5 h-5" />}
          label="Pencil"
          active={activeTool === 'pencil'}
          onClick={() => onToolChange('pencil')}
        />
        <ToolButton
          icon={<ImageIcon className="w-5 h-5" />}
          label="Image"
          active={activeTool === 'image'}
          onClick={() => onToolChange('image')}
        />
        <ToolButton
          icon={<Circle className="w-5 h-5" />}
          label="Ellipse"
          active={activeTool === 'ellipse'}
          onClick={() => onToolChange('ellipse')}
        />
        <ToolButton
          icon={<X className="w-5 h-5" />}
          label="Cross"
          active={activeTool === 'cross'}
          onClick={() => onToolChange('cross')}
        />
        <ToolButton
          icon={<Check className="w-5 h-5" />}
          label="Check"
          active={activeTool === 'check'}
          onClick={() => onToolChange('check')}
        />
        <ToolButton
          icon={<PenTool className="w-5 h-5" />}
          label="Sign"
          active={activeTool === 'sign'}
          onClick={() => onToolChange('sign')}
        />

        <div className="w-px h-12 bg-gray-300 mx-2" />

        {/* Additional Tools */}
        <ToolButton
          icon={<FileText className="w-5 h-5" />}
          label="Annotations"
          active={activeTool === 'annotations'}
          onClick={() => onToolChange('annotations')}
        />
        <ToolButton
          icon={<Link2 className="w-5 h-5" />}
          label="Links"
          active={activeTool === 'links'}
          onClick={() => onToolChange('links')}
        />
        <ToolButton
          icon={<MoreHorizontal className="w-5 h-5" />}
          label="More tools"
          active={activeTool === 'more'}
          onClick={() => onToolChange('more')}
        />

        <div className="w-px h-12 bg-gray-300 mx-2" />

        <ToolButton
          icon={<span className="text-xl">✨</span>}
          label="AI Assistant"
          active={activeTool === 'magic'}
          onClick={() => onToolChange('magic')}
        />

        <div className="w-px h-12 bg-gray-300 mx-2" />

        {/* Page Tools */}
        <button
          onClick={onPageLayout}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-100"
          title="Page layout"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-xs mt-1">Page layout</span>
        </button>
        <button
          onClick={onManagePages}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors text-gray-700 hover:bg-gray-100"
          title="Manage Pages"
        >
          <Files className="w-5 h-5" />
          <span className="text-xs mt-1">Manage Pages</span>
        </button>
      </div>
    </div>
  );
}
