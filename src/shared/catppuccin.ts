export const CATPPUCCIN_MOCHA = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
} as const;

export const ACCENT_PALETTE = [
  CATPPUCCIN_MOCHA.mauve,
  CATPPUCCIN_MOCHA.blue,
  CATPPUCCIN_MOCHA.sapphire,
  CATPPUCCIN_MOCHA.sky,
  CATPPUCCIN_MOCHA.teal,
  CATPPUCCIN_MOCHA.green,
  CATPPUCCIN_MOCHA.yellow,
  CATPPUCCIN_MOCHA.peach,
  CATPPUCCIN_MOCHA.maroon,
  CATPPUCCIN_MOCHA.red,
  CATPPUCCIN_MOCHA.pink,
  CATPPUCCIN_MOCHA.flamingo,
  CATPPUCCIN_MOCHA.lavender,
];

// Semantic color mappings for common MCP knowledge entity types
export const ENTITY_TYPE_COLORS: Record<string, string> = {
  SystemArchitecture: CATPPUCCIN_MOCHA.mauve,
  Architecture: CATPPUCCIN_MOCHA.mauve,
  TechnicalGotcha: CATPPUCCIN_MOCHA.red,
  Gotcha: CATPPUCCIN_MOCHA.red,
  Bug: CATPPUCCIN_MOCHA.maroon,
  ProjectConstraint: CATPPUCCIN_MOCHA.peach,
  Constraint: CATPPUCCIN_MOCHA.peach,
  DevelopmentProcess: CATPPUCCIN_MOCHA.green,
  Process: CATPPUCCIN_MOCHA.green,
  ProjectRoadmap: CATPPUCCIN_MOCHA.blue,
  Roadmap: CATPPUCCIN_MOCHA.blue,
  MilestoneTracker: CATPPUCCIN_MOCHA.yellow,
  Milestone: CATPPUCCIN_MOCHA.yellow,
  Feature: CATPPUCCIN_MOCHA.teal,
  Component: CATPPUCCIN_MOCHA.sapphire,
  Documentation: CATPPUCCIN_MOCHA.lavender,
  DesignPattern: CATPPUCCIN_MOCHA.pink,
  Decision: CATPPUCCIN_MOCHA.sky,
  Research: CATPPUCCIN_MOCHA.flamingo,
};

export function getEntityTypeColor(entityType: string): string {
  if (ENTITY_TYPE_COLORS[entityType]) {
    return ENTITY_TYPE_COLORS[entityType];
  }
  // Deterministic hash for any custom user entity type
  let hash = 0;
  for (let i = 0; i < entityType.length; i++) {
    hash = (hash << 5) - hash + entityType.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ACCENT_PALETTE.length;
  return ACCENT_PALETTE[index];
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
