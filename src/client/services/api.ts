import { MemoryEntity, MemoryRelation, MemoryGraphData, GraphStatus } from '../../shared/types.js';

const API_BASE = '/api';

export async function fetchGraph(): Promise<MemoryGraphData> {
  const res = await fetch(`${API_BASE}/graph`);
  if (!res.ok) throw new Error(`Failed to fetch graph: ${res.statusText}`);
  return res.json();
}

export async function fetchStatus(): Promise<GraphStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
  return res.json();
}

export async function updateMemoryPath(path: string): Promise<GraphStatus> {
  const res = await fetch(`${API_BASE}/config/path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update memory path');
  }
  const data = await res.json();
  return data.status;
}

export async function createEntity(entity: MemoryEntity): Promise<MemoryEntity> {
  const res = await fetch(`${API_BASE}/entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entity),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create entity');
  }
  return res.json();
}

export async function updateEntity(oldName: string, entity: Partial<MemoryEntity>): Promise<MemoryEntity> {
  const res = await fetch(`${API_BASE}/entities/${encodeURIComponent(oldName)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entity),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update entity');
  }
  return res.json();
}

export async function deleteEntity(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/entities/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete entity');
  }
}

export async function createRelation(relation: MemoryRelation): Promise<MemoryRelation> {
  const res = await fetch(`${API_BASE}/relations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(relation),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create relation');
  }
  return res.json();
}

export async function deleteRelation(relation: MemoryRelation): Promise<void> {
  const res = await fetch(`${API_BASE}/relations`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(relation),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete relation');
  }
}

export async function addObservation(entityName: string, observation: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityName, observation }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add observation');
  }
  const data = await res.json();
  return data.observations;
}

export async function deleteObservation(entityName: string, index: number): Promise<string[]> {
  const res = await fetch(`${API_BASE}/observations`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityName, index }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete observation');
  }
  const data = await res.json();
  return data.observations;
}

export async function updateObservation(entityName: string, index: number, observation: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/observations`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityName, index, observation }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update observation');
  }
  const data = await res.json();
  return data.observations;
}

export async function importGraphData(data: any, mode: 'replace' | 'merge' = 'merge'): Promise<void> {
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, mode }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to import data');
  }
}
