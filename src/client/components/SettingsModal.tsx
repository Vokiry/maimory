import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  FolderOpen, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { GraphStatus } from '../../shared/types.js';

interface SettingsModalProps {
  isOpen: boolean;
  status: GraphStatus | null;
  onClose: () => void;
  onUpdatePath: (path: string) => Promise<void>;
  onImportData: (data: string, mode: 'replace' | 'merge') => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  status,
  onClose,
  onUpdatePath,
  onImportData,
}) => {
  const [filePath, setFilePath] = useState(status?.filePath || '');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await onUpdatePath(filePath.trim());
      setMsg({ type: 'success', text: 'Memory path updated and reloaded!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update path' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) setImportText(content);
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (!importText.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await onImportData(importText.trim(), importMode);
      setMsg({ type: 'success', text: `Imported successfully in ${importMode} mode!` });
      setImportText('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to import data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mocha-crust/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel rounded-2xl border border-mocha-surface1 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-mocha-surface1/50 bg-mocha-surface0/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-mocha-blue/20 border border-mocha-blue/40 flex items-center justify-center text-mocha-blue">
              <HardDrive className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-mocha-text font-mono">MCP Memory Storage Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-mocha-overlay1 hover:text-mocha-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {msg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-mocha-green/10 border-mocha-green/30 text-mocha-green'
                  : 'bg-mocha-red/10 border-mocha-red/30 text-mocha-red'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Current File Diagnostics */}
          <div className="bg-mocha-surface0/50 p-4 rounded-xl border border-mocha-surface1/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mocha-text">Active Memory Status</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  status?.connected
                    ? 'bg-mocha-green/20 text-mocha-green border border-mocha-green/40'
                    : 'bg-mocha-red/20 text-mocha-red border border-mocha-red/40'
                }`}
              >
                {status?.connected ? 'Connected & Watching' : 'File Missing'}
              </span>
            </div>

            <div className="text-[11px] font-mono text-mocha-subtext0 break-all bg-mocha-mantle/70 p-2.5 rounded-lg border border-mocha-surface1/30">
              {status?.filePath || 'No file selected'}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-mocha-subtext1 pt-1">
              <div>
                File Size: <span className="font-mono text-mocha-text">{Math.round((status?.fileSize || 0) / 1024 * 10) / 10} KB</span>
              </div>
              <div>
                Entities: <span className="font-mono text-mocha-text">{status?.entityCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Switch File Path Form */}
          <form onSubmit={handleSavePath} className="space-y-3">
            <label className="block text-xs font-semibold text-mocha-subtext1">
              Change Memory File Path (JSONL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filePath}
                onChange={e => setFilePath(e.target.value)}
                placeholder="/path/to/memory.jsonl or ./memory.jsonl"
                className="flex-1 bg-mocha-surface0/60 border border-mocha-surface1/60 focus:border-mocha-blue rounded-xl px-3.5 py-2 text-xs text-mocha-text font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !filePath.trim()}
                className="px-4 py-2 rounded-xl text-xs font-medium text-mocha-crust bg-mocha-blue hover:bg-mocha-blue/90 transition-all cursor-pointer disabled:opacity-50"
              >
                Switch
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-mocha-overlay1 mr-1 py-0.5">Presets:</span>
              <button
                type="button"
                onClick={() => setFilePath('./memory.jsonl')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-mocha-surface0 border border-mocha-surface1/50 text-mocha-subtext1 hover:text-mocha-mauve hover:border-mocha-mauve/40 cursor-pointer"
              >
                ./memory.jsonl (Local)
              </button>
            </div>
          </form>

          {/* Import Knowledge Data */}
          <div className="border-t border-mocha-surface1/50 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-mocha-text flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-mocha-teal" />
                Import Knowledge Graph (JSON / JSONL)
              </span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 text-mocha-subtext1 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-mocha-teal"
                  />
                  <span>Merge</span>
                </label>
                <label className="flex items-center gap-1 text-mocha-subtext1 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-mocha-teal"
                  />
                  <span>Replace</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="px-3 py-2 rounded-xl bg-mocha-surface0 hover:bg-mocha-surface1 border border-mocha-surface1 text-xs text-mocha-text flex items-center gap-2 cursor-pointer transition-colors">
                <FolderOpen className="w-3.5 h-3.5 text-mocha-teal" />
                <span>Choose File (.json / .jsonl)</span>
                <input
                  type="file"
                  accept=".json,.jsonl,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {importText && (
                <button
                  type="button"
                  onClick={handleRunImport}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-mocha-teal text-mocha-crust font-medium text-xs shadow-glow-teal hover:opacity-90 cursor-pointer"
                >
                  Confirm Import
                </button>
              )}
            </div>

            {importText && (
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={4}
                className="w-full bg-mocha-mantle/70 border border-mocha-surface1/50 rounded-xl p-2.5 text-[11px] font-mono text-mocha-text focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
