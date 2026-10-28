import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Plus, ArrowRight } from 'lucide-react';
import { MemoryEntity, MemoryRelation } from '../../shared/types.js';

interface CreateRelationModalProps {
  isOpen: boolean;
  initialSource?: string | null;
  entities: MemoryEntity[];
  onClose: () => void;
  onSubmit: (relation: MemoryRelation) => Promise<void>;
}

const PRESET_RELATIONS = [
  'tracksEvolutionOf',
  'recordsCommitsAcross',
  'fulfillsPhasesOf',
  'dependsOn',
  'implements',
  'configures',
  'references',
  'integratesWith',
  'tests',
  'documents',
];

export const CreateRelationModal: React.FC<CreateRelationModalProps> = ({
  isOpen,
  initialSource,
  entities,
  onClose,
  onSubmit,
}) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [relationType, setRelationType] = useState('tracksEvolutionOf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSource) {
      setFrom(initialSource);
    } else if (entities.length > 0 && !from) {
      setFrom(entities[0].name);
    }
    if (entities.length > 1 && !to) {
      setTo(entities.find(e => e.name !== (initialSource || entities[0].name))?.name || entities[1].name);
    }
  }, [initialSource, entities]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !relationType.trim()) {
      setError('Source, target, and relation type are required');
      return;
    }
    if (from === to) {
      setError('Source and target entity cannot be the same');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        from,
        to,
        relationType: relationType.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create relation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mocha-crust/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-mocha-surface1 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mocha-surface1/50 bg-mocha-surface0/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-mocha-lavender/20 border border-mocha-lavender/40 flex items-center justify-center text-mocha-lavender">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-mocha-text font-mono">Create Knowledge Relation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-mocha-red/10 border border-mocha-red/30 text-mocha-red text-xs">
              {error}
            </div>
          )}

          {/* Visual Link Flow Card */}
          <div className="bg-mocha-surface0/50 p-3 rounded-xl border border-mocha-surface1/40 flex items-center justify-between text-xs font-mono">
            <span className="text-mocha-mauve font-semibold truncate max-w-[130px]">{from || 'Source'}</span>
            <div className="flex items-center gap-1 text-[11px] text-mocha-subtext0">
              <ArrowRight className="w-3.5 h-3.5 text-mocha-lavender" />
              <span className="text-mocha-lavender font-medium">{relationType || 'relation'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-mocha-lavender" />
            </div>
            <span className="text-mocha-sapphire font-semibold truncate max-w-[130px]">{to || 'Target'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* From Source */}
            <div>
              <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">
                From (Source Entity)
              </label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full bg-mocha-surface0/70 border border-mocha-surface1/60 focus:border-mocha-mauve rounded-xl px-3 py-2 text-xs text-mocha-text focus:outline-none transition-all font-mono"
              >
                {entities.map(e => (
                  <option key={e.name} value={e.name} className="bg-mocha-mantle text-mocha-text">
                    {e.name} ({e.entityType})
                  </option>
                ))}
              </select>
            </div>

            {/* To Target */}
            <div>
              <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">
                To (Target Entity)
              </label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full bg-mocha-surface0/70 border border-mocha-surface1/60 focus:border-mocha-sapphire rounded-xl px-3 py-2 text-xs text-mocha-text focus:outline-none transition-all font-mono"
              >
                {entities.map(e => (
                  <option key={e.name} value={e.name} className="bg-mocha-mantle text-mocha-text">
                    {e.name} ({e.entityType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Relation Type */}
          <div>
            <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">
              Relation Type (active voice)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. tracksEvolutionOf"
              value={relationType}
              onChange={e => setRelationType(e.target.value)}
              className="w-full bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-lavender rounded-xl px-3.5 py-2.5 text-xs text-mocha-text placeholder-mocha-overlay0 focus:outline-none transition-all font-mono mb-2"
            />

            {/* Preset Relation Suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_RELATIONS.map(rel => (
                <button
                  type="button"
                  key={rel}
                  onClick={() => setRelationType(rel)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                    relationType === rel
                      ? 'border-mocha-lavender text-mocha-text bg-mocha-surface1'
                      : 'border-mocha-surface1/40 text-mocha-subtext0 hover:border-mocha-surface1 hover:text-mocha-text bg-mocha-surface0/40'
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-mocha-surface1/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-mocha-subtext1 hover:text-mocha-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !from || !to || from === to}
              className="px-4 py-2 rounded-xl text-xs font-medium text-mocha-crust bg-mocha-lavender hover:bg-mocha-lavender/90 shadow-glow-mauve disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{loading ? 'Linking...' : 'Create Relation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
