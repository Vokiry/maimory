import React, { useState } from 'react';
import { 
  Filter, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Sparkles, 
  Network,
  BookOpen,
  Zap
} from 'lucide-react';
import { MemoryEntity, MemoryRelation } from '../../shared/types.js';
import { getEntityTypeColor } from '../../shared/catppuccin.js';

interface SidebarFilterProps {
  entities: MemoryEntity[];
  relations: MemoryRelation[];
  selectedEntity: MemoryEntity | null;
  onSelectNode: (entity: MemoryEntity) => void;
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onClearTypeFilters: () => void;
  minDegree: number;
  onChangeMinDegree: (degree: number) => void;
  showParticles: boolean;
  onToggleParticles: () => void;
  particleSpeed: number;
  onChangeParticleSpeed: (speed: number) => void;
  repulsionForce: number;
  onChangeRepulsionForce: (force: number) => void;
  linkDistance: number;
  onChangeLinkDistance: (dist: number) => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  entities,
  relations,
  selectedEntity,
  onSelectNode,
  selectedTypes,
  onToggleType,
  onClearTypeFilters,
  minDegree,
  onChangeMinDegree,
  showParticles,
  onToggleParticles,
  particleSpeed,
  onChangeParticleSpeed,
  repulsionForce,
  onChangeRepulsionForce,
  linkDistance,
  onChangeLinkDistance,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'filter' | 'nodes' | 'physics'>('filter');

