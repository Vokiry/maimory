import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  MemoryEntity, 
  MemoryRelation, 
  MemoryGraphData, 
  GraphStatus 
} from '../shared/types.js';
import * as api from './services/api.js';
import { GraphCanvas } from './components/GraphCanvas.js';
import { Navbar } from './components/Navbar.js';
import { SidebarFilter } from './components/SidebarFilter.js';
import { EntityInspector } from './components/EntityInspector.js';
import { CreateEntityModal } from './components/CreateEntityModal.js';
import { CreateRelationModal } from './components/CreateRelationModal.js';
import { EditEntityModal } from './components/EditEntityModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { BottomHUD } from './components/BottomHUD.js';

export const App: React.FC = () => {
  // Graph state
  const [entities, setEntities] = useState<MemoryEntity[]>([]);
  const [relations, setRelations] = useState<MemoryRelation[]>([]);
  const [status, setStatus] = useState<GraphStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedEntity, setSelectedEntity] = useState<MemoryEntity | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<MemoryRelation | null>(null);

  // Filters & layout
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minDegree, setMinDegree] = useState(0);
  const [layoutMode, setLayoutMode] = useState<'force' | 'radial' | 'td' | 'lr'>('force');

  // Physics settings
  const [showParticles, setShowParticles] = useState(true);
  const [particleSpeed, setParticleSpeed] = useState(0.005);
  const [repulsionForce, setRepulsionForce] = useState(450);
  const [linkDistance, setLinkDistance] = useState(140);
  const [isPaused, setIsPaused] = useState(false);

  // Modals state
  const [isCreateEntityOpen, setIsCreateEntityOpen] = useState(false);
  const [isCreateRelationOpen, setIsCreateRelationOpen] = useState(false);
  const [relationInitialSource, setRelationInitialSource] = useState<string | null>(null);
  const [editingEntity, setEditingEntity] = useState<MemoryEntity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Graph Canvas Reference
  const graphRef = useRef<any>(null);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [graphData, statusData] = await Promise.all([
        api.fetchGraph(),
        api.fetchStatus(),
      ]);
      setEntities(graphData.entities);
      setRelations(graphData.relations);
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Setup SSE Live Sync
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          setEntities(data.graph.entities);
          setRelations(data.graph.relations);
          setStatus(data.status);

          // Update selected entity if it was modified
          setSelectedEntity((prev) => {
            if (!prev) return null;
            return data.graph.entities.find((e: MemoryEntity) => e.name === prev.name) || null;
          });
        }
      } catch (err) {
        console.error('Error handling SSE update:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedEntity(null);
        setSelectedRelation(null);
        setIsCreateEntityOpen(false);
        setIsCreateRelationOpen(false);
        setEditingEntity(null);
        setIsSettingsOpen(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleSimulation();
      } else if (e.key.toLowerCase() === 'f') {
        handleFitView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Camera Actions
  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.3, 400);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(600, 50);
    }
  };

  const handleResetView = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 500);
      graphRef.current.zoom(1, 500);
    }
  };

  const toggleSimulation = () => {
    if (graphRef.current) {
      if (isPaused) {
        graphRef.current.resumeAnimation();
      } else {
        graphRef.current.pauseAnimation();
      }
      setIsPaused(!isPaused);
    }
  };

  // Export to image
  const handleExportImage = () => {
    if (!graphRef.current) return;
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `maimory-graph-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    }
  };

  // Actions
  const handleCreateEntity = async (newEnt: MemoryEntity) => {
    const created = await api.createEntity(newEnt);
    setEntities(prev => [...prev, created]);
    setSelectedEntity(created);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 },
      colors: ['#cba6f7', '#89b4fa', '#94e2d5', '#f9e2af'],
    });
  };

  const handleCreateRelation = async (newRel: MemoryRelation) => {
    const created = await api.createRelation(newRel);
    setRelations(prev => [...prev, created]);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.2 },
      colors: ['#b4befe', '#fab387', '#a6e3a1'],
    });
  };

  const handleUpdateEntity = async (oldName: string, updated: Partial<MemoryEntity>) => {
    const saved = await api.updateEntity(oldName, updated);
    setEntities(prev => prev.map(e => (e.name === oldName ? saved : e)));
    if (selectedEntity?.name === oldName) {
      setSelectedEntity(saved);
    }
  };

  const handleDeleteEntity = async (name: string) => {
    await api.deleteEntity(name);
    setEntities(prev => prev.filter(e => e.name !== name));
    setRelations(prev => prev.filter(r => r.from !== name && r.to !== name));
    if (selectedEntity?.name === name) {
      setSelectedEntity(null);
    }
  };

  const handleDeleteRelation = async (relation: MemoryRelation) => {
    await api.deleteRelation(relation);
    setRelations(prev =>
      prev.filter(
        r => !(r.from === relation.from && r.to === relation.to && r.relationType === relation.relationType)
      )
    );
    if (
      selectedRelation &&
      selectedRelation.from === relation.from &&
      selectedRelation.to === relation.to &&
      selectedRelation.relationType === relation.relationType
    ) {
      setSelectedRelation(null);
    }
  };

  const handleAddObservation = async (entityName: string, text: string) => {
    const observations = await api.addObservation(entityName, text);
    setEntities(prev =>
      prev.map(e => (e.name === entityName ? { ...e, observations } : e))
    );
    if (selectedEntity?.name === entityName) {
      setSelectedEntity(prev => (prev ? { ...prev, observations } : null));
    }
  };

  const handleDeleteObservation = async (entityName: string, index: number) => {
    const observations = await api.deleteObservation(entityName, index);
    setEntities(prev =>
      prev.map(e => (e.name === entityName ? { ...e, observations } : e))
    );
    if (selectedEntity?.name === entityName) {
      setSelectedEntity(prev => (prev ? { ...prev, observations } : null));
    }
  };

  const handleUpdateObservation = async (entityName: string, index: number, text: string) => {
    const observations = await api.updateObservation(entityName, index, text);
    setEntities(prev =>
      prev.map(e => (e.name === entityName ? { ...e, observations } : e))
    );
    if (selectedEntity?.name === entityName) {
      setSelectedEntity(prev => (prev ? { ...prev, observations } : null));
    }
  };

  const handleUpdatePath = async (newPath: string) => {
    const updatedStatus = await api.updateMemoryPath(newPath);
    setStatus(updatedStatus);
    const graphData = await api.fetchGraph();
    setEntities(graphData.entities);
    setRelations(graphData.relations);
  };

  const handleImportData = async (data: string, mode: 'replace' | 'merge') => {
    await api.importGraphData(data, mode);
    const [graphData, statusData] = await Promise.all([
      api.fetchGraph(),
      api.fetchStatus(),
    ]);
    setEntities(graphData.entities);
    setRelations(graphData.relations);
    setStatus(statusData);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-mocha-base text-mocha-text select-none">
      {/* Top Navigation */}
      <Navbar
        status={status}
        entities={entities}
        onOpenCreateEntity={() => setIsCreateEntityOpen(true)}
        onOpenCreateRelation={() => {
          setRelationInitialSource(null);
          setIsCreateRelationOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectNode={entity => {
          setSelectedEntity(entity);
          setSelectedRelation(null);
          if (graphRef.current) {
            const found = entities.find(e => e.name === entity.name);
            if (found && (found as any).x != null) {
              const offsetX = window.innerWidth > 1024 ? 100 : 0;
              graphRef.current.centerAt((found as any).x + offsetX, (found as any).y, 800);
              graphRef.current.zoom(1.35, 800);
            }
          }
        }}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
        onExportImage={handleExportImage}
      />

      {/* Main Interactive Canvas */}
      <GraphCanvas
        entities={entities}
        relations={relations}
        selectedNodeId={selectedEntity?.name || null}
        onSelectNode={setSelectedEntity}
        onSelectRelation={setSelectedRelation}
        filterTypes={filterTypes}
        searchQuery={searchQuery}
        minDegree={minDegree}
        layoutMode={layoutMode}
        showParticles={showParticles}
        particleSpeed={particleSpeed}
        repulsionForce={repulsionForce}
        linkDistance={linkDistance}
        graphRefInstance={graphRef}
      />

      {/* Left Sidebar Filters */}
      <SidebarFilter
        entities={entities}
        relations={relations}
        selectedEntity={selectedEntity}
        onSelectNode={entity => {
          setSelectedEntity(entity);
          setSelectedRelation(null);
          if (graphRef.current) {
            const found = entities.find(e => e.name === entity.name);
            if (found && (found as any).x != null) {
              const offsetX = window.innerWidth > 1024 ? 100 : 0;
              graphRef.current.centerAt((found as any).x + offsetX, (found as any).y, 800);
              graphRef.current.zoom(1.35, 800);
            }
          }
        }}
        selectedTypes={filterTypes}
        onToggleType={t => {
          setFilterTypes(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
          );
        }}
        onClearTypeFilters={() => setFilterTypes([])}
        minDegree={minDegree}
        onChangeMinDegree={setMinDegree}
        showParticles={showParticles}
        onToggleParticles={() => setShowParticles(!showParticles)}
        particleSpeed={particleSpeed}
        onChangeParticleSpeed={setParticleSpeed}
        repulsionForce={repulsionForce}
        onChangeRepulsionForce={setRepulsionForce}
        linkDistance={linkDistance}
        onChangeLinkDistance={setLinkDistance}
      />

      {/* Right Entity Inspector */}
      <EntityInspector
        entity={selectedEntity}
        relation={selectedRelation}
        allEntities={entities}
        allRelations={relations}
        onClose={() => {
          setSelectedEntity(null);
          setSelectedRelation(null);
        }}
        onSelectNode={ent => {
          setSelectedEntity(ent);
          setSelectedRelation(null);
        }}
        onAddObservation={handleAddObservation}
        onDeleteObservation={handleDeleteObservation}
        onUpdateObservation={handleUpdateObservation}
        onDeleteEntity={handleDeleteEntity}
        onDeleteRelation={handleDeleteRelation}
        onOpenCreateRelationWithSource={sourceName => {
          setRelationInitialSource(sourceName);
          setIsCreateRelationOpen(true);
        }}
        onOpenEditEntity={setEditingEntity}
      />

      {/* Bottom Floating Control HUD */}
      <BottomHUD
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onResetView={handleResetView}
        isPaused={isPaused}
        onTogglePause={toggleSimulation}
      />

      {/* Modals */}
      <CreateEntityModal
        isOpen={isCreateEntityOpen}
        onClose={() => setIsCreateEntityOpen(false)}
        onSubmit={handleCreateEntity}
        existingTypes={Array.from(new Set(entities.map(e => e.entityType)))}
      />

      <CreateRelationModal
        isOpen={isCreateRelationOpen}
        initialSource={relationInitialSource}
        entities={entities}
        onClose={() => {
          setIsCreateRelationOpen(false);
          setRelationInitialSource(null);
        }}
        onSubmit={handleCreateRelation}
      />

      <EditEntityModal
        isOpen={!!editingEntity}
        entity={editingEntity}
        onClose={() => setEditingEntity(null)}
        onSubmit={handleUpdateEntity}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        status={status}
        onClose={() => setIsSettingsOpen(false)}
        onUpdatePath={handleUpdatePath}
        onImportData={handleImportData}
      />
    </div>
  );
};
