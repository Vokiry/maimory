import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MemoryManager } from './memoryManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '4321', 10);
const memoryManager = new MemoryManager();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// SSE Clients list
const sseClients: Response[] = [];

memoryManager.on('change', async () => {
  const graph = await memoryManager.readGraph();
  const status = await memoryManager.getStatus();
  const payload = JSON.stringify({ type: 'update', graph, status });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
});

// SSE endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Status
app.get('/api/status', async (req: Request, res: Response) => {
  try {
    const status = await memoryManager.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Path Switcher
app.post('/api/config/path', async (req: Request, res: Response) => {
  try {
    const { path: newPath } = req.body;
    if (!newPath) return res.status(400).json({ error: 'Path is required' });
    await memoryManager.setFilePath(newPath);
    const status = await memoryManager.getStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Graph data
app.get('/api/graph', async (req: Request, res: Response) => {
  try {
    const graph = await memoryManager.readGraph();
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Entity
app.post('/api/entities', async (req: Request, res: Response) => {
  try {
    const { name, entityType, observations } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Entity name is required' });
    }
    const created = await memoryManager.createEntity({
      name,
      entityType: entityType || 'General',
      observations: Array.isArray(observations) ? observations : [],
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Entity
app.put('/api/entities/:name', async (req: Request, res: Response) => {
  try {
    const oldName = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
    const { name, entityType, observations } = req.body;
    const updated = await memoryManager.updateEntity(oldName, {
      name,
      entityType,
      observations,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Entity
app.delete('/api/entities/:name', async (req: Request, res: Response) => {
  try {
    const name = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
    await memoryManager.deleteEntity(name);
    res.json({ success: true, name });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Create Relation
app.post('/api/relations', async (req: Request, res: Response) => {
  try {
    const { from, to, relationType } = req.body;
    if (!from || !to || !relationType) {
      return res.status(400).json({ error: 'from, to, and relationType are required' });
    }
    const created = await memoryManager.createRelation({ from, to, relationType });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Relation
app.delete('/api/relations', async (req: Request, res: Response) => {
  try {
    const { from, to, relationType } = req.body;
    if (!from || !to || !relationType) {
      return res.status(400).json({ error: 'from, to, and relationType are required' });
    }
    await memoryManager.deleteRelation({ from, to, relationType });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Add Observation
app.post('/api/observations', async (req: Request, res: Response) => {
  try {
    const { entityName, observation } = req.body;
    if (!entityName || !observation) {
      return res.status(400).json({ error: 'entityName and observation are required' });
    }
    const observations = await memoryManager.addObservation(entityName, observation);
    res.json({ entityName, observations });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Observation
app.delete('/api/observations', async (req: Request, res: Response) => {
  try {
    const { entityName, index } = req.body;
    if (!entityName || typeof index !== 'number') {
      return res.status(400).json({ error: 'entityName and numeric index are required' });
    }
    const observations = await memoryManager.deleteObservation(entityName, index);
    res.json({ entityName, observations });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Observation
app.put('/api/observations', async (req: Request, res: Response) => {
  try {
    const { entityName, index, observation } = req.body;
    if (!entityName || typeof index !== 'number' || !observation) {
      return res.status(400).json({ error: 'entityName, index, and observation are required' });
    }
    const observations = await memoryManager.updateObservation(entityName, index, observation);
    res.json({ entityName, observations });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export graph
app.get('/api/export', async (req: Request, res: Response) => {
  try {
    const format = req.query.format === 'jsonl' ? 'jsonl' : 'json';
    const graph = await memoryManager.readGraph();

    if (format === 'jsonl') {
      const lines: string[] = [];
      for (const ent of graph.entities) {
        lines.push(JSON.stringify({ type: 'entity', ...ent }));
      }
      for (const rel of graph.relations) {
        lines.push(JSON.stringify({ type: 'relation', ...rel }));
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="memory.jsonl"');
      return res.send(lines.join('\n') + '\n');
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="memory.json"');
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import graph
app.post('/api/import', async (req: Request, res: Response) => {
  try {
    const { data, mode } = req.body; // mode: 'replace' | 'merge'
    if (!data) return res.status(400).json({ error: 'No data provided' });

    let importedEntities: any[] = [];
    let importedRelations: any[] = [];

    if (typeof data === 'string') {
      // JSONL or JSON string
      const trimmed = data.trim();
      if (trimmed.startsWith('{') && !trimmed.includes('\n')) {
        const parsed = JSON.parse(trimmed);
        importedEntities = parsed.entities || [];
        importedRelations = parsed.relations || [];
      } else {
        const lines = trimmed.split('\n');
        for (const l of lines) {
          if (!l.trim()) continue;
          const parsed = JSON.parse(l);
          if (parsed.type === 'entity') importedEntities.push(parsed);
          else if (parsed.type === 'relation') importedRelations.push(parsed);
        }
      }
    } else if (typeof data === 'object') {
      importedEntities = data.entities || [];
      importedRelations = data.relations || [];
    }

    let finalGraph = { entities: importedEntities, relations: importedRelations };

    if (mode === 'merge') {
      const current = await memoryManager.readGraph();
      const entityMap = new Map<string, any>();
      for (const e of current.entities) entityMap.set(e.name, { ...e });
      for (const e of importedEntities) {
        if (entityMap.has(e.name)) {
          const ex = entityMap.get(e.name);
          ex.observations = Array.from(new Set([...ex.observations, ...(e.observations || [])]));
          if (e.entityType) ex.entityType = e.entityType;
        } else {
          entityMap.set(e.name, e);
        }
      }

      const relationSet = new Set<string>();
      const combinedRelations: any[] = [];
      for (const r of [...current.relations, ...importedRelations]) {
        const key = `${r.from}|${r.relationType}|${r.to}`;
        if (!relationSet.has(key)) {
          relationSet.add(key);
          combinedRelations.push(r);
        }
      }

      finalGraph = {
        entities: Array.from(entityMap.values()),
        relations: combinedRelations,
      };
    }

    await memoryManager.saveGraph(finalGraph);
    res.json({ success: true, graph: finalGraph });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend in production
const clientDistPath = path.resolve(process.cwd(), 'dist/client');
app.use(express.static(clientDistPath));
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Maimory server running on http://127.0.0.1:${PORT}`);
  console.log(`📁 Connected memory file: ${memoryManager.getFilePath()}`);
});