  // Compute entity type counts
  const typeCounts = entities.reduce((acc, curr) => {
    acc[curr.entityType] = (acc[curr.entityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typesList = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const totalObservations = entities.reduce((sum, e) => sum + (e.observations?.length || 0), 0);

  return (
    <aside
      className={`absolute left-4 top-20 z-20 transition-all duration-300 ease-in-out ${
        collapsed ? 'translate-x-[-120%] pointer-events-none' : 'translate-x-0 pointer-events-auto'
      }`}
    >
      <div className="w-64 md:w-72 glass-panel rounded-2xl border border-mocha-surface1/60 shadow-glass overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-mocha-surface1/50 bg-mocha-surface0/30">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('filter')}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'filter'
                  ? 'bg-mocha-mauve/20 text-mocha-mauve border border-mocha-mauve/30'
                  : 'text-mocha-subtext0 hover:text-mocha-text'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'nodes'
                  ? 'bg-mocha-sapphire/20 text-mocha-sapphire border border-mocha-sapphire/30'
                  : 'text-mocha-subtext0 hover:text-mocha-text'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Nodes</span>
            </button>
            <button
              onClick={() => setActiveTab('physics')}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'physics'
                  ? 'bg-mocha-teal/20 text-mocha-teal border border-mocha-teal/30'
                  : 'text-mocha-subtext0 hover:text-mocha-text'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Physics</span>
            </button>
          </div>

          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-mocha-surface1/50 text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Filters & Statistics */}
        {activeTab === 'filter' && (
          <div className="p-4 overflow-y-auto space-y-4">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-mocha-surface0/50 p-2 rounded-xl border border-mocha-surface1/40 text-center">
                <div className="text-base font-bold font-mono text-mocha-mauve">{entities.length}</div>
                <div className="text-[10px] uppercase font-mono text-mocha-subtext0">Entities</div>
              </div>
              <div className="bg-mocha-surface0/50 p-2 rounded-xl border border-mocha-surface1/40 text-center">
                <div className="text-base font-bold font-mono text-mocha-sapphire">{relations.length}</div>
                <div className="text-[10px] uppercase font-mono text-mocha-subtext0">Relations</div>
              </div>
              <div className="bg-mocha-surface0/50 p-2 rounded-xl border border-mocha-surface1/40 text-center">
                <div className="text-base font-bold font-mono text-mocha-peach">{totalObservations}</div>
                <div className="text-[10px] uppercase font-mono text-mocha-subtext0">Obs</div>
              </div>
            </div>

            {/* Entity Types Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-mocha-text flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-mocha-mauve" />
                  Entity Types
                </span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={onClearTypeFilters}
                    className="text-[11px] text-mocha-mauve hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {typesList.map(([type, count]) => {
                  const isSelected = selectedTypes.includes(type);
                  const color = getEntityTypeColor(type);
                  return (
                    <button
                      key={type}
                      onClick={() => onToggleType(type)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-mocha-surface1 border-mocha-mauve text-mocha-text shadow-sm'
                          : 'bg-mocha-surface0/40 border-mocha-surface1/30 text-mocha-subtext1 hover:border-mocha-surface1 hover:text-mocha-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{type}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-mocha-surface1/60 text-mocha-subtext0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Degree slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-mocha-subtext1">Min Connections:</span>
                <span className="font-mono text-mocha-teal font-semibold">{minDegree}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={minDegree}
                onChange={e => onChangeMinDegree(parseInt(e.target.value, 10))}
                className="w-full accent-mocha-teal bg-mocha-surface1 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-mocha-overlay1 mt-1">
                <span>0 (All)</span>
                <span>5+ (Hubs)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Nodes List */}
        {activeTab === 'nodes' && (
          <div className="p-3 overflow-y-auto space-y-1.5 max-h-[calc(100vh-210px)]">
            <div className="text-[11px] font-mono text-mocha-overlay1 uppercase mb-2 px-1">
              All Project Entities ({entities.length})
            </div>
            {entities.map(ent => {
              const isSelected = selectedEntity?.name === ent.name;
              const color = getEntityTypeColor(ent.entityType);
              return (
                <button
                  key={ent.name}
                  onClick={() => onSelectNode(ent)}
                  className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-mocha-surface1 border-mocha-mauve shadow-glow-mauve'
                      : 'bg-mocha-surface0/40 border-mocha-surface1/30 hover:border-mocha-surface1 hover:bg-mocha-surface0/70'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-mocha-text truncate">{ent.name}</div>
                      <div className="text-[10px] text-mocha-subtext0 truncate">{ent.entityType}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-mocha-surface1 text-mocha-peach flex-shrink-0">
                    {ent.observations.length} obs
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Physics Controls */}
        {activeTab === 'physics' && (
          <div className="p-4 overflow-y-auto space-y-4">
            {/* Particles Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-mocha-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-mocha-yellow" />
                Flow Particles
              </span>
              <button
                onClick={onToggleParticles}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  showParticles ? 'bg-mocha-yellow' : 'bg-mocha-surface1'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-mocha-crust transition-transform ${
                    showParticles ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {showParticles && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-mocha-subtext1">Particle Speed:</span>
                  <span className="font-mono text-mocha-yellow font-semibold">
                    {Math.round(particleSpeed * 1000)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.015"
                  step="0.001"
                  value={particleSpeed}
                  onChange={e => onChangeParticleSpeed(parseFloat(e.target.value))}
                  className="w-full accent-mocha-yellow bg-mocha-surface1 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Repulsion Force */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-mocha-subtext1">Node Repulsion:</span>
                <span className="font-mono text-mocha-peach font-semibold">{repulsionForce}</span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="25"
                value={repulsionForce}
                onChange={e => onChangeRepulsionForce(parseInt(e.target.value, 10))}
                className="w-full accent-mocha-peach bg-mocha-surface1 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Link Distance */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-mocha-subtext1">Link Distance:</span>
                <span className="font-mono text-mocha-lavender font-semibold">{linkDistance}px</span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                step="10"
                value={linkDistance}
                onChange={e => onChangeLinkDistance(parseInt(e.target.value, 10))}
                className="w-full accent-mocha-lavender bg-mocha-surface1 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Expand Button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute left-0 top-0 glass-panel p-2.5 rounded-xl border border-mocha-surface1/60 shadow-glass text-mocha-subtext0 hover:text-mocha-mauve transition-all pointer-events-auto cursor-pointer"
          title="Open Filters & Physics"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </aside>
  );
};
