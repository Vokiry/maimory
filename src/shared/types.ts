export interface MemoryEntity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface MemoryRelation {
  from: string;
  to: string;
  relationType: string;
}

export type MemoryFileLine =
  | ({ type: 'entity' } & MemoryEntity)
  | ({ type: 'relation' } & MemoryRelation);

export interface MemoryGraphData {
  entities: MemoryEntity[];
  relations: MemoryRelation[];
}

export interface GraphNode extends MemoryEntity {
  id: string;
  degree: number;
  color: string;
  val: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relationType: string;
}

export interface GraphStatus {
  connected: boolean;
  filePath: string;
  resolvedPath: string;
  fileSize: number;
  lastModified: string | null;
  entityCount: number;
  relationCount: number;
  observationCount: number;
}
