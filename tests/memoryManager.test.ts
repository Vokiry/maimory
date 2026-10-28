import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../src/server/memoryManager.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('MemoryManager', () => {
  let tmpFile: string;
  let manager: MemoryManager;

  beforeEach(async () => {
    tmpFile = path.join(os.tmpdir(), `test-memory-${Date.now()}-${Math.random().toString(36).substring(7)}.jsonl`);
    manager = new MemoryManager();
    await manager.setFilePath(tmpFile);
  });

  afterEach(async () => {
    try {
      await fs.unlink(tmpFile);
    } catch {}
  });

  it('initializes empty and allows creating entities and relations', async () => {
    const ent1 = await manager.createEntity({
      name: 'AuthService',
      entityType: 'Architecture',
      observations: ['Handles JWT authentication', 'Integrates with Redis for token revocation'],
    });
    expect(ent1.name).toBe('AuthService');

    const ent2 = await manager.createEntity({
      name: 'RedisCluster',
      entityType: 'Component',
      observations: ['Running 3-node cluster'],
    });
    expect(ent2.name).toBe('RedisCluster');

    const rel = await manager.createRelation({
      from: 'AuthService',
      to: 'RedisCluster',
      relationType: 'connectsTo',
    });
    expect(rel.relationType).toBe('connectsTo');

    const graph = await manager.readGraph();
    expect(graph.entities).toHaveLength(2);
    expect(graph.relations).toHaveLength(1);
  });

  it('adds and updates observations', async () => {
    await manager.createEntity({
      name: 'FrontendApp',
      entityType: 'UI',
      observations: ['Uses Vite and React'],
    });

    const updatedObs = await manager.addObservation('FrontendApp', 'Uses Catppuccin Mocha theme');
    expect(updatedObs).toHaveLength(2);
    expect(updatedObs[1]).toBe('Uses Catppuccin Mocha theme');

    await manager.updateObservation('FrontendApp', 0, 'Uses Vite 6 and React 19');
    const finalGraph = await manager.readGraph();
    expect(finalGraph.entities[0].observations[0]).toBe('Uses Vite 6 and React 19');
  });

  it('cascades relation deletion when an entity is deleted', async () => {
    await manager.createEntity({ name: 'A', entityType: 'T', observations: [] });
    await manager.createEntity({ name: 'B', entityType: 'T', observations: [] });
    await manager.createRelation({ from: 'A', to: 'B', relationType: 'links' });

    let graph = await manager.readGraph();
    expect(graph.relations).toHaveLength(1);

    await manager.deleteEntity('A');
    graph = await manager.readGraph();
    expect(graph.entities).toHaveLength(1);
    expect(graph.relations).toHaveLength(0);
  });
});
