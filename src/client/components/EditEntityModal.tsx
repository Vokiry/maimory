import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { MemoryEntity } from '../../shared/types.js';

interface EditEntityModalProps {
  isOpen: boolean;
  entity: MemoryEntity | null;
  onClose: () => void;
  onSubmit: (oldName: string, updated: Partial<MemoryEntity>) => Promise<void>;
}

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  entity,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setEntityType(entity.entityType);
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Entity name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(entity.name, {
        name: name.trim(),
        entityType: entityType.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update entity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mocha-crust/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-mocha-surface1 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-mocha-surface1/50 bg-mocha-surface0/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-mocha-teal/20 border border-mocha-teal/40 flex items-center justify-center text-mocha-teal">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-mocha-text font-mono">Edit Entity</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-mocha-red/10 border border-mocha-red/30 text-mocha-red text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">Entity Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-teal rounded-xl px-3.5 py-2.5 text-xs text-mocha-text focus:outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-mocha-subtext1 mb-1.5">Entity Type</label>
            <input
              type="text"
              required
              value={entityType}
              onChange={e => setEntityType(e.target.value)}
              className="w-full bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-teal rounded-xl px-3.5 py-2.5 text-xs text-mocha-text focus:outline-none transition-all font-mono"
            />
          </div>

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
              className="px-4 py-2 rounded-xl text-xs font-medium text-mocha-crust bg-mocha-teal hover:bg-mocha-teal/90 shadow-glow-teal disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
