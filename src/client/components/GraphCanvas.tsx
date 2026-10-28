import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import ForceGraph from 'force-graph';
import { MemoryEntity, MemoryRelation } from '../../shared/types.js';
import { CATPPUCCIN_MOCHA, getEntityTypeColor, hexToRgba } from '../../shared/catppuccin.js';

interface GraphCanvasProps {
  entities: MemoryEntity[];
  relations: MemoryRelation[];
  selectedNodeId: string | null;
  onSelectNode: (node: MemoryEntity | null) => void;
  onSelectRelation: (relation: MemoryRelation | null) => void;
  filterTypes: string[];
  searchQuery: string;
  minDegree: number;
  layoutMode: 'force' | 'radial' | 'td' | 'lr';
  showParticles: boolean;
  particleSpeed: number;
  repulsionForce: number;
  linkDistance: number;
  graphRefInstance?: React.MutableRefObject<any>;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  entities,
  relations,
  selectedNodeId,
  onSelectNode,
  onSelectRelation,
  filterTypes,
  searchQuery,
  minDegree,
  layoutMode,
  showParticles,
  particleSpeed,
  repulsionForce,
  linkDistance,
  graphRefInstance,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);
  const hoveredNodeRef = useRef<any>(null);
  const hoveredLinkRef = useRef<any>(null);

  // Calculate degrees & filter nodes
  const { filteredGraph, neighborMap } = useMemo(() => {
    // Degree map
    const degrees: Record<string, number> = {};
    for (const ent of entities) degrees[ent.name] = 0;
    for (const rel of relations) {
      degrees[rel.from] = (degrees[rel.from] || 0) + 1;
      degrees[rel.to] = (degrees[rel.to] || 0) + 1;
    }

    // Filter nodes
    const query = searchQuery.trim().toLowerCase();
    const visibleNodes = entities.filter(ent => {
      // Type filter
      if (filterTypes.length > 0 && !filterTypes.includes(ent.entityType)) {
        return false;
      }
      // Min degree
      if ((degrees[ent.name] || 0) < minDegree) {
        return false;
      }
      // Search query (matches name, entityType, or observations)
      if (query) {
        const matchesName = ent.name.toLowerCase().includes(query);
        const matchesType = ent.entityType.toLowerCase().includes(query);
        const matchesObs = ent.observations.some(obs => obs.toLowerCase().includes(query));
        if (!matchesName && !matchesType && !matchesObs) return false;
      }
      return true;
    });

    const visibleNodeNames = new Set(visibleNodes.map(n => n.name));

    // Filter links
    const visibleLinks = relations.filter(
      r => visibleNodeNames.has(r.from) && visibleNodeNames.has(r.to)
    );

    // Build neighbor map for focus / dimming effect
    const neighbors = new Map<string, Set<string>>();
    for (const ent of visibleNodes) {
      neighbors.set(ent.name, new Set([ent.name]));
    }
    for (const rel of visibleLinks) {
      neighbors.get(rel.from)?.add(rel.to);
      neighbors.get(rel.to)?.add(rel.from);
    }

    const nodesData = visibleNodes.map(ent => ({
      id: ent.name,
      name: ent.name,
      entityType: ent.entityType,
      observations: ent.observations,
      degree: degrees[ent.name] || 0,
      color: getEntityTypeColor(ent.entityType),
    }));

    const linksData = visibleLinks.map(rel => ({
      id: `${rel.from}-${rel.relationType}-${rel.to}`,
      source: rel.from,
      target: rel.to,
      relationType: rel.relationType,
    }));

    return {
      filteredGraph: { nodes: nodesData, links: linksData },
      neighborMap: neighbors,
    };
  }, [entities, relations, filterTypes, searchQuery, minDegree]);

  // Expose instance
  useEffect(() => {
    if (graphRefInstance) {
      graphRefInstance.current = graphInstanceRef.current;
    }
  }, [graphRefInstance]);

  // Initialize ForceGraph
  useEffect(() => {
    if (!containerRef.current) return;

    const elem = containerRef.current;
    const width = elem.clientWidth || window.innerWidth;
    const height = elem.clientHeight || window.innerHeight;

    const graph = (ForceGraph as any)()(elem)
      .width(width)
      .height(height)
      .backgroundColor(CATPPUCCIN_MOCHA.base)
      .nodeId('id')
      .nodeLabel(() => '') // we render custom labels on canvas
      .linkLabel((link: any) => `${link.source?.name || link.source} ➔ ${link.relationType} ➔ ${link.target?.name || link.target}`)
      .linkDirectionalArrowLength(6)
      .linkDirectionalArrowRelPos(0.9)
      .linkCurvature(0.12)
      .onNodeHover((node: any) => {
        elem.style.cursor = node ? 'pointer' : 'default';
        hoveredNodeRef.current = node || null;
      })
      .onLinkHover((link: any) => {
        elem.style.cursor = link ? 'pointer' : 'default';
        hoveredLinkRef.current = link || null;
      })
      .onNodeClick((node: any) => {
        if (!node) {
          onSelectNode(null);
          return;
        }
        const original = entities.find(e => e.name === node.name) || null;
        onSelectNode(original);
        onSelectRelation(null);
        // Center camera smoothly in visible canvas area (offsetting slightly for right panel)
        const offsetX = window.innerWidth > 1024 ? 100 : 0;
        graph.centerAt(node.x + offsetX, node.y, 800);
        graph.zoom(1.35, 800);
      })
      .onLinkClick((link: any) => {
        if (!link) {
          onSelectRelation(null);
          return;
        }
        const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
        const targetName = typeof link.target === 'object' ? link.target.name : link.target;
        const rel: MemoryRelation = {
          from: sourceName,
          to: targetName,
          relationType: link.relationType,
        };
        onSelectRelation(rel);
        onSelectNode(null);
      })
      .onBackgroundClick(() => {
        onSelectNode(null);
        onSelectRelation(null);
      });

    // Custom Edge Canvas Renderer
    graph.linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = link.source;
      const target = link.target;
      if (
        !source ||
        !target ||
        source.x == null ||
        target.x == null ||
        !isFinite(source.x) ||
        !isFinite(source.y) ||
        !isFinite(target.x) ||
        !isFinite(target.y)
      ) {
        return;
      }

      const activeNode = selectedNodeId || hoveredNodeRef.current?.id;
      const isConnectedToActive =
        activeNode && (source.id === activeNode || target.id === activeNode);
      const isHoveredLink = hoveredLinkRef.current?.id === link.id;

      let alpha = 0.45;
      let strokeColor = CATPPUCCIN_MOCHA.surface1;
      let lineWidth = 1.5;

      if (activeNode) {
        if (isConnectedToActive) {
          alpha = 0.95;
          strokeColor = CATPPUCCIN_MOCHA.lavender;
          lineWidth = 2.5;
        } else {
          alpha = 0.1;
        }
      }

      if (isHoveredLink) {
        alpha = 1.0;
        strokeColor = CATPPUCCIN_MOCHA.mauve;
        lineWidth = 3;
      }

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = hexToRgba(strokeColor, alpha);
      ctx.lineWidth = lineWidth;
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Render edge relation text pill at midpoint only when active or deeply zoomed
      if (isConnectedToActive || isHoveredLink || globalScale > 1.5) {
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const label = link.relationType || '';

        ctx.font = '500 9px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(label).width;
        const paddingX = 6;
        const paddingY = 3;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = 14;

        // Pill background
        ctx.fillStyle = hexToRgba(CATPPUCCIN_MOCHA.mantle, 0.95);
        ctx.strokeStyle = isHoveredLink ? CATPPUCCIN_MOCHA.mauve : hexToRgba(CATPPUCCIN_MOCHA.surface2, Math.max(alpha, 0.6));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - boxWidth / 2, midY - boxHeight / 2, boxWidth, boxHeight, 7);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = isHoveredLink ? CATPPUCCIN_MOCHA.mauve : hexToRgba(CATPPUCCIN_MOCHA.subtext1, Math.max(alpha, 0.7));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);
      }

      ctx.restore();
    });

    // Custom Node Canvas Renderer
    graph.nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x == null || node.y == null || !isFinite(node.x) || !isFinite(node.y)) return;

      const activeNode = selectedNodeId || hoveredNodeRef.current?.id;
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeRef.current?.id === node.id;
      const isConnected = activeNode ? neighborMap.get(activeNode)?.has(node.id) : true;

      // Opacity dimming for non-connected nodes when an entity is focused
      const alpha = activeNode ? (isConnected ? 1 : 0.15) : 1;

      // Base radius scaled with observation count and degree
      const obsCount = node.observations?.length || 0;
      const baseRadius = Math.max(16, Math.min(32, 14 + obsCount * 1.5 + (node.degree || 0) * 1.8));

      ctx.save();
      ctx.globalAlpha = alpha;

      // 1. Neon Glow Halo on Selected or Hovered
      if (isSelected || isHovered) {
        ctx.save();
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isSelected ? 28 : 18;
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseRadius + (isSelected ? 6 : 4), 0, 2 * Math.PI);
        ctx.strokeStyle = hexToRgba(node.color, 0.9);
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Node Body (Radial Gradient)
      const grad = ctx.createRadialGradient(
        node.x - baseRadius * 0.3,
        node.y - baseRadius * 0.3,
        2,
        node.x,
        node.y,
        baseRadius
      );
      grad.addColorStop(0, hexToRgba(CATPPUCCIN_MOCHA.surface1, 0.95));
      grad.addColorStop(1, hexToRgba(CATPPUCCIN_MOCHA.mantle, 0.98));

      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border with entity color
      ctx.strokeStyle = node.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // 3. Center Icon / Type Dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // 4. Observation badge pill (if observations > 0)
      if (obsCount > 0) {
        const badgeRadius = 8;
        const bx = node.x + baseRadius * 0.72;
        const by = node.y - baseRadius * 0.72;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, badgeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = CATPPUCCIN_MOCHA.peach;
        ctx.fill();

        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = CATPPUCCIN_MOCHA.crust;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${obsCount}`, bx, by);
        ctx.restore();
      }

      // 5. Node Name Label Card below node
      const fontSize = Math.max(10, Math.min(13, 11 / Math.sqrt(globalScale)));
      ctx.font = `600 ${fontSize}px "Inter", sans-serif`;

      const text = node.name;
      const textWidth = ctx.measureText(text).width;
      const labelPadX = 8;
      const labelPadY = 4;
      const labelWidth = textWidth + labelPadX * 2;
      const labelHeight = fontSize + labelPadY * 2;
      const labelY = node.y + baseRadius + 4;

      // Label background glass pill
      ctx.fillStyle = hexToRgba(CATPPUCCIN_MOCHA.crust, 0.9);
      ctx.strokeStyle = isSelected ? node.color : hexToRgba(CATPPUCCIN_MOCHA.surface1, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(node.x - labelWidth / 2, labelY, labelWidth, labelHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Label Text
      ctx.fillStyle = isSelected ? CATPPUCCIN_MOCHA.lavender : CATPPUCCIN_MOCHA.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, node.x, labelY + labelHeight / 2);

      // 6. Entity Type Tag (visible when scale is reasonable)
      if (globalScale > 0.8 || isSelected || isHovered) {
        const typeFont = `500 ${Math.max(8, fontSize - 2.5)}px "JetBrains Mono", monospace`;
        ctx.font = typeFont;
        const typeText = node.entityType;
        const typeWidth = ctx.measureText(typeText).width;
        const typeY = labelY + labelHeight + 2;
        const typeHeight = fontSize - 1;
        const typeBoxWidth = typeWidth + 8;

        ctx.fillStyle = hexToRgba(node.color, 0.2);
        ctx.strokeStyle = hexToRgba(node.color, 0.5);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(node.x - typeBoxWidth / 2, typeY, typeBoxWidth, typeHeight, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = node.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeText, node.x, typeY + typeHeight / 2);
      }

      ctx.restore();
    });

    graphInstanceRef.current = graph;

    // Window resize handler
    const handleResize = () => {
      if (elem && graphInstanceRef.current) {
        graphInstanceRef.current.width(elem.clientWidth).height(elem.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphInstanceRef.current) {
        // cleanup force simulation
        try {
          graphInstanceRef.current._destructor?.();
        } catch {}
      }
    };
  }, []);

  // Update Graph Data
  useEffect(() => {
    if (!graphInstanceRef.current) return;
    const graph = graphInstanceRef.current;

    graph.graphData({
      nodes: filteredGraph.nodes,
      links: filteredGraph.links,
    });

    // Set particle animations
    if (showParticles) {
      graph
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(particleSpeed)
        .linkDirectionalParticleWidth(3.5)
        .linkDirectionalParticleColor((link: any) => {
          const targetColor = link.target?.color || CATPPUCCIN_MOCHA.mauve;
          return targetColor;
        });
    } else {
      graph.linkDirectionalParticles(0);
    }
  }, [filteredGraph, showParticles, particleSpeed]);

  // Update Physics forces & Layout mode
  useEffect(() => {
    if (!graphInstanceRef.current) return;
    const graph = graphInstanceRef.current;

    // Apply layout mode
    if (layoutMode === 'td') {
      graph.dagMode('td').dagLevelDistance(60);
    } else if (layoutMode === 'lr') {
      graph.dagMode('lr').dagLevelDistance(80);
    } else if (layoutMode === 'radial') {
      graph.dagMode('radialin').dagLevelDistance(70);
    } else {
      graph.dagMode(null);
    }

    // Tune d3 forces
    const d3Force = graph.d3Force;
    if (d3Force) {
      const charge = d3Force('charge');
      if (charge) charge.strength(-repulsionForce);

      const link = d3Force('link');
      if (link) link.distance(linkDistance);
    }

    // Reheat simulation smoothly
    graph.d3ReheatSimulation();
  }, [layoutMode, repulsionForce, linkDistance]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
    />
  );
};
