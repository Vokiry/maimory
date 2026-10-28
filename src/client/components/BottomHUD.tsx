import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Play, 
  Pause, 
  HelpCircle, 
  X,
  Palette
} from 'lucide-react';
import { ENTITY_TYPE_COLORS } from '../../shared/catppuccin.js';

interface BottomHUDProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetView: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const BottomHUD: React.FC<BottomHUDProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  isPaused,
  onTogglePause,
}) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <>
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="glass-panel px-3 py-1.5 rounded-2xl border border-mocha-surface1/60 shadow-glass flex items-center gap-1.5 text-mocha-subtext1">
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded-xl hover:bg-mocha-surface0 hover:text-mocha-text transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded-xl hover:bg-mocha-surface0 hover:text-mocha-text transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onFitView}
            className="p-1.5 rounded-xl hover:bg-mocha-surface0 hover:text-mocha-teal transition-colors cursor-pointer"
            title="Fit to Screen (F)"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 rounded-xl hover:bg-mocha-surface0 hover:text-mocha-text transition-colors cursor-pointer"
            title="Reset Zoom (1:1)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-mocha-surface1/60 mx-1" />

          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isPaused
                ? 'bg-mocha-yellow/20 text-mocha-yellow'
                : 'hover:bg-mocha-surface0 hover:text-mocha-text'
            }`}
            title={isPaused ? 'Resume Simulation (Space)' : 'Pause Simulation (Space)'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="w-[1px] h-4 bg-mocha-surface1/60 mx-1" />

          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              legendOpen ? 'bg-mocha-mauve/20 text-mocha-mauve' : 'hover:bg-mocha-surface0 hover:text-mocha-text'
            }`}
            title="Palette Legend"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            onClick={() => setHelpOpen(true)}
            className="p-1.5 rounded-xl hover:bg-mocha-surface0 hover:text-mocha-sapphire transition-colors cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Palette Legend Drawer */}
      {legendOpen && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 glass-panel p-3.5 rounded-2xl border border-mocha-surface1/60 shadow-glass w-80 max-w-[90vw] pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-mocha-text">Catppuccin Semantic Types</span>
            <button
              onClick={() => setLegendOpen(false)}
              className="text-mocha-overlay1 hover:text-mocha-text text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(ENTITY_TYPE_COLORS).slice(0, 10).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-mocha-subtext1 text-[11px] truncate">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortcuts Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mocha-crust/70 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-mocha-surface1 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-mocha-surface1/50 pb-2">
              <span className="text-xs font-bold text-mocha-text uppercase font-mono">Keyboard Shortcuts</span>
              <button
                onClick={() => setHelpOpen(false)}
                className="text-mocha-overlay1 hover:text-mocha-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-mocha-subtext1">Search</span>
                <kbd className="px-2 py-0.5 rounded bg-mocha-surface1 font-mono text-[10px] text-mocha-text border border-mocha-surface2">
                  /
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mocha-subtext1">Fit to Screen</span>
                <kbd className="px-2 py-0.5 rounded bg-mocha-surface1 font-mono text-[10px] text-mocha-text border border-mocha-surface2">
                  F
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mocha-subtext1">Pause / Resume Physics</span>
                <kbd className="px-2 py-0.5 rounded bg-mocha-surface1 font-mono text-[10px] text-mocha-text border border-mocha-surface2">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mocha-subtext1">Deselect / Close Panels</span>
                <kbd className="px-2 py-0.5 rounded bg-mocha-surface1 font-mono text-[10px] text-mocha-text border border-mocha-surface2">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mocha-subtext1">Select & Fly to Node</span>
                <span className="text-mocha-subtext0 text-[11px]">Click Node</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mocha-subtext1">Pan & Rotate</span>
                <span className="text-mocha-subtext0 text-[11px]">Drag Canvas</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
