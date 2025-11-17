'use client';

import { X, MousePointer2, Type, Sparkles, Move, Trash2, Download } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-black text-white p-1 rounded-lg text-xs font-serif uppercase tracking-widest px-2 pt-1.5">Onyx</span>
                        Quick Start Guide
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 1: Basic Interactions */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Editing Basics</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg h-fit">
                                        <Move className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Move Items</p>
                                        <p className="text-xs text-gray-500">Single-click and drag any annotation to reposition it on the page.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="bg-green-50 p-2 rounded-lg h-fit">
                                        <Type className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Edit Text</p>
                                        <p className="text-xs text-gray-500">Double-click any text annotation to enter edit mode and change the content.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="bg-red-50 p-2 rounded-lg h-fit">
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Delete</p>
                                        <p className="text-xs text-gray-500">Select an item and press <kbd className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-[10px] font-sans">Del</kbd> or <kbd className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-[10px] font-sans">Backspace</kbd>.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Section 2: AI Features */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Magic / AI Tools</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="bg-purple-50 p-2 rounded-lg h-fit">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Smart AI Assistant</p>
                                        <p className="text-xs text-gray-500">Click the ✨ icon, then click the page. Use commands like "Sign and date here" to automate your work.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="bg-orange-50 p-2 rounded-lg h-fit">
                                        <MousePointer2 className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Smart Context</p>
                                        <p className="text-xs text-gray-500">Onyx analyzes the document to find labels like "Signature" or "Date" and snaps items to the correct lines.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="bg-gray-50 p-2 rounded-lg h-fit">
                                        <Download className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Final Export</p>
                                        <p className="text-xs text-gray-500">Click the Download button to save your document with all changes permanently embedded.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                        <p>© 2026 Onyx PDF Professional</p>
                        <div className="flex gap-4 font-medium uppercase tracking-widest">
                            <span>Precision</span>
                            <span>•</span>
                            <span>Speed</span>
                            <span>•</span>
                            <span>AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
