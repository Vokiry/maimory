import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Link as LinkIcon, 
  Settings, 
  Download, 
  Maximize2, 
  Minimize2, 
  Share2, 
  Layers, 
  Activity,
  FileCode,
  Check,
  ChevronDown
} from 'lucide-react';
import { MemoryEntity, GraphStatus } from '../../shared/types.js';
import { CATPPUCCIN_MOCHA, getEntityTypeColor } from '../../shared/catppuccin.js';

interface NavbarProps {
  status: GraphStatus | null;
  entities: MemoryEntity[];
  onOpenCreateEntity: () => void;
  onOpenCreateRelation: () => void;
  onOpenSettings: () => void;
  onSelectNode: (entity: MemoryEntity) => void;
  layoutMode: 'force' | 'radial' | 'td' | 'lr';
  onChangeLayout: (mode: 'force' | 'radial' | 'td' | 'lr') => void;
  onExportImage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  entities,
  onOpenCreateEntity,
  onOpenCreateRelation,
  onOpenSettings,
  onSelectNode,
  layoutMode,
  onChangeLayout,
  onExportImage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) {
        setLayoutMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter entities for autocomplete
  const searchResults = searchQuery.trim()
    ? entities
        .filter(e => 
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.observations.some(obs => obs.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const layoutLabels: Record<string, string> = {
    force: 'Force-Directed',
    radial: 'Radial Orbit',
    td: 'Top-Down Tree',
    lr: 'Left-Right Flow',
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-glass border border-mocha-surface1/50 transition-all hover:border-mocha-mauve/40">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-mocha-mauve to-mocha-sapphire flex items-center justify-center shadow-glow-mauve">
            <Sparkles className="w-4 h-4 text-mocha-crust" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-mocha-text font-mono">MAIMORY</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-mocha-surface0 text-mocha-mauve border border-mocha-mauve/30">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-mocha-subtext0 flex items-center gap-1.5">
              <span>MCP Knowledge Graph</span>
            </div>
          </div>
        </div>

        {/* Live File Connection Pill */}
        <button
          onClick={onOpenSettings}
          title={status?.filePath ? `File: ${status.filePath}` : 'Click to configure memory storage'}
          className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2.5 border border-mocha-surface1/40 hover:border-mocha-teal/50 transition-all text-xs text-mocha-subtext1 group cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            {status?.connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mocha-green opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                status?.connected ? 'bg-mocha-green' : 'bg-mocha-red'
              }`}
            ></span>
          </span>

          <span className="font-mono text-mocha-text truncate max-w-[160px] sm:max-w-[220px]">
            {status?.filePath ? status.filePath.split('/').pop() : 'Connecting...'}
          </span>

          <span className="text-[11px] text-mocha-overlay2 hidden md:inline">
            ({status?.entityCount || 0} nodes, {status?.relationCount || 0} links)
          </span>

          <Settings className="w-3.5 h-3.5 text-mocha-overlay1 group-hover:text-mocha-teal transition-colors" />
        </button>
      </div>

      {/* Center Search Bar */}
      <div ref={searchRef} className="relative pointer-events-auto w-72 sm:w-80 md:w-96 hidden sm:block">
        <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2.5 border border-mocha-surface1/50 focus-within:border-mocha-mauve/70 focus-within:shadow-glow-mauve transition-all">
          <Search className="w-4 h-4 text-mocha-overlay1" />
          <input
            type="text"
            placeholder="Search entities, types, observations..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="bg-transparent text-xs text-mocha-text placeholder-mocha-overlay0 focus:outline-none w-full font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="text-mocha-overlay1 hover:text-mocha-text text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Autocomplete Results Dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-xl border border-mocha-surface1/70 shadow-2xl overflow-hidden py-1 max-h-72 overflow-y-auto">
            {searchResults.map(ent => (
              <div
                key={ent.name}
                onClick={() => {
                  onSelectNode(ent);
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="px-3.5 py-2.5 hover:bg-mocha-surface0/60 cursor-pointer flex items-center justify-between gap-2 border-b border-mocha-surface0/30 last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getEntityTypeColor(ent.entityType) }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-mocha-text truncate">{ent.name}</div>
                    <div className="text-[10px] text-mocha-subtext0 truncate">
                      {ent.observations[0] || 'No observations'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mocha-surface1/50 text-mocha-subtext1 flex-shrink-0">
                  {ent.entityType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Layout Switcher Dropdown */}
        <div ref={layoutRef} className="relative">
          <button
            onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
            className="glass-panel px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-mocha-subtext1 hover:text-mocha-text border border-mocha-surface1/40 hover:border-mocha-mauve/40 transition-all cursor-pointer"
            title="Switch Layout"
          >
            <Layers className="w-3.5 h-3.5 text-mocha-mauve" />
            <span className="hidden lg:inline">{layoutLabels[layoutMode]}</span>
            <ChevronDown className="w-3 h-3 text-mocha-overlay1" />
          </button>

          {layoutMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 glass-panel rounded-xl border border-mocha-surface1/70 shadow-2xl py-1 overflow-hidden">
              {(['force', 'radial', 'td', 'lr'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    onChangeLayout(mode);
                    setLayoutMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-mocha-surface0/60 transition-colors ${
                    layoutMode === mode ? 'text-mocha-mauve font-medium bg-mocha-surface0/30' : 'text-mocha-subtext1'
                  }`}
                >
                  <span>{layoutLabels[mode]}</span>
                  {layoutMode === mode && <Check className="w-3.5 h-3.5 text-mocha-mauve" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Entity Button */}
        <button
          onClick={onOpenCreateEntity}
          className="px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-mocha-crust bg-gradient-to-r from-mocha-mauve to-mocha-sapphire hover:brightness-110 shadow-glow-mauve transition-all cursor-pointer border border-mocha-mauve/40"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Entity</span>
        </button>

        {/* Add Relation Button */}
        <button
          onClick={onOpenCreateRelation}
          className="glass-panel px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-medium text-mocha-text bg-mocha-surface0/80 hover:bg-mocha-surface1 border border-mocha-surface1/70 hover:border-mocha-lavender/50 transition-all cursor-pointer"
        >
          <LinkIcon className="w-3.5 h-3.5 text-mocha-lavender" />
          <span className="hidden sm:inline">Relation</span>
        </button>

        {/* Export Dropdown */}
        <div ref={exportRef} className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="glass-panel p-2 rounded-xl text-mocha-subtext1 hover:text-mocha-text border border-mocha-surface1/40 hover:border-mocha-peach/40 transition-all cursor-pointer"
            title="Export Graph"
          >
            <Download className="w-4 h-4 text-mocha-peach" />
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl border border-mocha-surface1/70 shadow-2xl py-1 overflow-hidden">
              <button
                onClick={() => {
                  onExportImage();
                  setExportMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-mocha-surface0/60 text-mocha-subtext1 hover:text-mocha-text transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-mocha-teal" />
                <span>Save PNG Snapshot</span>
              </button>
              <a
                href="/api/export?format=json"
                download="memory.json"
                onClick={() => setExportMenuOpen(false)}
                className="w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-mocha-surface0/60 text-mocha-subtext1 hover:text-mocha-text transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-mocha-blue" />
                <span>Download memory.json</span>
              </a>
              <a
                href="/api/export?format=jsonl"
                download="memory.jsonl"
                onClick={() => setExportMenuOpen(false)}
                className="w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-mocha-surface0/60 text-mocha-subtext1 hover:text-mocha-text transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-mocha-lavender" />
                <span>Download memory.jsonl</span>
              </a>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="glass-panel p-2 rounded-xl text-mocha-subtext1 hover:text-mocha-text border border-mocha-surface1/40 hover:border-mocha-mauve/40 transition-all cursor-pointer"
          title="Memory Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="glass-panel p-2 rounded-xl text-mocha-subtext1 hover:text-mocha-text border border-mocha-surface1/40 hover:border-mocha-mauve/40 transition-all cursor-pointer hidden md:flex"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
