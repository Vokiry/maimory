import fs from 'fs/promises';
import { existsSync, watch, FSWatcher } from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { EventEmitter } from 'events';
import { MemoryEntity, MemoryRelation, MemoryGraphData, MemoryFileLine, GraphStatus } from '../shared/types.js';

export class MemoryManager extends EventEmitter {
  private currentPath: string = '';
  private fileWatcher: FSWatcher | null = null;
  private watchDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.currentPath = this.resolveInitialMemoryPath();
    this.startWatcher();
  }

  public resolveInitialMemoryPath(): string {
    // 1. Env variable
    if (process.env.MEMORY_FILE_PATH) {
      const expanded = this.expandHome(process.env.MEMORY_FILE_PATH);
      if (existsSync(expanded)) return expanded;
    }

    // 2. Current directory memory.jsonl
    const localPath = path.resolve(process.cwd(), 'memory.jsonl');
    if (existsSync(localPath)) return localPath;

    // 3. Search under ~/.npm/_npx for mcp-server-memory
    const homeDir = os.homedir();
    const npmNpxDir = path.join(homeDir, '.npm', '_npx');
    try {
      if (existsSync(npmNpxDir)) {
        // Fast sync check for the standard dist path
        const globMatches = this.findNpxMemoryFiles(npmNpxDir);
        if (globMatches.length > 0) {
          return globMatches[0];
        }
      }
    } catch {
      // Ignore directory traversal errors
    }

    // 4. Default fallback: create in project root
    return localPath;
  }

  private expandHome(filepath: string): string {
    if (filepath.startsWith('~/') || filepath === '~') {
      return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
  }

  private findNpxMemoryFiles(baseDir: string): string[] {
    const results: string[] = [];
    try {
      const stdout = execSync(`find "${baseDir}" -name "memory.jsonl" 2>/dev/null`, { encoding: 'utf8' });
      const lines = stdout.trim().split('\n').filter(Boolean);
      return lines;
    } catch {
      return results;
    }
  }

  private startWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }

    if (!existsSync(this.currentPath)) {
      return;
    }

    try {
      this.fileWatcher = watch(this.currentPath, () => {
        if (this.watchDebounceTimer) clearTimeout(this.watchDebounceTimer);
        this.watchDebounceTimer = setTimeout(() => {
          this.emit('change');
        }, 300);
      });
    } catch (err) {
      console.warn(`[MemoryManager] Failed to watch ${this.currentPath}:`, err);
    }
  }

  public getFilePath(): string {
    return this.currentPath;
  }

  public async setFilePath(newPath: string): Promise<void> {
    const resolved = path.resolve(this.expandHome(newPath));
    this.currentPath = resolved;
    this.startWatcher();
    this.emit('change');
  }

  public async getStatus(): Promise<GraphStatus> {
    const exists = existsSync(this.currentPath);
    let fileSize = 0;
    let lastModified: string | null = null;

    if (exists) {
      try {
        const stats = await fs.stat(this.currentPath);
        fileSize = stats.size;
        lastModified = stats.mtime.toISOString();
      } catch {}
    }

    const { entities, relations } = await this.readGraph();
    const observationCount = entities.reduce((acc, curr) => acc + (curr.observations?.length || 0), 0);

    return {
      connected: exists,
      filePath: this.currentPath,
      resolvedPath: path.resolve(this.currentPath),
      fileSize,
      lastModified,
      entityCount: entities.length,
      relationCount: relations.length,
      observationCount,
    };
  }

  public async readGraph(): Promise<MemoryGraphData> {
    if (!existsSync(this.currentPath)) {
      return { entities: [], relations: [] };
    }

    try {
      const content = await fs.readFile(this.currentPath, 'utf8');
      const lines = content.split('\n');

      const entityMap = new Map<string, MemoryEntity>();
      const relations: MemoryRelation[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        try {
          const item = JSON.parse(line) as MemoryFileLine;
          if (item.type === 'entity') {
            if (entityMap.has(item.name)) {
              // Merge observations if duplicate entity line exists
              const existing = entityMap.get(item.name)!;
              const mergedObs = Array.from(new Set([...existing.observations, ...(item.observations || [])]));
              existing.observations = mergedObs;
              if (item.entityType) existing.entityType = item.entityType;
            } else {
              entityMap.set(item.name, {
                name: item.name,
                entityType: item.entityType || 'General',
                observations: Array.isArray(item.observations) ? item.observations : [],
              });
            }
          } else if (item.type === 'relation') {
            if (item.from && item.to && item.relationType) {
              relations.push({
                from: item.from,
                to: item.to,
                relationType: item.relationType,
              });
            }
          }
        } catch {
          // ignore invalid json line
        }
      }

      return {
        entities: Array.from(entityMap.values()),
        relations,
      };
    } catch (err) {
      console.error('[MemoryManager] Error reading file:', err);
      return { entities: [], relations: [] };
    }
  }

  public async saveGraph(data: MemoryGraphData): Promise<void> {
    const lines: string[] = [];

    // Write entities
    for (const ent of data.entities) {
      lines.push(JSON.stringify({
        type: 'entity',
        name: ent.name,
        entityType: ent.entityType,
        observations: ent.observations || [],
      }));
    }

    // Write relations
    for (const rel of data.relations) {
      lines.push(JSON.stringify({
        type: 'relation',
        from: rel.from,
        to: rel.to,
        relationType: rel.relationType,
      }));
    }

    const payload = lines.join('\n') + (lines.length > 0 ? '\n' : '');
    const dir = path.dirname(this.currentPath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    const tmpPath = `${this.currentPath}.tmp.${Date.now()}`;
    await fs.writeFile(tmpPath, payload, 'utf8');
    await fs.rename(tmpPath, this.currentPath);

    this.startWatcher();
    this.emit('change');
  }

  public async createEntity(entity: MemoryEntity): Promise<MemoryEntity> {
    const graph = await this.readGraph();
    const existingIndex = graph.entities.findIndex(e => e.name.toLowerCase() === entity.name.toLowerCase());
    if (existingIndex !== -1) {
      throw new Error(`Entity "${entity.name}" already exists`);
    }

    const newEnt: MemoryEntity = {
      name: entity.name.trim(),
      entityType: entity.entityType.trim() || 'General',
      observations: entity.observations || [],
    };

    graph.entities.push(newEnt);
    await this.saveGraph(graph);
    return newEnt;
  }

  public async updateEntity(oldName: string, updated: Partial<MemoryEntity>): Promise<MemoryEntity> {
    const graph = await this.readGraph();
    const ent = graph.entities.find(e => e.name === oldName);
    if (!ent) {
      throw new Error(`Entity "${oldName}" not found`);
    }

    const newName = updated.name ? updated.name.trim() : ent.name;

    // Check name collision
    if (newName !== oldName && graph.entities.some(e => e.name.toLowerCase() === newName.toLowerCase())) {
      throw new Error(`Entity "${newName}" already exists`);
    }

    ent.name = newName;
    if (updated.entityType) ent.entityType = updated.entityType.trim();
    if (updated.observations) ent.observations = updated.observations;

    // Update cascading relations if name changed
    if (newName !== oldName) {
      for (const rel of graph.relations) {
        if (rel.from === oldName) rel.from = newName;
        if (rel.to === oldName) rel.to = newName;
      }
    }

    await this.saveGraph(graph);
    return ent;
  }

  public async deleteEntity(name: string): Promise<void> {
    const graph = await this.readGraph();
    const initialLen = graph.entities.length;
    graph.entities = graph.entities.filter(e => e.name !== name);
    if (graph.entities.length === initialLen) {
      throw new Error(`Entity "${name}" not found`);
    }

    // Cascade delete relations
    graph.relations = graph.relations.filter(r => r.from !== name && r.to !== name);
    await this.saveGraph(graph);
  }

  public async createRelation(relation: MemoryRelation): Promise<MemoryRelation> {
    const graph = await this.readGraph();
    const fromExists = graph.entities.some(e => e.name === relation.from);
    const toExists = graph.entities.some(e => e.name === relation.to);

    if (!fromExists) throw new Error(`Source entity "${relation.from}" does not exist`);
    if (!toExists) throw new Error(`Target entity "${relation.to}" does not exist`);

    const duplicate = graph.relations.some(
      r => r.from === relation.from && r.to === relation.to && r.relationType === relation.relationType
    );
    if (duplicate) {
      return relation;
    }

    const newRel: MemoryRelation = {
      from: relation.from,
      to: relation.to,
      relationType: relation.relationType.trim(),
    };

    graph.relations.push(newRel);
    await this.saveGraph(graph);
    return newRel;
  }

  public async deleteRelation(relation: MemoryRelation): Promise<void> {
    const graph = await this.readGraph();
    graph.relations = graph.relations.filter(
      r => !(r.from === relation.from && r.to === relation.to && r.relationType === relation.relationType)
    );
    await this.saveGraph(graph);
  }

  public async addObservation(entityName: string, observation: string): Promise<string[]> {
    const graph = await this.readGraph();
    const ent = graph.entities.find(e => e.name === entityName);
    if (!ent) throw new Error(`Entity "${entityName}" not found`);

    const trimmed = observation.trim();
    if (!trimmed) throw new Error('Observation cannot be empty');

    ent.observations.push(trimmed);
    await this.saveGraph(graph);
    return ent.observations;
  }

  public async deleteObservation(entityName: string, index: number): Promise<string[]> {
    const graph = await this.readGraph();
    const ent = graph.entities.find(e => e.name === entityName);
    if (!ent) throw new Error(`Entity "${entityName}" not found`);

    if (index < 0 || index >= ent.observations.length) {
      throw new Error(`Invalid observation index: ${index}`);
    }

    ent.observations.splice(index, 1);
    await this.saveGraph(graph);
    return ent.observations;
  }

  public async updateObservation(entityName: string, index: number, newText: string): Promise<string[]> {
    const graph = await this.readGraph();
    const ent = graph.entities.find(e => e.name === entityName);
    if (!ent) throw new Error(`Entity "${entityName}" not found`);

    if (index < 0 || index >= ent.observations.length) {
      throw new Error(`Invalid observation index: ${index}`);
    }

    const trimmed = newText.trim();
    if (!trimmed) throw new Error('Observation cannot be empty');

    ent.observations[index] = trimmed;
    await this.saveGraph(graph);
    return ent.observations;
  }
}
