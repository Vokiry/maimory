import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowRight, 
  Link as LinkIcon, 
  Tag, 
  BookOpen, 
  Share2, 
  Check, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { MemoryEntity, MemoryRelation } from '../../shared/types.js';
import { getEntityTypeColor } from '../../shared/catppuccin.js';

interface EntityInspectorProps {
  entity: MemoryEntity | null;
  relation: MemoryRelation | null;
  allEntities: MemoryEntity[];
  allRelations: MemoryRelation[];
  onClose: () => void;
  onSelectNode: (entity: MemoryEntity) => void;
  onAddObservation: (entityName: string, text: string) => Promise<void>;
  onDeleteObservation: (entityName: string, index: number) => Promise<void>;
  onUpdateObservation: (entityName: string, index: number, text: string) => Promise<void>;
  onDeleteEntity: (entityName: string) => Promise<void>;
  onDeleteRelation: (relation: MemoryRelation) => Promise<void>;
  onOpenCreateRelationWithSource: (sourceName: string) => void;
  onOpenEditEntity: (entity: MemoryEntity) => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  entity,
  relation,
  allEntities,
  allRelations,
  onClose,
  onSelectNode,
  onAddObservation,
  onDeleteObservation,
  onUpdateObservation,
  onDeleteEntity,
  onDeleteRelation,
  onOpenCreateRelationWithSource,
  onOpenEditEntity,
}) => {
  const [newObsText, setNewObsText] = useState('');
  const [isAddingObs, setIsAddingObs] = useState(false);
  const [editingObsIndex, setEditingObsIndex] = useState<number | null>(null);
  const [editingObsText, setEditingObsText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!entity && !relation) return null;

  // Relation Selected View
  if (relation && !entity) {
    const fromEntity = allEntities.find(e => e.name === relation.from);
    const toEntity = allEntities.find(e => e.name === relation.to);

    return (
      <aside className="absolute right-4 top-20 z-20 w-80 md:w-96 glass-panel rounded-2xl border border-mocha-surface1/60 shadow-glass overflow-hidden flex flex-col pointer-events-auto max-h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-mocha-surface1/50 bg-mocha-surface0/40">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-mocha-mauve" />
            <span className="text-xs font-semibold text-mocha-text uppercase tracking-wider font-mono">
              Relation Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-mocha-surface1/60 text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-mocha-surface0/60 p-3 rounded-xl border border-mocha-surface1/40 flex items-center justify-between gap-2">
            <button
              onClick={() => fromEntity && onSelectNode(fromEntity)}
              className="text-left font-semibold text-xs text-mocha-text hover:text-mocha-mauve transition-colors truncate max-w-[110px]"
            >
              {relation.from}
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mocha-surface1 text-mocha-mauve border border-mocha-mauve/30">
                {relation.relationType}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-mocha-overlay1 mt-0.5" />
            </div>
            <button
              onClick={() => toEntity && onSelectNode(toEntity)}
              className="text-right font-semibold text-xs text-mocha-text hover:text-mocha-sapphire transition-colors truncate max-w-[110px]"
            >
              {relation.to}
            </button>
          </div>

          <button
            onClick={() => onDeleteRelation(relation)}
            className="w-full py-2 px-3 rounded-xl bg-mocha-red/10 border border-mocha-red/30 hover:bg-mocha-red/20 text-mocha-red text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Relation</span>
          </button>
        </div>
      </aside>
    );
  }

  if (!entity) return null;

  // Entity Details
  const entityColor = getEntityTypeColor(entity.entityType);
  const outgoingRelations = allRelations.filter(r => r.from === entity.name);
  const incomingRelations = allRelations.filter(r => r.to === entity.name);

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObsText.trim()) return;
    setIsAddingObs(true);
    try {
      await onAddObservation(entity.name, newObsText.trim());
      setNewObsText('');
    } finally {
      setIsAddingObs(false);
    }
  };

  const handleSaveObservationEdit = async (index: number) => {
    if (!editingObsText.trim()) return;
    await onUpdateObservation(entity.name, index, editingObsText.trim());
    setEditingObsIndex(null);
  };

  const copyEntityJson = () => {
    navigator.clipboard.writeText(JSON.stringify(entity, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="absolute right-4 top-20 z-20 w-80 md:w-96 glass-panel rounded-2xl border border-mocha-surface1/60 shadow-glass overflow-hidden flex flex-col pointer-events-auto max-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3.5 border-b border-mocha-surface1/50 bg-mocha-surface0/30">
        <div className="overflow-hidden pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entityColor }}
            />
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${entityColor}15`,
                borderColor: `${entityColor}40`,
                color: entityColor,
              }}
            >
              {entity.entityType}
            </span>
          </div>
          <h2 className="text-sm font-bold text-mocha-text truncate" title={entity.name}>
            {entity.name}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyEntityJson}
            className="p-1 rounded-lg hover:bg-mocha-surface1/60 text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
            title="Copy JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-mocha-green" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onOpenEditEntity(entity)}
            className="p-1 rounded-lg hover:bg-mocha-surface1/60 text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
            title="Edit Entity"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-mocha-surface1/60 text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 overflow-y-auto space-y-4">
        {/* Observations List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-mocha-text flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-mocha-peach" />
              Observations ({entity.observations.length})
            </span>
          </div>

          <div className="space-y-2">
            {entity.observations.map((obs, index) => (
              <div
                key={index}
                className="group bg-mocha-surface0/60 p-2.5 rounded-xl border border-mocha-surface1/40 hover:border-mocha-surface1 transition-all"
              >
                {editingObsIndex === index ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingObsText}
                      onChange={e => setEditingObsText(e.target.value)}
                      className="w-full bg-mocha-surface1/60 text-mocha-text text-xs p-2 rounded-lg border border-mocha-mauve/50 focus:outline-none resize-none h-20"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingObsIndex(null)}
                        className="px-2 py-1 rounded text-[11px] text-mocha-subtext0 hover:text-mocha-text"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveObservationEdit(index)}
                        className="px-2.5 py-1 rounded bg-mocha-mauve text-mocha-crust font-medium text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-mocha-subtext1 leading-relaxed whitespace-pre-wrap">
                      {obs}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingObsIndex(index);
                          setEditingObsText(obs);
                        }}
                        className="p-1 text-mocha-overlay1 hover:text-mocha-mauve transition-colors"
                        title="Edit observation"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteObservation(entity.name, index)}
                        className="p-1 text-mocha-overlay1 hover:text-mocha-red transition-colors"
                        title="Delete observation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Inline Add Observation Form */}
            <form onSubmit={handleAddObservation} className="mt-2 space-y-2">
              <textarea
                placeholder="Add a new observation to this entity..."
                value={newObsText}
                onChange={e => setNewObsText(e.target.value)}
                className="w-full bg-mocha-surface0/40 border border-mocha-surface1/50 focus:border-mocha-peach/60 rounded-xl p-2.5 text-xs text-mocha-text placeholder-mocha-overlay0 focus:outline-none resize-none h-18 transition-all"
              />
              <button
                type="submit"
                disabled={isAddingObs || !newObsText.trim()}
                className="w-full py-1.5 px-3 rounded-xl bg-mocha-surface1 hover:bg-mocha-surface2 disabled:opacity-50 text-mocha-peach font-medium text-xs flex items-center justify-center gap-1.5 border border-mocha-peach/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Observation</span>
              </button>
            </form>
          </div>
        </div>

        {/* Connected Relations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-mocha-text flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-mocha-lavender" />
              Relations ({outgoingRelations.length + incomingRelations.length})
            </span>
            <button
              onClick={() => onOpenCreateRelationWithSource(entity.name)}
              className="text-[11px] text-mocha-lavender hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Connect
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {/* Outgoing */}
            {outgoingRelations.map(rel => {
              const targetEnt = allEntities.find(e => e.name === rel.to);
              return (
                <div
                  key={`${rel.from}-${rel.relationType}-${rel.to}`}
                  className="group flex items-center justify-between gap-1.5 p-2 rounded-xl bg-mocha-surface0/40 border border-mocha-surface1/30 text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-mocha-overlay1">➔</span>
                    <span className="font-mono text-[10px] text-mocha-mauve bg-mocha-surface1/50 px-1.5 py-0.5 rounded">
                      {rel.relationType}
                    </span>
                    <button
                      onClick={() => targetEnt && onSelectNode(targetEnt)}
                      className="font-medium text-mocha-text hover:text-mocha-lavender truncate cursor-pointer underline-offset-2 hover:underline"
                    >
                      {rel.to}
                    </button>
                  </div>
                  <button
                    onClick={() => onDeleteRelation(rel)}
                    className="p-1 text-mocha-overlay1 hover:text-mocha-red opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove relation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Incoming */}
            {incomingRelations.map(rel => {
              const sourceEnt = allEntities.find(e => e.name === rel.from);
              return (
                <div
                  key={`${rel.from}-${rel.relationType}-${rel.to}`}
                  className="group flex items-center justify-between gap-1.5 p-2 rounded-xl bg-mocha-surface0/40 border border-mocha-surface1/30 text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-mocha-overlay1">⬅</span>
                    <span className="font-mono text-[10px] text-mocha-blue bg-mocha-surface1/50 px-1.5 py-0.5 rounded">
                      {rel.relationType}
                    </span>
                    <button
                      onClick={() => sourceEnt && onSelectNode(sourceEnt)}
                      className="font-medium text-mocha-text hover:text-mocha-blue truncate cursor-pointer underline-offset-2 hover:underline"
                    >
                      {rel.from}
                    </button>
                  </div>
                  <button
                    onClick={() => onDeleteRelation(rel)}
                    className="p-1 text-mocha-overlay1 hover:text-mocha-red opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove relation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {outgoingRelations.length === 0 && incomingRelations.length === 0 && (
              <div className="text-[11px] text-mocha-overlay1 italic py-1">
                No active connections. Click "+ Connect" to link with other entities.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-mocha-surface1/50 bg-mocha-surface0/20 flex items-center gap-2">
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete entity "${entity.name}" and its relations?`)) {
              onDeleteEntity(entity.name);
            }
          }}
          className="w-full py-2 px-3 rounded-xl bg-mocha-red/10 border border-mocha-red/30 hover:bg-mocha-red/20 text-mocha-red text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Entity</span>
        </button>
      </div>
    </aside>
  );
};
