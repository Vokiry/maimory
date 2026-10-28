import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { MemoryEntity } from '../../shared/types.js';
import { getEntityTypeColor } from '../../shared/catppuccin.js';

interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entity: MemoryEntity) => Promise<void>;
  existingTypes: string[];
}

const PRESET_TYPES = [
  'SystemArchitecture',
  'TechnicalGotcha',
  'ProjectConstraint',
  'DevelopmentProcess',
  'ProjectRoadmap',
  'MilestoneTracker',
  'Feature',
  'Component',
  'Bug',
  'Decision',
  'Research',
];

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingTypes,
}) => {
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('SystemArchitecture');
  const [observationsRaw, setObservationsRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const mergedTypes = Array.from(new Set([...PRESET_TYPES, ...existingTypes]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Entity name is required');
      return;
    }

    const observations = observationsRaw
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean);

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        entityType: entityType.trim() || 'General',
        observations,
      });
      setName('');
      setObservationsRaw('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create entity');
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
            <div className="w-7 h-7 rounded-lg bg-mocha-mauve/20 border border-mocha-mauve/40 flex items-center justify-center text-mocha-mauve">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-mocha-text font-mono">Create Knowledge Entity</h3>
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

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">
              Entity Name <span className="text-mocha-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OBS-Templates-Architecture"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-mauve rounded-xl px-3.5 py-2.5 text-xs text-mocha-text placeholder-mocha-overlay0 focus:outline-none transition-all font-mono"
            />
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">
              Entity Type
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SystemArchitecture"
              value={entityType}
              onChange={e => setEntityType(e.target.value)}
              className="w-full bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-mauve rounded-xl px-3.5 py-2.5 text-xs text-mocha-text placeholder-mocha-overlay0 focus:outline-none transition-all font-mono mb-2"
            />
            {/* Type Suggestions */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {mergedTypes.slice(0, 8).map(t => {
                const isSelected = entityType === t;
                const col = getEntityTypeColor(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setEntityType(t)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-mocha-mauve text-mocha-text bg-mocha-surface1'
                        : 'border-mocha-surface1/40 text-mocha-subtext0 hover:border-mocha-surface1 hover:text-mocha-text bg-mocha-surface0/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col }} />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">
              Initial Observations <span className="text-mocha-overlay1 font-normal">(one per line)</span>
            </label>
            <textarea
              rows={4}
              placeholder="OBS broadcast overlay system built in strict system24 TUI aesthetic.&#10;Unified aiohttp Python backend runs on http://127.0.0.1:8787."
              value={observationsRaw}
              onChange={e => setObservationsRaw(e.target.value)}
              className="w-full bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-mauve rounded-xl p-3 text-xs text-mocha-text placeholder-mocha-overlay0 focus:outline-none transition-all leading-relaxed"
            />
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
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-medium text-mocha-crust bg-gradient-to-r from-mocha-mauve to-mocha-sapphire hover:opacity-95 shadow-glow-mauve disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{loading ? 'Creating...' : 'Create Entity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
